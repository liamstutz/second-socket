# Second Socket

**One donor. More second chances.**

A repair workshop often needs one working part from each of several broken computers. Second Socket treats the entire bench as one allocation problem: route technician notes with a small local ML model, check component compatibility, choose the set of donor purchases that restores the most machines under budget, then create an itemized PayPal Sandbox order.

## Run the working application

Requires Node.js 22 or newer. There are no package dependencies and no install step.

```sh
node build.mjs
node server.mjs
```

Open **http://127.0.0.1:4173**. Use that exact address with the local server. The planner, note classifier, evidence dialogs, inventory toggles and JSON manifest export work without any API credentials. Fonts have local fallbacks if offline.

```sh
node --test engine.test.mjs
```

## Enable PayPal Sandbox checkout

1. Sign in to https://developer.paypal.com/dashboard/ and create or select a **Sandbox** REST application. Obtain its sandbox client ID and secret. Use a sandbox business account as the merchant and a separate sandbox personal account as the buyer.
2. Copy `.env.example` to `.env` and enter **sandbox credentials only**. Keep `.env` private; it is ignored by Git. Never put the client secret in browser code, a screenshot, the project story, or a public repository.
3. Restart using `node --env-file=.env server.mjs` after building.
4. Load the three-PC challenge. Review compatibility and check the human confirmation box. Click the PayPal button, approve with the sandbox buyer, and return to the app.
5. Verify that the UI shows a completed sandbox capture, the order ID, and the expected $68.00. Cancel another checkout and confirm that it does not claim success.

The integration uses OAuth client credentials, Orders v2 create and capture, and the PayPal JavaScript SDK. The backend only calls `api-m.sandbox.paypal.com`. The public client ID is returned to the SDK; the secret stays server-side.

On Sites hosting, configure `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` as runtime environment variables and deploy again. The generated `dist/server/index.js` is a dependency-free Cloudflare Worker with a default `fetch` export. `.openai/hosting.json` holds the Site identity, not credentials.

**Current verification:** 16 automated tests pass, including provider-response fixtures for checkout integrity. Actual PayPal sandbox account-to-account checkout has not yet been run. The app shows a disconnected state until sandbox credentials are supplied. Provider fixtures are not a live PayPal integration test.

## Three-minute judge walkthrough

1. Default three-PC bench, $75 budget: one $68 donor supplies memory, an SSD and a PSU. No component is used twice.
2. Open **Check fit** to inspect the requirements and supplied evidence.
3. Inspect the $39 older donor: DDR3 does not fit DDR4; its proprietary 180 W PSU does not fit the ATX 450 W requirement.
4. Set the budget to $55: the solver switches to $51 of individual parts and leaves one machine waiting.
5. Restore $75, disable the main donor's availability, and watch the plan change. Restore it.
6. Paste a storage-failure technician note into AI triage. Try unrelated text to see abstention. The model never silently changes a confirmed requirement.
7. Download the JSON repair manifest. With credentials configured, complete and verify a PayPal sandbox order.

## Architecture and distinctive choice

- `triage.js`: multinomial Naive Bayes learned from 36 authored synthetic notes (12 per class). Add-one smoothing; vocabulary-coverage and score thresholds produce abstention. A small model is deliberate: reproducible, inspectable and offline. It is not an LLM or a real-world diagnostic model.
- `engine.js`: explicit compatibility predicates plus exhaustive offer-subset search and a backtracking allocation. Objective: maximize completed repair plans within budget, then minimize spend. Each physical part can be used once. Buying a donor incurs its full price even if some parts remain unused.
- `api.js`: server-recomputed totals, same-origin POST checks, a signed checkout receipt bound to an HttpOnly browser cookie, idempotent capture IDs, and verification of completed capture amount, currency and plan reference.
- `app.js`: accessible interactive workbench, model disclosure, compatibility receipts and manifest export.
- `build.mjs`: bundles assets and API code into one Worker. `server.mjs` adapts the same Worker to Node for local judging.

The important product decision is to optimize **across machines**, not recommend a replacement for each machine independently. A single donor can be more useful than its individual sticker price suggests.

## Model and data limitations

All machines, technician notes, prices, listings, sellers and test evidence are **synthetic demo data**. A planned repair is not proof that a computer has been restored. No carbon, waste, user-adoption or real-world savings measurements are claimed. The $21 example is an exact comparison within this illustrative catalog, not a market-price claim.

The classifier has only three categories. Nine separate authored synthetic evaluation phrases pass; four unrelated/empty examples abstain. These are small developer checks, not a representative benchmark or evidence of field accuracy. Scores are uncalibrated. Human confirmation is always required.

Compatibility covers only the explicitly modeled constraints. Real deployment needs exact manufacturer part numbers, motherboard support, RAM electrical/ECC details, drive clearance, PSU rail/connectors/cabling and qualified technician verification. Do not open or service a PSU using this app.

This prototype has no real inventory reservations, shipping, taxes, merchant onboarding, durable order database, refunds, webhook reconciliation or fulfillment. A production marketplace would need all of them. It intentionally supports one synthetic merchant and local pickup. No real payment endpoints are implemented.

## Submission status

Implemented during the November 2026 hackathon period with AI coding assistance. Public source: https://github.com/liamstutz/second-socket . A recorded YouTube demonstration and a real sandbox checkout verification must be completed before final submission. Do not claim those steps have happened until verified.

## References

- [Official hackathon rules](https://paypalaihackathon.devpost.com/rules)
- [PayPal standard checkout integration](https://developer.paypal.com/studio/checkout/standard/integrate)
- [PayPal Dev Days 2025 winners](https://developer.paypal.com/community/blog/winners-dev-days-hackathon/)

MIT licensed. See `LICENSE`.


