const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const defaultRootDir = __dirname;
const defaultPort = Number(process.env.PORT || 8080);
const defaultHost = process.env.HOST || "127.0.0.1";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".otf": "font/otf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const cacheableExtensions = new Set([
  ".css",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".mjs",
  ".png",
  ".svg",
  ".ttf",
  ".otf",
  ".wasm",
  ".webp",
  ".woff",
  ".woff2",
]);

function securityHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
}

function sendText(response, statusCode, message) {
  if (!response.headersSent) {
    response.writeHead(statusCode, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Length": Buffer.byteLength(message),
    });
  }
  response.end(response.req && response.req.method === "HEAD" ? undefined : message);
}

function hasTraversal(pathValue) {
  return /(?:^|[\\/])\.\.(?:[\\/]|$)/.test(pathValue);
}

function resolveRequestPath(rawUrl, rootDir) {
  const rawPath = String(rawUrl || "/").split("?", 1)[0] || "/";
  if (!rawPath.startsWith("/")) return { kind: "bad-request" };

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    return { kind: "bad-request" };
  }

  let doubleDecodedPath = decodedPath;
  try {
    doubleDecodedPath = decodeURIComponent(decodedPath);
  } catch {
    // A literal percent in a filename is safe after the first valid decode.
  }

  if (
    hasTraversal(rawPath)
    || hasTraversal(decodedPath)
    || hasTraversal(doubleDecodedPath)
    || decodedPath.includes("\\")
    || decodedPath.includes("\0")
  ) {
    return { kind: "forbidden" };
  }

  const relativePath = decodedPath.replace(/^\/+/, "");
  const resolvedRoot = path.resolve(rootDir);
  const filePath = relativePath
    ? path.resolve(resolvedRoot, relativePath)
    : path.join(resolvedRoot, "Landing_Page", "index.html");
  const rootPrefix = `${resolvedRoot}${path.sep}`;

  if (filePath !== resolvedRoot && !filePath.startsWith(rootPrefix)) {
    return { kind: "forbidden" };
  }
  return { kind: "file", filePath };
}

function cacheControlFor(extension) {
  if (extension === ".html") return "no-store";
  if (cacheableExtensions.has(extension)) return "public, max-age=300";
  return "no-store";
}

function checkRealPathContainment(fsModule, rootDir, targetPath, callback) {
  const realpath = typeof fsModule.realpath === "function"
    ? fsModule.realpath.bind(fsModule)
    : fs.realpath;

  realpath(rootDir, (rootError, realRoot) => {
    if (rootError) {
      callback(rootError);
      return;
    }
    realpath(targetPath, (targetError, realTarget) => {
      if (targetError) {
        callback(targetError);
        return;
      }
      const rootPrefix = `${path.resolve(realRoot)}${path.sep}`;
      if (realTarget !== path.resolve(realRoot) && !realTarget.startsWith(rootPrefix)) {
        const containmentError = new Error("Resolved path is outside the static root");
        containmentError.code = "OUTSIDE_ROOT";
        callback(containmentError);
        return;
      }
      callback(null, realTarget);
    });
  });
}

function createStaticServer(options = {}) {
  const rootDir = path.resolve(options.rootDir || defaultRootDir);
  const fsModule = options.fsModule || fs;

  return http.createServer((request, response) => {
    securityHeaders(response);

    if (request.method !== "GET" && request.method !== "HEAD") {
      response.setHeader("Allow", "GET, HEAD");
      sendText(response, 405, "Method not allowed");
      return;
    }

    const resolved = resolveRequestPath(request.url || "/", rootDir);
    if (resolved.kind === "bad-request") {
      sendText(response, 400, "Bad request");
      return;
    }
    if (resolved.kind === "forbidden") {
      sendText(response, 403, "Forbidden");
      return;
    }

    fsModule.stat(resolved.filePath, (statError, stats) => {
      if (statError) {
        sendText(response, 404, "Not found");
        return;
      }

      const finalPath = stats.isDirectory()
        ? path.join(resolved.filePath, "index.html")
        : resolved.filePath;

      fsModule.stat(finalPath, (finalStatError, finalStats) => {
        if (finalStatError || finalStats.isDirectory()) {
          sendText(response, 404, "Not found");
          return;
        }

        checkRealPathContainment(fsModule, rootDir, finalPath, (containmentError, realTargetPath) => {
          if (containmentError) {
            sendText(response, containmentError.code === "OUTSIDE_ROOT" ? 403 : 404, containmentError.code === "OUTSIDE_ROOT" ? "Forbidden" : "Not found");
            return;
          }

          // Re-stat and open the canonical target, not the original lexical path.
          // This prevents a symlink swap between validation and streaming from
          // redirecting the response outside the static root.
          fsModule.stat(realTargetPath, (resolvedStatError, resolvedStats) => {
            if (resolvedStatError || resolvedStats.isDirectory()) {
              sendText(response, 404, "Not found");
              return;
            }

            const extension = path.extname(realTargetPath).toLowerCase();
            const headers = {
              "Content-Type": mimeTypes[extension] || "application/octet-stream",
              "Cache-Control": cacheControlFor(extension),
              "Content-Length": String(resolvedStats.size),
            };

            if (request.method === "HEAD") {
              response.writeHead(200, headers);
              response.end();
              return;
            }

            let stream;
            try {
              stream = fsModule.createReadStream(realTargetPath);
            } catch {
              sendText(response, 500, "Unable to read file");
              return;
            }

            stream.once("error", () => {
              // The response may already have headers, so abort only this request.
              // The server remains available for the next evaluator workflow.
              if (response.headersSent) response.destroy();
              else sendText(response, 500, "Unable to read file");
            });
            response.writeHead(200, headers);
            stream.pipe(response);
          });
        });
      });
    });
  });
}

function startServer(options = {}) {
  const server = createStaticServer(options);
  const port = Number(options.port ?? defaultPort);
  const host = options.host || defaultHost;
  server.listen(port, host, () => {
    console.log(`Frontend running at http://${host}:${port}`);
    console.log(`Landing page: http://${host}:${port}/Landing_Page/index.html`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  cacheControlFor,
  createStaticServer,
  mimeTypes,
  resolveRequestPath,
  startServer,
};
