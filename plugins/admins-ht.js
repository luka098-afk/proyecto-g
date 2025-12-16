export default {
  command: "ht",

  run: async ({ conn, m, args, remoteJid, isGroup, isAdmin }) => {
    try {
      // ============================================
      //   VALIDACIONES
      // ============================================
      if (!isGroup) {
        return await conn.sendText(remoteJid, "⚠️ Este comando solo funciona en grupos.");
      }

      if (!isAdmin) {
        return await conn.sendText(remoteJid, "⚠️ Solo los administradores pueden usar este comando.");
      }

      // ============================================
      //   OBTENER PARTICIPANTES
      // ============================================
      const metadata = await conn.groupMetadata(remoteJid);
      const mentions = metadata.participants.map(p => p.id);

      // ============================================
      //   OBTENER TEXTO
      // ============================================
      let texto = "";
      
      if (m.quoted) {
        texto = m.quoted.text || "";
      } else {
        if (!args[0]) {
          return await conn.sendText(
            remoteJid, 
            "⚠️ Usa: .ht <mensaje> o cita un mensaje con .ht"
          );
        }
        texto = args.join(" ");
      }

      // ============================================
      //   SI CITÓ UN MENSAJE
      // ============================================
      if (m.quoted) {
        const quoted = m.quoted;
        const mime = quoted.mimetype || "";
        const isMedia = /image|video|sticker|audio/.test(mime);

        // 📷 IMAGEN
        if (isMedia && quoted.mtype === "imageMessage") {
          const buffer = await quoted.download();
          return await conn.sendMessage(remoteJid, {
            image: buffer,
            caption: texto || "",
            mentions
          }, { quoted: null });
        }

        // 🎥 VIDEO
        if (isMedia && quoted.mtype === "videoMessage") {
          const buffer = await quoted.download();
          return await conn.sendMessage(remoteJid, {
            video: buffer,
            caption: texto || "",
            mimetype: "video/mp4",
            mentions
          }, { quoted: null });
        }

        // 🔊 AUDIO
        if (isMedia && quoted.mtype === "audioMessage") {
          const buffer = await quoted.download();
          return await conn.sendMessage(remoteJid, {
            audio: buffer,
            mimetype: "audio/mp4",
            fileName: "Hidetag.mp3",
            mentions
          }, { quoted: null });
        }

        // 🎭 STICKER
        if (isMedia && quoted.mtype === "stickerMessage") {
          const buffer = await quoted.download();
          return await conn.sendMessage(remoteJid, {
            sticker: buffer,
            mentions
          }, { quoted: null });
        }

        // 📄 DOCUMENTO
        if (quoted.document) {
          const buffer = await quoted.download();
          const mimetype = quoted.mimetype || "application/octet-stream";
          const fileName = quoted.fileName || "document";
          return await conn.sendMessage(remoteJid, {
            document: buffer,
            mimetype,
            fileName,
            caption: texto || "",
            mentions
          }, { quoted: null });
        }
      }

      // ============================================
      //   TEXTO NORMAL (sin citar)
      // ============================================
      const more = String.fromCharCode(8206);
      const masss = more.repeat(850);
      
      await conn.sendText(
        remoteJid,
        `${masss}\n${texto}\n`,
        m,
        { mentions }
      );

    } catch (error) {
      console.error("❌ Error en ht:", error);
      await conn.sendText(remoteJid, "⚠️ Error ejecutando HT.", m);
    }
  }
};
