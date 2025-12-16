function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

export default {
  command: ["besar"],
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
      // 🎯 DETECTAR USUARIO MENCIONADO
      // ══════════════════════════════════════════════════════
      const senderNum = cleanNum(senderJid)
      
      // Obtener metadata del grupo para mapeo correcto
      const metadata = await conn.groupMetadata(remoteJid)
      const groupParticipants = metadata.participants || []
      
      // Obtener el JID real del sender
      let realSenderJid = senderJid
      for (const p of groupParticipants) {
        if (cleanNum(p.id) === senderNum) {
          realSenderJid = p.id
          break
        }
      }
      
      // Verificar si hay mención directa
      let mentionedJid = null
      
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        mentionedJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0]
      }
      
      // Verificar si es respuesta a un mensaje
      if (!mentionedJid && m.message?.extendedTextMessage?.contextInfo?.participant) {
        mentionedJid = m.message.extendedTextMessage.contextInfo.participant
      }

      // ══════════════════════════════════════════════════════
      // 💋 LÓGICA DEL BESO
      // ══════════════════════════════════════════════════════
      
      // Si no hay mención, se besa a sí mismo
      if (!mentionedJid) {
        return await conn.sendText(
          remoteJid,
          `💋 @${senderNum} se dio un beso a sí mismo 😳`,
          m,
          { mentions: [realSenderJid] }
        )
      }

      const targetNum = cleanNum(mentionedJid)
      
      // Obtener el JID real del mencionado
      let realMentionedJid = mentionedJid
      for (const p of groupParticipants) {
        if (cleanNum(p.id) === targetNum) {
          realMentionedJid = p.id
          break
        }
      }

      // Si se menciona a sí mismo
      if (targetNum === senderNum) {
        return await conn.sendText(
          remoteJid,
          `💋 @${senderNum} se dio un beso a sí mismo 😳`,
          m,
          { mentions: [realSenderJid] }
        )
      }

      // Beso normal a otro usuario
      await conn.sendText(
        remoteJid,
        `💋 @${senderNum} le dio un beso a @${targetNum} 😘`,
        m,
        { mentions: [realSenderJid, realMentionedJid] }
      )

    } catch (err) {
      console.error(`❌ Error en kiss.js:`, err.message)
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
