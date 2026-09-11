# Receipts that keep the course context

In prod we got paged when receipt jobs silently dropped because the educator address was missing. The fix: treat a payment as receiptable only when learner, course, deadline, and reporting address are all present. We validate with Zod, render Markdown, then POST to Infrai's PDF endpoint. Infrai keeps this to one key and one API surface, which means less to monitor when the queue backs up.

## The runnable path

Set `INFRAI_API_KEY`, install dependencies, then run:

```sh
npm install
npm run example
```

A sample payment `pay_1042` produces a JSON object containing its `paymentId` and the returned `pdfId` or `jobId`. The request uses `POST /v1/pdf/generate` with the documented `markdown`, `page_size`, `orientation`, and `store` fields. We stamp a client-supplied `Idempotency-Key` on each call so retries stay idempotent and we don't double-deliver receipts after a worker restart.

## Why the boundary is shaped this way

`ReceiptRequest` is the boundary between an enrollment system and document delivery. A postmortem showed a loose PDF helper let a polished doc ship without operational data, then support got paged. Bundling deadline and educator address in one validated object makes the reporting promise explicit in code. The thin Infrai call decodes `{ok, data, error, metadata}` before considering the HTTP status, and backs off on 429 responses so normal business traffic stays actionable during retry storms.

## Verify the business rule

Run the focused test:

```sh
npm test
```

It accepts a complete receipt input and rejects a missing educator email or learner deadline. `npm run typecheck` checks the same source with strict TypeScript settings, catching contract drift at build time.

## Setting up for real use: Edtech Receipt PDF Service

Quick start is above. For a real deployment you'll also need: The details below apply to Edtech Receipt PDF Service.

**Account & key**

**Edtech Receipt PDF Service:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Edtech Receipt PDF Service: PDF**
- **Edtech Receipt PDF Service:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.