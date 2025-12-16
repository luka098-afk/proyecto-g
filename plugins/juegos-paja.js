function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default {
  command: ["paja", "pajeame"],
  admin: false,

  run: async ({ conn, m, remoteJid, senderJid, isGroup }) => {
    try {
      // ══════════════════════════════════════════════════════
      // ✅ VALIDAR QUE SEA GRUPO
      // ══════════════════════════════════════════════════════
      if (!isGroup) {
        return await conn.sendText(
          remoteJid,
          `❌ Este comando solo funciona en grupos.`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 📍 OBTENER METADATA PARA MENCIONES
      // ══════════════════════════════════════════════════════
      const senderNum = cleanNum(senderJid)
      const metadata = await conn.groupMetadata(remoteJid)
      const groupParticipants = metadata.participants || []
      
      let realSenderJid = senderJid
      for (const p of groupParticipants) {
        if (cleanNum(p.id) === senderNum) {
          realSenderJid = p.id
          break
        }
      }

      // ══════════════════════════════════════════════════════
      // 🔄 ANIMACIÓN DE PAJA
      // ══════════════════════════════════════════════════════
      const { key } = await conn.sendMessage(
        remoteJid,
        { text: "Tas caliente! Ahora te haré una paja" },
        { quoted: m }
      )

      const array = [
        "8==👊==D",
        "8===👊=D",
        "8====👊D",
        "8===👊=D",
        "8==👊==D",
        "8=👊===D",
        "8👊====D",
        "8=👊===D",
        "8==👊==D",
        "8===👊=D",
        "8====👊D",
        "8===👊=D",
        "8==👊==D",
        "8=👊===D",
        "8====👊D💦"
      ]

      // Animar cada frame con delay mayor para evitar rate-limit
      for (let item of array) {
        await conn.sendMessage(
          remoteJid,
          { text: item, edit: key },
          { quoted: m }
        )
        await delay(100) // 100ms para evitar rate-limit
      }

      // ══════════════════════════════════════════════════════
      // 💦 MENSAJE FINAL CON SENDTEXT
      // ══════════════════════════════════════════════════════
      await delay(200) // Esperar un poco más antes del mensaje final
      
      await conn.sendText(
        remoteJid,
        `Oh, @${senderNum} se corrió en menos de 1 hora!`,
        m,
        { mentions: [realSenderJid] }
      )

      console.log(`💦 Paja realizada a: ${senderNum}`)

    } catch (err) {
      console.error(`❌ Error en paja.js:`, err.message)
      console.error(err.stack)

      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '⚠️', key: m.key }
        })
      } catch (e) {
        console.log(`⚠️ No se pudo reaccionar: ${e.message}`)
      }
    }
  }
}
