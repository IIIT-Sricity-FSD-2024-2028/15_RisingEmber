# ServiceHub evaluation demo runbook

This is the repeatable, local-only walkthrough for the evaluation build. It is intentionally written for a clean machine and a fresh browser profile; it does not change any page or workflow.

## 1. Start from a known state

Requirements: Node.js 20 or newer and npm 10 or newer.

Use two terminals from the repository root:

```bash
cd back-end
npm ci
npm run check
npm run build
npm run start:dev
```

```bash
cd front-end
npm ci
npm run check:js
npm run check:assets
npm start
```

The backend listens on `http://127.0.0.1:3000`; the static frontend listens on `http://127.0.0.1:8080`. Before opening the browser, run:

```bash
node scripts/demo-preflight.mjs
```

The preflight checks the runtime, installed dependencies, all pinned local vendor assets, backend health, Swagger, the landing page, the seeded customer login, and an authorized `/users/me` read. A failed check prints the corrective command. Swagger is at http://127.0.0.1:3000/api-docs.

The backend uses an in-memory evaluation store, so resetting its state requires stopping and restarting the backend. For a clean browser run, open `http://127.0.0.1:8080`, in a fresh private window or clear site data for that origin only. Do not delete the entire browser profile.

## 2. Evaluation-only accounts

These credentials are seeded for the demo and are not production authentication:

| Role | Email | Password | Actor ID |
| --- | --- | --- | --- |
| Admin | `admin@servicehub.test` | `admin123` | `user_1001` |
| Customer (primary) | `aarav@servicehub.test` | `customer123` | `user_2001` |
| Customer (dispute) | `siya@servicehub.test` | `customer123` | `user_2002` |
| Provider (primary) | `rohan@servicehub.test` | `provider123` | `user_3001` |
| Provider (dispute) | `neha@servicehub.test` | `provider123` | `user_3002` |
| Arbitrator (primary) | `kabir@servicehub.test` | `arbitrator123` | `user_4001` |
| Arbitrator (backup) | `tara@servicehub.test` | `arbitrator123` | `user_4002` |

If using Swagger or curl for a protected endpoint, send the matching `x-role` and `x-actor-id` headers. The browser adapters set these evaluation headers after a successful login.

## 3. The 12–15 minute walkthrough

Keep one browser tab per role when possible. Re-login rather than carrying a stale tab through a backend reset.

1. **Visitor and public intake (W1).** Open `Landing_Page/index.html`, browse public services, open the contact form, submit a waitlist/contact request, and show that public catalogue reads work without an actor.
2. **Account boundary (W2).** Log in as Aarav, Rohan, Kabir, and Naina in their corresponding portals. Show Aarav’s profile read/update round-trip. Optionally enter one wrong password to demonstrate the normalized error toast, then log in correctly.
3. **Marketplace (W3–W5).** As Rohan, create a service with a distinctive title and note its generated `service_*` id. As Aarav, find it and book it. As Rohan, accept, start, and mark the booking completed from the provider tracking page; as Aarav, observe `completed` and `escrowStatus: released`, then submit the review. The browser test suite uses the same sequence and additionally verifies the canonical API record.
4. **Fresh dispute (W6).** In Aarav’s customer portal, open **Raise dispute** from the eligible seeded `booking_6001`. First submit a short description to show the form validation message, then submit a valid category and description. Capture the redirected `case_*` id. Show the booking becoming `disputed` with `funds_locked`, then view the same case as Rohan, Kabir, and Naina to demonstrate participant and administrative visibility.
5. **Prepared arbitration (W7–W8).** Use the seeded dispute `case_8001` for the deeper evidence path: Siya (customer) and Neha (provider) can view the case, messages, and documents; Kabir opens `hearing_10001`, adds or reviews evidence/messages, and updates the award `award_12001`. Issue the award with decision `refund_to_customer`. Finish the case as `resolved`/`closed` and show `booking_6002` as `cancelled` with `escrowStatus: refunded` from the customer/provider views.
6. **Admin controls (W9).** In the admin portal, show users, cases, hearings, documents, awards, and settings. Disable and re-enable a temporary public user, and change a visible settings value then restore it. A failed list/settings request should leave the existing canonical value unchanged and display the error toast.
7. **Middleware proof (W10).** Leave the UI on a working page and open Swagger. Send one request with `x-request-id: evaluation-demo-1`; show the same id in the response header/body. Try a mismatched `x-role`/`x-actor-id` pair to show `403 FORBIDDEN`, a malformed document to show `400 VALIDATION_ERROR`/`BAD_REQUEST`, and repeated public POST requests to show `429 RATE_LIMITED`. The request-pipeline explanation is in [middleware-request-pipeline.md](middleware-request-pipeline.md).

