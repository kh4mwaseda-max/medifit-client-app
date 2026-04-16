import crypto from "crypto";

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET!;

export type LineMessage =
  | { type: "text"; text: string }
  | { type: "template"; altText: string; template: Record<string, unknown> };

/** LINE署名検証 */
export function verifyLineSignature(body: string, signature: string, secret?: string): boolean {
  const hash = crypto
    .createHmac("SHA256", secret ?? CHANNEL_SECRET)
    .update(body)
    .digest("base64");
  return hash === signature;
}

/** LINE画像コンテンツをArrayBufferで取得 */
export async function getMessageContent(messageId: string, token?: string): Promise<ArrayBuffer> {
  const res = await fetch(
    `https://api-data.line.me/v2/bot/message/${messageId}/content`,
    { headers: { Authorization: `Bearer ${token ?? CHANNEL_ACCESS_TOKEN}` } }
  );
  if (!res.ok) throw new Error(`LINE content fetch failed: ${res.status}`);
  return res.arrayBuffer();
}

/** LINEにリプライ送信（テキスト or メッセージオブジェクト） */
export async function replyMessage(
  replyToken: string,
  message: string | LineMessage | LineMessage[],
  token?: string
): Promise<void> {
  const messages = Array.isArray(message)
    ? message
    : typeof message === "string"
    ? [{ type: "text" as const, text: message }]
    : [message];

  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[LINE reply error] ${res.status}: ${body}`);
  }
}

/** LINEにプッシュ送信（テキスト or メッセージオブジェクト） */
export async function pushMessage(
  to: string,
  message: string | LineMessage | LineMessage[],
  token?: string
): Promise<void> {
  const messages = Array.isArray(message)
    ? message
    : typeof message === "string"
    ? [{ type: "text" as const, text: message }]
    : [message];

  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to, messages }),
  });
}

/** 招待リンクメッセージ（テキスト） */
export function inviteLinkMessage(inviteUrl: string): LineMessage[] {
  return [
    {
      type: "text",
      text: `📨 クライアントへの招待リンクが届きました。そのまま転送してください👇\n\n${inviteUrl}`,
    },
  ];
}

/** ログインリンクメッセージ（テキスト） */
export function loginLinkMessage(loginUrl: string): LineMessage[] {
  return [
    {
      type: "text",
      text: `🔐 ログインリンク（10分間有効）\n\n${loginUrl}`,
    },
  ];
}
