/*
 * Plugin: MUTE/UNMUTE
 * Silencia y dessilencia usuarios
 * Borra automáticamente mensajes de usuarios muteados
 * 
 * Uso:
 * .mute @usuario
 * .unmute @usuario
 */

// Variable global para almacenar usuarios muteados (por número limpio)
global.mutedUsers = global.mutedUsers || new Set()

// Función para obtener número limpio
function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

export default {
  command: /^(mute|silenciar|unmute|desilenciar)$/i,
  admin: true, // Solo admins en grupos

  run: async ({ conn, m, args, remoteJid, isGroup, participants, senderJid }) => {
    try {
      const command = m.message?.extendedTextMessage?.text?.split(" ")[0]?.slice(1)?.toLowerCase() || ""

      // Solo en grupos
      if (!isGroup) {
        return await conn.sendText(remoteJid, "❌ Este comando solo funciona en grupos.")
      }

      // Obtener el usuario objetivo
      let targetJid = null

      // Si hay mención
      const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
      if (mentions.length > 0) {
        targetJid = mentions[0]
      } else if (args[0]) {
        // Si hay número en args
        const cleanNum = args[0].replace(/[^0-9]/g, "")
        targetJid = cleanNum + "@s.whatsapp.net"
      } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        // Si responde a un mensaje (citando)
        targetJid = m.message.extendedTextMessage.contextInfo.participant
      }

      if (!targetJid) {
        return await conn.sendText(remoteJid, "🔇 Etiqueta, responde o escribe el número del usuario.")
      }

      // No se puede mutear al bot ni al owner
      const protectedJids = [conn.user.id, senderJid]
      if (protectedJids.some(jid => jid?.includes(targetJid.split("@")[0]))) {
        return await conn.sendText(remoteJid, "🤨 No me vas a hacer eso a mí...")
      }

      // Usar número limpio para almacenar (sin @)
      const targetNumClean = cleanNum(targetJid)
      const targetNum = targetJid.split("@")[0]

      // MUTE
      if (/^(mute|silenciar)$/i.test(command)) {
        if (global.mutedUsers.has(targetNumClean)) {
          return await conn.sendText(remoteJid, `⚠️ @${targetNum} ya está silenciado.`, m, { mentions: [targetJid] })
        }

        global.mutedUsers.add(targetNumClean)
        console.log(`🔇 ${targetNum} muteado. Total muteados: ${global.mutedUsers.size}`)
        return await conn.sendText(remoteJid, `🔇 @${targetNum} fue silenciado.`, m, { mentions: [targetJid] })
      }

      // UNMUTE
      if (/^(unmute|desilenciar)$/i.test(command)) {
        if (!global.mutedUsers.has(targetNumClean)) {
          return await conn.sendText(remoteJid, `⚠️ @${targetNum} no está silenciado.`, m, { mentions: [targetJid] })
        }

        global.mutedUsers.delete(targetNumClean)
        console.log(`🔈 ${targetNum} desmuteado. Total muteados: ${global.mutedUsers.size}`)
        return await conn.sendText(remoteJid, `🔈 @${targetNum} fue desmuteado.`, m, { mentions: [targetJid] })
      }

    } catch (err) {
      console.error(`❌ Error en mute.js:`, err.message)
      await conn.sendText(remoteJid, "⚠️ Error ejecutando mute.").catch(() => {})
    }
  },

  // Before hook: borrar mensajes de usuarios muteados
  before: async ({ conn, m, remoteJid, senderJid }) => {
    try {
      // Si no hay muteados, saltar
      if (!global.mutedUsers || global.mutedUsers.size === 0) {
        return false
      }

      // Obtener número limpio del sender
      const senderNumClean = cleanNum(senderJid)

      console.log(`📨 Verificando sender: ${senderJid} (limpio: ${senderNumClean})`)
      console.log(`   Muteados: ${Array.from(global.mutedUsers).join(", ")}`)

      // Si el usuario está muteado, BORRAR su mensaje
      if (global.mutedUsers.has(senderNumClean)) {
        console.log(`🗑️ Usuario muteado detectado: ${senderNumClean}`)
        
        try {
          if (!m.key || !m.key.id) {
            console.error("❌ m.key no tiene id")
            return true
          }

          // Método confirmado que funciona
          await conn.sendMessage(remoteJid, { 
            delete: {
              remoteJid: remoteJid,
              fromMe: m.key.fromMe || false,
              id: m.key.id,
              participant: m.key.participant
            }
          })
          console.log(`✅ Mensaje borrado`)

        } catch (err) {
          console.error("❌ Error borrando:", err.message)
        }
        
        return true // STOP
      }

      return false

    } catch (err) {
      console.error(`❌ Error en before mute:`, err.message)
      return false
    }
  }
}