Do not spend demo time creating additional accounts or relying on remote images. Decorative remote images may be absent during an offline test; the critical JavaScript, CSS, fonts, and export libraries are vendored locally.

## 4. Expected records and checkpoints

| Checkpoint | Expected state |
| --- | --- |
| Dynamic marketplace path | `service_*`; booking moves `requested` → `confirmed` → `in_progress` → `completed`; escrow ends `released` |
| Fresh dispute | booking `booking_6001`; a new `case_*`; booking `disputed`; escrow `funds_locked` |
| Prepared dispute | `case_8001` / `booking_6002`; hearing `hearing_10001`; award `award_12001`; final case `resolved`/`closed`; booking `cancelled`/`refunded` |
| Admin verification | The same changed user/settings values are visible after the update and after the restore |

The exact dynamic ids are deliberately generated by the canonical store. Record them in a screenshot or evaluation notes when presenting the run.

## 5. Recovery during the demo

- **Backend or Swagger is unavailable:** check Terminal A, restart `npm run start:dev`, wait for the startup line, rerun `node scripts/demo-preflight.mjs`, and refresh the browser.
- **Frontend is unavailable:** check Terminal B and restart `npm start` on port 8080.
- **A port is occupied:** inspect only the expected listener first (`lsof -nP -iTCP:3000 -sTCP:LISTEN` or `lsof -nP -iTCP:8080 -sTCP:LISTEN`). If the command is an old ServiceHub process, stop that specific PID with `kill <pid>` and restart. Do not kill an unrelated process; ask the venue administrator for a free port or use another approved machine instead. The browser/API URLs in this runbook assume ports 3000 and 8080.
- **A role appears stuck:** close that tab, clear site data for `http://127.0.0.1:8080` only, and log in again. Do not reuse a stale local-storage session after a backend reset.
- **A prepared record was already changed:** restart the backend to restore the deterministic seed, then repeat the prepared arbitration path.
- **An API error appears:** read the `code`, `message`, and `requestId` in the response or toast. The corresponding request is in the browser console only as a structured, redacted error; never paste passwords or document data into notes.
- **The venue network is unavailable:** continue with `127.0.0.1`; the critical JavaScript, CSS, fonts, and export libraries are local. Run `npm run check:assets` and `node scripts/demo-preflight.mjs` (with both local servers running) to demonstrate the offline path. Decorative remote images may be blank. If a dependency is missing and the venue has no network, do not attempt an online reinstall—use the prepared checkout with `node_modules` and `front-end/assets/vendor/`, or move to the prepared backup machine.

At the end, stop both servers with Ctrl-C. Keep the preflight output, the final test output, one screenshot of the Swagger request-id response, and a short (about 2–3 minute) screen recording of the visitor → login → booking/dispute → Swagger request-id rehearsal as backup evidence. The recording should show only the demo flow; do not record passwords, tokens, or document contents.

## 6. What this build is and is not

This evaluation build demonstrates the current application and its control flow. It uses an in-memory store, simulated escrow/refund/release transitions, and evaluation-only `x-role`/`x-actor-id` identity context. It does not claim production JWT/session security, a persistent database, a real bank/escrow provider, KYC verification, or real payment settlement. Those boundaries are called out in the presentation rather than hidden.
