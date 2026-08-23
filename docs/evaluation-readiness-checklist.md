# Evaluation readiness checklist

Use this page as the final sign-off sheet on the day of the evaluation. It is a checklist, not a second implementation plan.

## Freeze gate

- [ ] Confirm the intended branch and record `git rev-parse --short HEAD`.
- [ ] Keep the two evaluation plan `.docx` files, generated `output/`, and Python report builders as user artifacts; do not stage them accidentally.
- [ ] Confirm the intended tracked changes are limited to the stabilization commits, `README.md`, the runbook/middleware/checklist docs, and `scripts/demo-preflight.mjs`.
- [ ] Confirm Node.js 20+ and npm 10+ on the presentation machine.
- [ ] Run `cd back-end && npm ci` and `cd front-end && npm ci` before leaving a networked environment.
- [ ] Run `npm run sync:vendor` if the pinned vendor asset set was regenerated, then verify `npm run check:assets`.

## Rehearsal A — normal local run

1. [ ] Start the backend on `127.0.0.1:3000` and frontend on `127.0.0.1:8080` using [the demo runbook](evaluation-demo-runbook.md).
2. [ ] Run `node scripts/demo-preflight.mjs`; all checks pass.
3. [ ] Use a fresh private browser window for `http://127.0.0.1:8080`.
4. [ ] Complete the W1–W9 visitor, account, marketplace, fresh-dispute, prepared-arbitration, and admin sequence.
5. [ ] Complete W10 in Swagger: request id, forbidden role mismatch, validation error, and public-write throttling.
6. [ ] Capture the dynamic service/booking/case ids and one screenshot of the request-id response.

## Rehearsal B — reset and offline resilience

1. [ ] Stop and restart the backend; confirm the deterministic seed restores `booking_6001`, `booking_6002`, `case_8001`, `hearing_10001`, and `award_12001`.
2. [ ] Clear site data for `http://127.0.0.1:8080` only and repeat the evaluator suite from a fresh browser context.
3. [ ] Run the targeted offline asset smoke (`cd front-end && npx playwright test tests/offline-assets.spec.js`). The full frontend suite includes this targeted test, but only that test installs the external-origin blocker.
4. [ ] Confirm the critical local vendor assets still load if the venue network is disconnected; decorative remote imagery may be absent.
5. [ ] If a port is occupied, follow the safe, process-specific instructions in the runbook; never kill an unrelated process.

## Automated release gates

Run these from the repository root (or the indicated directory) and keep the output with the evidence pack:

```bash
(cd back-end && npm run check)
(cd back-end && npm run build)
(cd back-end && npm run test:e2e)
```

```bash
(cd front-end && npm run check:js)
(cd front-end && npm run check:assets)
(cd front-end && npm run test:e2e)
```

```bash
node scripts/demo-preflight.mjs
```

- [ ] Backend type-check, build, and all e2e suites pass.
- [ ] Frontend JavaScript/static-asset checks and all Playwright suites pass.
- [ ] Preflight passes while both local servers are running.
- [ ] Repeat the evaluator workflow or full browser suite a second time after the reset; no stale state or throttle counter leaks into another route.
- [ ] `git diff --check` is clean.

## Middleware narrative

- [ ] Explain the distinction between Express middleware, Nest guards, the global validation pipe, and the exception filter using [the middleware guide](middleware-request-pipeline.md).
- [ ] Name request ids, Helmet/CORS, body limits/document validation, actor/role authorization, route-scoped public throttling, and stable redacted errors.
- [ ] State clearly that `x-role`/`x-actor-id`, in-memory data, and escrow transitions are evaluation adapters, not production authentication or payment settlement.

## Evidence pack

- [ ] Preflight output with all checks passing.
- [ ] Backend and frontend release-gate output.
- [ ] One screenshot showing Swagger response `x-request-id` and normalized error shape.
- [ ] A short 2–3 minute screen recording of the visitor → login → booking/dispute → Swagger request-id rehearsal, with no passwords, tokens, or document contents visible.
- [ ] A note listing the dynamic ids and final statuses shown during the run.
- [ ] Keep the prepared checkout with `node_modules/` and `front-end/assets/vendor/` available as the offline fallback.

## Final handoff

- [ ] Leave the runbook and middleware guide open or bookmarked.
- [ ] Keep Terminal A/B commands visible and know how to reset by restarting only the backend.
- [ ] Stop both servers after rehearsal; restart them immediately before the presentation.
- [ ] Present current application behavior and known evaluation boundaries honestly; do not imply a real bank, persistent database, KYC provider, or production auth layer exists in this build.
