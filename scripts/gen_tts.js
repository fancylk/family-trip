import { narrations } from "/Users/taoge/family-trip-web/scripts/narrations.js";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";

const KEY = "sk-cet71mglihqo5ox5tbgq3by9a9zgeso4gpzg4l35t3qiounm";
const OUT = "/Users/taoge/family-trip-web/audio";
mkdirSync(OUT, { recursive: true });

async function tts(id, text, attempt = 1) {
  const file = `${OUT}/${id}.mp3`;
  if (existsSync(file)) { console.log(`skip ${id}`); return true; }
  try {
    const r = await fetch("https://api.xiaomimimo.com/v1/chat/completions", {
      method: "POST",
      headers: { "api-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mimo-v2.5-tts",
        messages: [
          { role: "user", content: "Please read the following text vividly, like a warm tour guide telling a story to a 10-year-old girl." },
          { role: "assistant", content: text }
        ],
        audio: { format: "mp3", voice: "mimo_default" }
      })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    const b64 = j.choices?.[0]?.message?.audio?.data;
    if (!b64) throw new Error("no audio data in response");
    const buf = Buffer.from(b64, "base64");
    if (buf.length < 10000) throw new Error(`audio too small: ${buf.length}`);
    writeFileSync(file, buf);
    console.log(`ok ${id}: ${(buf.length/1024).toFixed(0)}KB`);
    return true;
  } catch (e) {
    console.error(`fail ${id} (attempt ${attempt}): ${e.message}`);
    if (attempt < 3) { await new Promise(r => setTimeout(r, 3000 * attempt)); return tts(id, text, attempt + 1); }
    return false;
  }
}

let failed = [];
for (const [id, text] of Object.entries(narrations)) {
  const ok = await tts(id, text);
  if (!ok) failed.push(id);
  await new Promise(r => setTimeout(r, 500));
}
console.log(failed.length ? `FAILED: ${failed.join(", ")}` : "ALL DONE");
process.exit(failed.length ? 1 : 0);