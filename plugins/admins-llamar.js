function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

function normalizeJid(jid) {
  if (!jid.includes('@')) {
    return `${jid}@s.whatsapp.net`
  }
  if (jid.includes('@lid')) {
    return jid.replace('@lid', '@s.whatsapp.net')
  }
  return jid
}

export default {
  command: ["llamar"],

  run: async ({ conn, m, args, text, remoteJid, senderJid, isGroup, isAdmin }) => {
    try {
      // ══════════════════════════════════════════════════════
      // ✅ VALIDACIONES INICIALES
      // ══════════════════════════════════════════════════════

      // En grupos, solo admins
      if (isGroup && !isAdmin) {
        return await conn.sendText(
          remoteJid,
          `🔒 *Solo administradores pueden usar este comando*`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 🎯 DETECTAR USUARIO OBJETIVO
      // ══════════════════════════════════════════════════════
      let targetJid = null
      let targetNum = null

      // Opción 1: Responder a mensaje
      if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        targetJid = m.message.extendedTextMessage.contextInfo.participant
      }

      // Opción 2: Mención directa
      const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
      if (!targetJid && mentions.length > 0) {
        targetJid = mentions[0]
      }

      // ══════════════════════════════════════════════════════
      // ✅ VALIDAR OBJETIVO
      // ══════════════════════════════════════════════════════
      if (!targetJid) {
        return await conn.sendText(
          remoteJid,
          `❌ *Menciona a alguien o cita su mensaje*`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 🔧 NORMALIZAR JID
      // ══════════════════════════════════════════════════════
      targetJid = normalizeJid(targetJid)
      targetNum = cleanNum(targetJid)

      // ══════════════════════════════════════════════════════
      // ⏳ REACCIÓN INICIAL
      // ══════════════════════════════════════════════════════
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '📢', key: m.key }
        })
      } catch (err) {
        console.log(`⚠️ No se pudo reaccionar: ${err.message}`)
      }

      // ══════════════════════════════════════════════════════
      // 📢 ENVIAR 5 ETIQUETAS CON PAUSA
      // ══════════════════════════════════════════════════════
      
      // Mapeo de menciones (lid y @s.whatsapp.net)
      const mentionVariants = [
        `${targetNum}@s.whatsapp.net`,
        `${targetNum}@lid`
      ]

      for (let i = 1; i <= 5; i++) {
        try {
          await conn.sendMessage(remoteJid, {
            text: `@${targetNum}`,
            mentions: mentionVariants
          })

          console.log(`📢 Etiqueta ${i}/5 enviada: @${targetNum}`)

          // Pausa de 1 segundo entre etiquetas
          if (i < 5) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }

        } catch (err) {
          console.error(`⚠️ Error enviando etiqueta ${i}: ${err.message}`)
        }
      }

      // ══════════════════════════════════════════════════════
      // ✅ REACCIÓN FINAL
      // ══════════════════════════════════════════════════════
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '✅', key: m.key }
        })
      } catch (err) {
        console.log(`⚠️ No se pudo reaccionar con éxito: ${err.message}`)
      }

      console.log(`✅ Llamadas completadas: @${targetNum}`)

    } catch (err) {
      console.error(`❌ Error en llamar.js:`, err.message)
      console.error(err.stack)

      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '❌', key: m.key }
        })
      } catch (e) {
        console.log(`⚠️ No se pudo reaccionar: ${e.message}`)
      }

      await conn.sendText(
        remoteJid,
        `❌ *Error al llamar usuario*`,
        m
      ).catch(() => {})
    }
  }
}
