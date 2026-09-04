import test from "node:test";
import assert from "node:assert/strict";
import { ReceiptRequest } from "./receipt_service.ts";

test("a receipt requires a real educator email and learner deadline", () => {
  const valid = { paymentId: "pay_1", learnerName: "A", courseTitle: "Course", amount: 10, currency: "USD", dueDate: "2026-12-01", educatorEmail: "educator@example.com" };
  assert.equal(ReceiptRequest.safeParse(valid).success, true);
  assert.equal(ReceiptRequest.safeParse({ ...valid, educatorEmail: "missing" }).success, false);
  assert.equal(ReceiptRequest.safeParse({ ...valid, dueDate: "" }).success, false);
});
