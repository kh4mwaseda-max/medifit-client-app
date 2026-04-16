import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const tokenMatch = env.match(/^LINE_CHANNEL_ACCESS_TOKEN=(.*)$/m);
const token = tokenMatch[1].replace(/^"|"$/g, "").trim();

const url = process.argv[2];
const body = {
  to: "Ueccf97136697082a246931a30bc2172e",
  messages: [
    {
      type: "text",
      text: `🔐 ログインリンク（10分間有効）\n\n${url}`,
    },
  ],
};

const res = await fetch("https://api.line.me/v2/bot/message/push", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(body),
});
console.log("HTTP", res.status, await res.text());
