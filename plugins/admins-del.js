export default {
  command: ["del", "delete"],
  admin: true,

  run: async ({ conn, m, args, text, remoteJid, senderJid, isGroup }) => {
    try {
      // ══════════════════════════════════════════════════════
      // ✅ VALIDACIONES INICIALES
      // ══════════════════════════════════════════════════════

      // Validar que sea una respuesta
      if (!m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        return await conn.sendText(
          remoteJid,
          `⚠️ Por favor, cita el mensaje que deseas eliminar.`,
          m,
          { mentions: [senderJid] }
        )
      }

      // ══════════════════════════════════════════════════════
      // 📋 OBTENER INFORMACIÓN DEL MENSAJE
      // ══════════════════════════════════════════════════════
      const quotedMessage = m.message.extendedTextMessage.contextInfo
      const messageId = quotedMessage.stanzaId
      const participant = quotedMessage.participant

      // ══════════════════════════════════════════════════════
      // 🗑️ ELIMINAR MENSAJE - INTENTO 1
      // ══════════════════════════════════════════════════════
      try {
        await conn.sendMessage(remoteJid, {
          delete: {
            remoteJid: remoteJid,
            fromMe: false,
            id: messageId,
            participant: participant
          }
        })

        console.log(`✅ Mensaje eliminado: ${messageId}`)
        
        // Reaccionar con confirmación
        try {
          await conn.sendMessage(remoteJid, {
            react: { text: '✅', key: m.key }
          })
        } catch (err) {
          console.log(`⚠️ No se pudo reaccionar: ${err.message}`)
        }

      } catch (err) {
        // ══════════════════════════════════════════════════════
        // 🗑️ ELIMINAR MENSAJE - INTENTO 2
        // ══════════════════════════════════════════════════════
        console.log(`⚠️ Intento 1 falló, usando método alternativo: ${err.message}`)
        
        try {
          await conn.sendMessage(remoteJid, {
            delete: m.message.extendedTextMessage.contextInfo.quotedMessage.key
          })

          console.log(`✅ Mensaje eliminado (método alternativo): ${messageId}`)
          
          // Reaccionar con confirmación
          try {
            await conn.sendMessage(remoteJid, {
              react: { text: '✅', key: m.key }
            })
          } catch (e) {
            console.log(`⚠️ No se pudo reaccionar: ${e.message}`)
          }

        } catch (finalErr) {
          console.error(`❌ Error eliminando mensaje: ${finalErr.message}`)
          console.log(`⚠️ No se pudo eliminar el mensaje`)

          return await conn.sendText(
            remoteJid,
            `❌ No se pudo eliminar el mensaje.\n\n` +
            `Verifica que:\n` +
            `• El bot tenga permisos\n` +
            `• El mensaje no sea muy antiguo`,
            m,
            { mentions: [senderJid] }
          )
        }
      }

    } catch (err) {
      console.error(`❌ Error en delete.js:`, err.message)
      console.error(err.stack)
      await conn.sendText(remoteJid, "⚠️ Error ejecutando comando.").catch(() => {})
    }
  }
}
