import { sticker } from "../lib/sticker.js";

export default {
  command: ["s", "sticker", "stiker"],

  run: async ({ conn, m, remoteJid, isOwner }) => {
    try {
      console.log("=== INICIANDO COMANDO STICKER ===");

      // ============================================
      //   FUNCIÓN PARA DETECTAR VIEWONCE
      // ============================================
      function isViewOnce(message) {
        if (!message) return false;

        if (message.viewOnceMessage || message.viewOnceMessageV2 || message.viewOnceMessageV2Extension) {
          console.log("🚫 ViewOnce detectado en nivel superior");
          return true;
        }

        if (message.imageMessage?.viewOnce === true) {
          console.log("🚫 ViewOnce detectado en imageMessage");
          return true;
        }

        if (message.videoMessage?.viewOnce === true) {
          console.log("🚫 ViewOnce detectado en videoMessage");
          return true;
        }

        if (message.ephemeralMessage?.message) {
          return isViewOnce(message.ephemeralMessage.message);
        }

        return false;
      }

      let mediaBuffer = null;
      let mediaType = null;
      const msg = m.message;

      // ============================================
      //   VERIFICAR VIEWONCE EN MENSAJE ACTUAL
      // ============================================
      console.log("🔍 Verificando ViewOnce en mensaje actual");

      if (isViewOnce(msg)) {
        console.log("❌ BLOQUEADO: ViewOnce en mensaje actual");
        return await conn.sendText(
          remoteJid,
          "⚠️ *No se puede crear sticker de ViewOnce*",
          m
        );
      }

      // ============================================
      //   VERIFICAR VIEWONCE EN MENSAJE CITADO
      // ============================================
      if (m.quoted) {
        console.log("🔍 Verificando ViewOnce en m.quoted");
        const quotedMsg = m.quoted.message || m.quoted;

        if (isViewOnce(quotedMsg)) {
          console.log("❌ BLOQUEADO: ViewOnce en m.quoted");
          return await conn.sendText(
            remoteJid,
            "⚠️ *No se puede crear sticker de ViewOnce*",
            m
          );
        }
      }

      if (msg.extendedTextMessage?.contextInfo?.quotedMessage) {
        console.log("🔍 Verificando ViewOnce en extendedText");
        const quotedMsg = msg.extendedTextMessage.contextInfo.quotedMessage;

        if (isViewOnce(quotedMsg)) {
          console.log("❌ BLOQUEADO: ViewOnce en extendedText");
          return await conn.sendText(
            remoteJid,
            "⚠️ *No se puede crear sticker de ViewOnce*",
            m
          );
        }
      }

      // ============================================
      //   OBTENER EL MENSAJE CON MEDIA
      // ============================================
      if (m.quoted && m.quoted.download) {
        console.log("🔍 Usando m.quoted.download()");
        const quotedMsg = m.quoted.message || m.quoted;

        if (quotedMsg.imageMessage) {
          console.log("✅ Imagen citada");
          mediaBuffer = await m.quoted.download();
          mediaType = "image";
        } else if (quotedMsg.videoMessage) {
          console.log("✅ Video citado");
          mediaBuffer = await m.quoted.download();
          mediaType = "video";
        } else if (quotedMsg.stickerMessage) {
          console.log("✅ Sticker citado");
          mediaBuffer = await m.quoted.download();
          mediaType = "sticker";
        }
      } else {
        console.log("🔍 Buscando media en mensaje actual");

        if (msg.imageMessage) {
          console.log("✅ Imagen directa encontrada");
          const { downloadContentFromMessage } = await import("@whiskeysockets/baileys");
          const stream = await downloadContentFromMessage(msg.imageMessage, 'image');

          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }

          mediaBuffer = buffer;
          mediaType = "image";
        } else if (msg.videoMessage) {
          console.log("✅ Video directo encontrado");
          const { downloadContentFromMessage } = await import("@whiskeysockets/baileys");
          const stream = await downloadContentFromMessage(msg.videoMessage, 'video');

          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }

          mediaBuffer = buffer;
          mediaType = "video";
        } else if (msg.stickerMessage) {
          console.log("✅ Sticker directo encontrado");
          const { downloadContentFromMessage } = await import("@whiskeysockets/baileys");
          const stream = await downloadContentFromMessage(msg.stickerMessage, 'image');

          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }

          mediaBuffer = buffer;
          mediaType = "sticker";
        } else if (msg.extendedTextMessage?.contextInfo?.quotedMessage) {
          console.log("✅ Mensaje citado dentro de extendedText");
          const quotedMsg = msg.extendedTextMessage.contextInfo.quotedMessage;

          const { downloadContentFromMessage } = await import("@whiskeysockets/baileys");

          if (quotedMsg.imageMessage) {
            console.log("✅ Descargando imagen citada");
            const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
              buffer = Buffer.concat([buffer, chunk]);
            }

            mediaBuffer = buffer;
            mediaType = "image";
          } else if (quotedMsg.videoMessage) {
            console.log("✅ Descargando video citado");
            const stream = await downloadContentFromMessage(quotedMsg.videoMessage, 'video');

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
              buffer = Buffer.concat([buffer, chunk]);
            }

            mediaBuffer = buffer;
            mediaType = "video";
          } else if (quotedMsg.stickerMessage) {
            console.log("✅ Descargando sticker citado");
            const stream = await downloadContentFromMessage(quotedMsg.stickerMessage, 'image');

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
              buffer = Buffer.concat([buffer, chunk]);
            }

            mediaBuffer = buffer;
            mediaType = "sticker";
          }
        }
      }

      console.log("📊 mediaBuffer:", mediaBuffer ? `SI (${mediaBuffer.length} bytes)` : "NO");
      console.log("📊 mediaType:", mediaType);

      if (!mediaBuffer || !mediaType) {
        console.log("❌ NO SE DETECTÓ MEDIA");
        return await conn.sendText(
          remoteJid,
          "⚠️ *Cita una imagen/video/sticker* y responde con *.s*\n\nO envía la media con caption *.s*",
          m
        );
      }

      console.log("⏳ Generando sticker...");
      const stickerBuffer = await sticker(mediaBuffer, null);

      console.log("✅ Sticker generado:", stickerBuffer ? `SI (${stickerBuffer.length} bytes)` : "NO");

      if (!stickerBuffer) {
        console.log("❌ stickerBuffer está vacío");
        return await conn.sendText(
          remoteJid,
          "⚠️ Error al crear el sticker.",
          m
        );
      }

      console.log("📤 Enviando sticker...");
      await conn.sendMessage(remoteJid, {
        sticker: stickerBuffer
      }, { quoted: m });

      console.log("✅ ¡Sticker enviado!");

    } catch (error) {
      console.error("❌ ERROR:", error.message);
      console.error("Stack:", error.stack);
      await conn.sendText(
        remoteJid,
        `⚠️ Error: ${error.message}`,
        m
      );
    }
  }
};
