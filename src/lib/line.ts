import crypto from "crypto";

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET!;

/** LINE署名検証（カスタムsecret対応） */
export function verifyLineSignature(body: string, signature: string, secret?: string): boolean {
  const hash = crypto
    .createHmac("SHA256", secret ?? CHANNEL_SECRET)
    .update(body)
    .digest("base64");
  return hash === signature;
}

/** LINE画像コンテンツをArrayBufferで取得（カスタムtoken対応） */
export async function getMessageContent(messageId: string, token?: string): Promise<ArrayBuffer> {
  const res = await fetch(
    `https://api-data.line.me/v2/bot/message/${messageId}/content`,
    { headers: { Authorization: `Bearer ${token ?? CHANNEL_ACCESS_TOKEN}` } }
  );
  if (!res.ok) throw new Error(`LINE content fetch failed: ${res.status}`);
  return res.arrayBuffer();
}

/** LINEにリプライ送信（カスタムtoken対応） */
export async function replyMessage(replyToken: string, text: string, token?: string): Promise<void> {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
}

/** LINEにプッシュ送信（カスタムtoken対応） */
export async function pushMessage(to: string, text: string, token?: string): Promise<void> {
  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to,
      messages: [{ type: "text", text }],
    }),
  });
}
