// plugins/stickers-ttp.js
import * as Jimp from "jimp-legacy";
import { sticker } from "../lib/sticker.js";

export async function run({ conn, m, args, remoteJid }) {
  try {
    let text = args.join(" ");
    if (!text && m.quoted?.text) text = m.quoted.text;
    if (!text) {
      return await conn.sendText(remoteJid, "❌ Ingresa un texto.", m);
    }

await conn.sendMessage(remoteJid, {
  react: { text: "⏳", key: m.key }
});

    text = text.toUpperCase().trim();

    // ───── FORMATEO DE LÍNEAS ─────
    const words = text.split(" ");
    let lines = [];

    if (words.length <= 6) {
      const rows = Math.ceil(Math.sqrt(words.length));
      const perRow = Math.ceil(words.length / rows);

      for (let i = 0; i < words.length; i += perRow) {
        lines.push(words.slice(i, i + perRow).join(" "));
      }
    } else {
      const wrap = Math.floor(Math.sqrt(text.length * 1.3)) + 5;

      let current = "";
      for (let w of words) {
        if ((current + " " + w).trim().length > wrap) {
          lines.push(current.trim());
          current = w;
        } else {
          current += " " + w;
        }
      }
      if (current) lines.push(current.trim());
    }

    // ───── CANVAS ─────
    const size = 512;
    const bg = new Jimp(size, size, 0x00000000);

    const font = await Jimp.loadFont("./resources/BebasNeue.fnt");

    // ───── MEDIDAS ─────
    let maxW = 0;
    let totalH = 0;
    let heights = [];

    for (let line of lines) {
      const w = Jimp.measureText(font, line);
      const h = Jimp.measureTextHeight(font, line, size);
      maxW = Math.max(maxW, w);
      totalH += h;
      heights.push(h);
    }

    let textImg = new Jimp(maxW + 20, totalH + 20, 0x00000000);

    let y = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const x = (textImg.getWidth() - Jimp.measureText(font, line)) / 2;
      textImg.print(font, x, y, line);
      y += heights[i];
    }

    textImg.autocrop();

    textImg.scaleToFit(size - 40, size - 40);

    const x = (size - textImg.getWidth()) / 2;
    const y2 = (size - textImg.getHeight()) / 2;

    bg.composite(textImg, x, y2);

    // ───── STICKER ─────
    const buffer = await bg.getBufferAsync(Jimp.MIME_PNG);
    const stik = await sticker(buffer, false);

    await conn.sendFile(remoteJid, stik, "ttp.webp", "", m);

 await conn.sendMessage(remoteJid, {
  react: { text: "✅", key: m.key }
});

  } catch (e) {
    console.error("❌ TTP ERROR:", e);
    await conn.sendText(remoteJid, "❌ Error generando sticker.", m);
  }
}

export const command = ["ttp"];
export const owner = false;
