export default {
  command: ["ht2"],
  admin: true,

  run: async ({ conn, m, args, text, remoteJid, senderJid, isGroup, isAdmin }) => {
    try {
      // ══════════════════════════════════════════════════════
      // ✅ VALIDACIONES INICIALES
      // ══════════════════════════════════════════════════════

      // Validar que sea grupo
      if (!isGroup) {
        return await conn.sendText(remoteJid, "⚠️ Este comando solo funciona en grupos.")
      }

      // Validar que sea admin
      if (!isAdmin) {
        return await conn.sendText(remoteJid, "⚠️ Solo los administradores pueden usar este comando.")
      }

      // ══════════════════════════════════════════════════════
      // 👥 OBTENER PARTICIPANTES
      // ══════════════════════════════════════════════════════
      const metadata = await conn.groupMetadata(remoteJid)
      const mentions = metadata.participants.map(p => p.id)

      // ══════════════════════════════════════════════════════
      // 📝 OBTENER TEXTO
      // ══════════════════════════════════════════════════════
      let texto = ""

      if (m.quoted) {
        texto = m.quoted.text || ""
      } else {
        if (!args[0]) {
          return await conn.sendText(
            remoteJid,
            "⚠️ Usa: .ht2 <mensaje> o cita un mensaje con .ht2"
          )
        }
        texto = args.join(" ")
      }

      // ══════════════════════════════════════════════════════
      // 🎯 SI CITÓ UN MENSAJE (MEDIA)
      // ══════════════════════════════════════════════════════
      if (m.quoted) {
        const quoted = m.quoted
        const mime = quoted.mimetype || ""
        const isMedia = /image|video|sticker|audio/.test(mime)

        // 📷 IMAGEN
        if (isMedia && quoted.mtype === "imageMessage") {
          const buffer = await quoted.download()
          return await conn.sendMessage(remoteJid, {
            image: buffer,
            caption: texto || "",
            mentions
          }, { quoted: null })
        }

        // 🎥 VIDEO
        if (isMedia && quoted.mtype === "videoMessage") {
          const buffer = await quoted.download()
          return await conn.sendMessage(remoteJid, {
            video: buffer,
            caption: texto || "",
            mimetype: "video/mp4",
            mentions
          }, { quoted: null })
        }

        // 🔊 AUDIO
        if (isMedia && quoted.mtype === "audioMessage") {
          const buffer = await quoted.download()
          return await conn.sendMessage(remoteJid, {
            audio: buffer,
            mimetype: "audio/mp4",
            fileName: "Hidetag.mp3",
            mentions
          }, { quoted: null })
        }

        // 🎭 STICKER
        if (isMedia && quoted.mtype === "stickerMessage") {
          const buffer = await quoted.download()
          return await conn.sendMessage(remoteJid, {
            sticker: buffer,
            mentions
          }, { quoted: null })
        }

        // 📄 DOCUMENTO
        if (quoted.document) {
          const buffer = await quoted.download()
          const mimetype = quoted.mimetype || "application/octet-stream"
          const fileName = quoted.fileName || "document"
          return await conn.sendMessage(remoteJid, {
            document: buffer,
            mimetype,
            fileName,
            caption: texto || "",
            mentions
          }, { quoted: null })
        }
      }

      // ══════════════════════════════════════════════════════
      // 📢 TEXTO NORMAL (sin citar)
      // ══════════════════════════════════════════════════════
      const more = String.fromCharCode(8206)
      const masss = more.repeat(850)

      for (let i = 1; i <= 5; i++) {
        await conn.sendText(
          remoteJid,
          `${masss}\n${texto}\n`,
          m,
          { mentions }
        )
        console.log(`📢 Hidetag enviado ${i}/5`)
        
        // Pequeña pausa entre envíos
        if (i < 5) {
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      console.log(`✅ Hidetag completado - ${mentions.length} participantes, 5 envíos`)

    } catch (error) {
      console.error("❌ Error en ht2:", error)
      await conn.sendText(remoteJid, "⚠️ Error ejecutando HT2.", m)
    }
  }
}
