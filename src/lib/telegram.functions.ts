import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const OrderSchema = z.object({
  product: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(500),
  unitPrice: z.number().min(0).max(100000),
  total: z.number().min(0).max(10000000),
  phone: z.string().min(7).max(20),
  area: z.string().min(1).max(100),
  location: z.string().min(1).max(300),
  instructions: z.string().max(500).optional().default(""),
});

export const sendOrderToTelegram = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => OrderSchema.parse(input))
  .handler(async ({ data }) => {
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      console.error("[Telegram] Missing BOT_TOKEN or CHAT_ID env");
      return { ok: false, error: "Telegram not configured" };
    }

    const timestamp = new Date().toLocaleString("en-KE", {
      timeZone: "Africa/Nairobi",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const text =
      `🌯 <b>NEW ORDER — Moo Chapatis</b>\n` +
      `━━━━━━━━━━━━━━━\n` +
      `🍽 <b>Product:</b> ${escapeHtml(data.product)}\n` +
      `🔢 <b>Quantity:</b> ${data.quantity}\n` +
      `💰 <b>Unit Price:</b> KSh ${data.unitPrice}\n` +
      `💵 <b>Total:</b> <b>KSh ${data.total}</b>\n` +
      `━━━━━━━━━━━━━━━\n` +
      `📞 <b>Phone:</b> ${escapeHtml(data.phone)}\n` +
      `📍 <b>Area:</b> ${escapeHtml(data.area)}\n` +
      `🏠 <b>Location:</b> ${escapeHtml(data.location)}\n` +
      (data.instructions ? `📝 <b>Notes:</b> ${escapeHtml(data.instructions)}\n` : "") +
      `━━━━━━━━━━━━━━━\n` +
      `🕒 ${timestamp}`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: "HTML",
        }),
      });
      const json = (await res.json()) as { ok?: boolean; description?: string };
      if (!res.ok || !json.ok) {
        console.error("[Telegram] send failed:", json);
        return { ok: false, error: json.description ?? `HTTP ${res.status}` };
      }
      return { ok: true };
    } catch (err) {
      console.error("[Telegram] request error:", err);
      return { ok: false, error: "Network error" };
    }
  });

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
