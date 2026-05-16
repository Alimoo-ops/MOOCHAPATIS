import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const OrderSchema = z.object({
  product: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(500),
  unitPrice: z.number().min(0).max(1_000_000),
  totalPrice: z.number().min(0).max(10_000_000),
  customerPhone: z.string().min(7).max(20),
  deliveryArea: z.string().min(1).max(120),
  deliveryAddress: z.string().min(1).max(300),
  instructions: z.string().max(1000).optional().default(""),
  paymentMethod: z.string().max(40).optional().default("MPESA"),
});

export type OrderPayload = z.infer<typeof OrderSchema>;

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendTelegramMessage(text: string) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;
  if (!BOT_TOKEN) throw new Error("BOT_TOKEN is not configured");
  if (!CHAT_ID) throw new Error("CHAT_ID is not configured");

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    },
  );

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    description?: string;
  };
  if (!res.ok || !data.ok) {
    throw new Error(
      `Telegram API error [${res.status}]: ${data.description ?? "unknown"}`,
    );
  }
  return data;
}

export const sendOrderToTelegram = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => OrderSchema.parse(input))
  .handler(async ({ data }) => {
    const ts = new Date().toLocaleString("en-KE", {
      timeZone: "Africa/Nairobi",
      hour12: false,
    });

    const lines = [
      "🛵 <b>NEW MOO CHAPATIS ORDER</b>",
      "",
      `🥙 <b>Product:</b> ${escapeHtml(data.product)}`,
      `🔢 <b>Quantity:</b> ${data.quantity}`,
      `💵 <b>Unit Price:</b> KSh ${data.unitPrice.toLocaleString()}`,
      `💰 <b>Total:</b> KSh ${data.totalPrice.toLocaleString()}`,
      `💳 <b>Payment:</b> ${escapeHtml(data.paymentMethod || "MPESA")}`,
      "",
      `📞 <b>Customer:</b> ${escapeHtml(data.customerPhone)}`,
      `📍 <b>Area:</b> ${escapeHtml(data.deliveryArea)}`,
      `🏠 <b>Address:</b> ${escapeHtml(data.deliveryAddress)}`,
      data.instructions
        ? `📝 <b>Instructions:</b> ${escapeHtml(data.instructions)}`
        : "",
      "",
      `🕒 <b>Time:</b> ${ts} (EAT)`,
      "",
      "⏱ <i>Deliver within 30–45 min (7PM–10PM window).</i>",
    ].filter(Boolean);

    try {
      await sendTelegramMessage(lines.join("\n"));
      return { ok: true as const, sentAt: new Date().toISOString() };
    } catch (err) {
      console.error("Telegram send failed:", err);
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  });

export const testTelegram = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      await sendTelegramMessage(
        "✅ <b>Moo Chapatis</b> — Telegram bot test message. If you see this, notifications are working.",
      );
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
);
