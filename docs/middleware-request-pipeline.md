# ServiceHub request pipeline and middleware guide

This guide is the short technical narrative to use when the evaluator asks “where are the middlewares?” The application has both Express/Nest middleware and Nest guards, pipes, and filters; they are separate layers and should be named accurately.

## Request flow

```text
Browser
  → Helmet security headers
  → CORS origin policy
  → request-context middleware (request id + completion log)
  → JSON body parsers (1 MiB general, 35 MiB document route)
  → global actor guard
  → global role guard
  → public-write throttler guard
  → DTO ValidationPipe (whitelist/transform/forbid extras)
  → controller and canonical in-memory store
  → AllExceptionsFilter (stable JSON error)
```

Nest runs middleware before guards and pipes; guards authorize before the handler; the exception filter formats errors raised anywhere in the request. The order above is the operational story, not a claim that every Nest internal hook is an Express middleware.

## Layer map

| Layer | Implementation | What it does | Evaluation proof |
| --- | --- | --- | --- |
| Security headers | `back-end/src/configure-app.ts` (`helmet`) | Adds secure defaults such as `nosniff`, frame/referrer protections, and removes server-identifying defaults. CSP/COEP/HSTS are intentionally disabled for the current static demo compatibility. | Inspect response headers in Swagger or browser DevTools. |
| CORS | `configure-app.ts` | Allows only `FRONTEND_ORIGINS`, defaulting to `http://127.0.0.1:8080` and `http://localhost:8080`; requests with no `Origin` (curl/Swagger) remain usable; unknown origins are rejected. | Send an allowed and an unknown `Origin` header and show the different result. |
| Request context | `back-end/src/common/middleware/request-context.middleware.ts` | Accepts a safe `x-request-id` (1–64 alphanumeric/`._:-`) or generates a UUID, echoes it, strips query strings from logs, and logs method/path/status/duration without bodies. | Send `x-request-id: evaluation-demo-1`; match the response header/body and server log. |
| Body-size boundary | `configure-app.ts` and `documents/document-validation.ts` | Uses a 1 MiB parser for ordinary JSON, a 35 MiB parser only for document JSON, then enforces strict data-URL/MIME/filename checks and a decoded 25 MiB document limit. | Malformed, unsupported, oversized, and unsafe document tests produce bounded errors. |
| Actor guard | `back-end/src/common/guards/actor-context.guard.ts` | For non-public routes, resolves `x-role` plus `x-actor-id` against the seeded store, checks the account is active, and attaches the canonical actor. | Missing/unknown/mismatched headers return `403`/`400` with a request id. |
| Role guard | `back-end/src/common/guards/roles.guard.ts` | Enforces route-level role metadata after actor resolution. | A provider request to an admin/arbitrator route returns `403 FORBIDDEN`. |
| Public throttler | `back-end/src/common/guards/public-throttler.guard.ts` and `common.module.ts` | `@nestjs/throttler` protects public write endpoints only. GET/HEAD/OPTIONS and authenticated routes skip this guard. The tracker is IP + query-free request path, so a login burst cannot starve an unrelated intake form. Defaults are 30 requests per 60 seconds and can be changed with `THROTTLE_LIMIT`/`THROTTLE_TTL_MS`. | Repeated public POSTs return `429 RATE_LIMITED`; public reads and a different public route remain available. |
| DTO validation | Global `ValidationPipe` in `configure-app.ts` | Transforms inputs, strips no fields silently (`forbidNonWhitelisted`), and rejects invalid DTOs before the store mutates state. | Extra fields, invalid dates, missing fields, and malformed document metadata return validation errors. |
| Error boundary | `back-end/src/common/filters/all-exceptions.filter.ts` | Converts known and unknown failures to `{statusCode, code, message, timestamp, path, requestId}`. Unknown errors log a redacted stack and return only `INTERNAL_ERROR`; passwords, tokens, authorization values, data URLs, and document content are not logged. | Trigger 400/403/404/409/429 and compare their stable codes; the test suite also exercises an internal exception. |
| Static delivery | `front-end/server.js` | Serves only GET/HEAD, rejects malformed and traversal paths (including encoded variants), checks real-path containment to close symlink escapes, sets MIME/cache/security headers, and keeps the server alive after a stream error. | The static-server suite covers HEAD, 405, traversal, symlink, MIME, cache, and stream-failure behavior. |

## The important boundary to say aloud

The current demo uses an in-memory identity adapter rather than production authentication. After login, the frontend sends the selected role and canonical actor id as `x-role` and `x-actor-id`; the actor guard verifies that pair on every protected request. This proves RBAC and cross-role isolation in the evaluation build, but it is not a replacement for a signed session/JWT and persistent user store.

Likewise, escrow is a deterministic state transition in the canonical store. A completed booking can release funds; an issued refund award can refund and cancel the disputed booking. No real bank, card, or payment processor is contacted.

## Swagger snippets

With the backend running, these are safe read-only examples:

```bash
curl -i http://127.0.0.1:3000/api/v1/health

curl -i \
  -H 'x-role: customer' \
  -H 'x-actor-id: user_2001' \
  -H 'x-request-id: evaluation-demo-1' \
  http://127.0.0.1:3000/api/v1/users/me

curl -i \
  -H 'x-role: provider' \
  -H 'x-actor-id: user_3001' \
  -H 'x-request-id: evaluation-forbidden-1' \
  http://127.0.0.1:3000/api/v1/users
```

The first protected request should return the supplied request id. The final request should be a normalized `403 FORBIDDEN` because a provider is not an administrator. Swagger exposes the same two evaluation headers as API-key inputs so the evaluator can reproduce this without a separate client.

## Source locations

- App-wide Express setup: `back-end/src/configure-app.ts`
- Request id/logging: `back-end/src/common/middleware/request-context.middleware.ts`
- Actor and role authorization: `back-end/src/common/guards/actor-context.guard.ts`, `roles.guard.ts`
- Public throttling: `back-end/src/common/guards/public-throttler.guard.ts`, `common.module.ts`
- Error normalization/redaction: `back-end/src/common/filters/all-exceptions.filter.ts`
- Document validation: `back-end/src/documents/document-validation.ts`
- Static server hardening: `front-end/server.js`
- Regression coverage: `back-end/test/request-pipeline.e2e-spec.ts`, `front-end/tests/static-server.spec.js`, and `front-end/tests/evaluation-workflows.spec.js`
