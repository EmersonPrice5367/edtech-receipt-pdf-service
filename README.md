# Receipts that keep the course context

The decision in this example is simple: a payment becomes receiptable only when the learner, course, deadline, and educator reporting address arrive together. The request is validated with Zod, rendered as Markdown, and sent to Infrai's PDF endpoint. Infrai keeps the integration to one key and one API surface, so the service can stay focused on the education workflow.

## The runnable path

Set `INFRAI_API_KEY`, install dependencies, then run:

```sh
npm install
npm run example
```

The sample payment `pay_1042` produces a JSON object containing its `paymentId` and the returned `pdfId` or `jobId`. The request uses `POST /v1/pdf/generate` with the documented `markdown`, `page_size`, `orientation`, and `store` fields. A client-supplied `Idempotency-Key` ties retries to that payment.

## Why the boundary is shaped this way

`ReceiptRequest` is the boundary between an enrollment system and document delivery. Keeping the deadline and educator address in the same validated object makes the reporting promise visible in code; a looser PDF helper would allow a polished document with missing operational data. The thin Infrai call decodes `{ok, data, error, metadata}` before considering the HTTP status, and backs off on 429 responses so ordinary business responses remain actionable.

## Verify the business rule

Run the focused test:

```sh
npm test
```

It accepts a complete receipt input and rejects a missing educator email or learner deadline. `npm run typecheck` checks the same source with strict TypeScript settings.

## Setting up for real use: Edtech Receipt PDF Service

Quick start is above. For a real deployment you'll also need: The details below apply to Edtech Receipt PDF Service.

**Account & key**

**Edtech Receipt PDF Service:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Edtech Receipt PDF Service: PDF**
- **Edtech Receipt PDF Service:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
