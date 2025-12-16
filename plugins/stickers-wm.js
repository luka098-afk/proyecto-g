import { addExif } from "../lib/sticker.js";
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

/**
 * Plugin: Watermark (WM)
 * Agrega marca de agua (metadata) a un sticker
 * 
 * Uso:
 * [Responder a un sticker]
 * .wm Nombre del Pack | Autor
 * .wm Hola (solo nombre, autor por defecto: "Bot")
 */

export default {
  command: ["wm"],

  run: async (ctx) => {
    const { conn, m, args, remoteJid } = ctx;

    try {
      // Verificar que sea respuesta a un mensaje
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!quoted) {
        return await conn.sendText(
          remoteJid,
          `❌ *Responde a un sticker*\n\n*Uso:*\n• .wm Nombre | Autor\n• .wm Hola\n\n*Ejemplo:*\n.wm Proyecto G | Bot`,
          m
        );
      }

      // Verificar que sea un sticker
      const stickerMessage = quoted.stickerMessage;

      if (!stickerMessage) {
        return await conn.sendText(
          remoteJid,
          `❌ Debes responder a un *sticker*`,
          m
        );
      }

      // Extraer packname y author usando args (sin el comando)
      let packname = "Sticker";
      let author = "Bot";

      // Unir todos los argumentos después del comando
      const inputText = args.join(" ").trim();

      if (inputText) {
        const parts = inputText.split("|");
        packname = parts[0]?.trim() || "Sticker";
        author = parts[1]?.trim() || "Bot";
      }

      // Reacción de procesamiento
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '⏳', key: m.key }
        });
      } catch {}

      console.log(`🏷️ WM: "${packname}" | "${author}"`);

      // Descargar el sticker
      const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
      let buffer = Buffer.from([]);

      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      console.log(`✅ Descargado: ${buffer.length} bytes`);

      // Agregar metadata EXIF
      const newSticker = await addExif(buffer, packname, author);

      console.log(`✅ Metadata: "${packname}" | "${author}"`);

      // Enviar sticker con nueva metadata
      await conn.sendMessage(remoteJid, {
        sticker: newSticker
      }, { quoted: m });

      // Reacción de éxito
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '✅', key: m.key }
        });
      } catch {}

    } catch (err) {
      console.error(`❌ Error en wm:`, err.message);

      await conn.sendText(
        remoteJid,
        `❌ *Error agregando watermark*\n\n${err.message}`,
        m
      );

      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '❌', key: m.key }
        });
      } catch {}
    }
  }
};
