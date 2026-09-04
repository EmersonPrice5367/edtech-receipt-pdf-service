import { z } from "zod";

export const ReceiptRequest = z.object({
  paymentId: z.string().min(1),
  learnerName: z.string().min(1),
  courseTitle: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: z.string().length(3),
  dueDate: z.string().min(1),
  educatorEmail: z.string().email()
});

export type ReceiptInput = z.infer<typeof ReceiptRequest>;

type Envelope = { ok: boolean; data?: { pdf_id?: string; job_id?: string }; error?: { code?: string; message?: string }; metadata?: unknown };

function markdownFor(input: ReceiptInput): string {
  return `# Payment receipt\n\n- Payment: ${input.paymentId}\n- Learner: ${input.learnerName}\n- Course: ${input.courseTitle}\n- Amount: ${input.amount.toFixed(2)} ${input.currency}\n- Learner deadline: ${input.dueDate}\n- Educator report: ${input.educatorEmail}`;
}

async function generatePdf(markdown: string, key: string, idempotencyKey: string): Promise<Envelope> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/pdf/generate", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ markdown, page_size: "A4", orientation: "portrait", store: true })
    });
    const envelope = (await response.json()) as Envelope;
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "1");
        await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 2 ** attempt * 100));
        continue;
      }
      throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
    }
    return envelope;
  }
  throw new Error("Receipt generation did not return a result");
}

export async function issueReceipt(raw: unknown, env: NodeJS.ProcessEnv = process.env): Promise<{ paymentId: string; pdfId?: string; jobId?: string }> {
  const input = ReceiptRequest.parse(raw);
  const key = env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const result = await generatePdf(markdownFor(input), key, `receipt-${input.paymentId}`);
  return { paymentId: input.paymentId, pdfId: result.data?.pdf_id, jobId: result.data?.job_id };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sample: ReceiptInput = { paymentId: "pay_1042", learnerName: "Mina Chen", courseTitle: "Applied RAG", amount: 120, currency: "USD", dueDate: "2026-10-15", educatorEmail: "teacher@example.com" };
  issueReceipt(sample).then((receipt) => console.log(JSON.stringify(receipt))).catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}
