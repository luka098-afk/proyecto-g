import fetch from 'node-fetch'

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

function isValidNumber(num) {
  return num && num.length > 5 && /^[0-9]+$/.test(num)
}

export default {
  command: ["gpu"],

  run: async ({ conn, m, args, text, remoteJid, senderJid, isGroup, isAdmin }) => {
    try {
      // ══════════════════════════════════════════════════════
      // ✅ VALIDACIONES INICIALES
      // ══════════════════════════════════════════════════════

      // Validar admin en grupos
      if (isGroup && !isAdmin) {
        return await conn.sendText(
          remoteJid,
          `🔒 *Solo administradores pueden usar este comando en grupos*`,
          m,
          { mentions: [senderJid] }
        )
      }

      // ══════════════════════════════════════════════════════
      // 🎯 OBTENER USUARIO OBJETIVO
      // ══════════════════════════════════════════════════════
      let targetJid = null
      let targetNum = null
      let targetName = "Usuario"

      // Opción 1: Responder a mensaje
      if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        targetJid = m.message.extendedTextMessage.contextInfo.participant
        targetName = m.pushName || cleanNum(targetJid)
      }

      // Opción 2: Mención directa
      const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
      if (!targetJid && mentions.length > 0) {
        targetJid = mentions[0]
        targetName = cleanNum(targetJid)
      }

      // Opción 3: Número como argumento
      if (!targetJid && args[0]) {
        const cleanArg = args[0].replace(/[@]/g, "").replace(/[^0-9]/g, "")
        if (isValidNumber(cleanArg)) {
          targetJid = `${cleanArg}@s.whatsapp.net`
          targetNum = cleanArg
          targetName = cleanArg
        }
      }

      // Opción 4: Usar al remitente
      if (!targetJid) {
        targetJid = senderJid
        targetNum = cleanNum(senderJid)
        targetName = m.pushName || targetNum
      }

      // ══════════════════════════════════════════════════════
      // 🔧 NORMALIZAR JID
      // ══════════════════════════════════════════════════════
      targetJid = normalizeJid(targetJid)
      targetNum = cleanNum(targetJid)

      // ══════════════════════════════════════════════════════
      // ⏳ REACCIÓN DE CARGA
      // ══════════════════════════════════════════════════════
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '🖼️', key: m.key }
        })
      } catch (err) {
        console.log(`⚠️ No se pudo reaccionar con carga: ${err.message}`)
      }

      // ══════════════════════════════════════════════════════
      // 🖼️ OBTENER FOTO DE PERFIL
      // ══════════════════════════════════════════════════════
      let profileBuffer = null

      try {
        // Intento 1: Obtener imagen en tamaño normal
        try {
          const profilePicUrl = await conn.profilePictureUrl(targetJid, 'image')
          if (profilePicUrl) {
            const response = await fetch(profilePicUrl)
            if (response.ok) {
              profileBuffer = await response.buffer()
            }
          }
        } catch (err1) {
          console.log(`⚠️ No se pudo obtener foto (image): ${err1.message}`)

          // Intento 2: Obtener imagen en tamaño preview
          try {
            const profilePicUrl = await conn.profilePictureUrl(targetJid, 'preview')
            if (profilePicUrl) {
              const response = await fetch(profilePicUrl)
              if (response.ok) {
                profileBuffer = await response.buffer()
              }
            }
          } catch (err2) {
            console.log(`⚠️ No se pudo obtener foto (preview): ${err2.message}`)
          }
        }

        // ══════════════════════════════════════════════════════
        // 📨 ENVIAR RESULTADO
        // ══════════════════════════════════════════════════════
        if (profileBuffer && profileBuffer.length > 0) {
          // Enviar foto
          await conn.sendMessage(remoteJid, {
            image: profileBuffer
          }, { quoted: m })

          console.log(`✅ Foto de perfil enviada: @${targetNum}`)

          // Reacción de éxito
          try {
            await conn.sendMessage(remoteJid, {
              react: { text: '✅', key: m.key }
            })
          } catch (err) {
            console.log(`⚠️ No se pudo reaccionar con éxito: ${err.message}`)
          }

        } else {
          // No hay foto disponible
          await conn.sendText(
            remoteJid,
            `❌ *@${targetNum}* no tiene foto visible para todos`,
            m,
            { mentions: [targetJid] }
          )

          console.log(`⚠️ Sin foto disponible: @${targetNum}`)

          // Reacción de error
          try {
            await conn.sendMessage(remoteJid, {
              react: { text: '❌', key: m.key }
            })
          } catch (err) {
            console.log(`⚠️ No se pudo reaccionar con error: ${err.message}`)
          }
        }

      } catch (err) {
        console.error(`❌ Error obteniendo foto: ${err.message}`)

        await conn.sendText(
          remoteJid,
          `❌ Error al obtener foto de perfil.`,
          m,
          { mentions: [senderJid] }
        )

        // Reacción de error
        try {
          await conn.sendMessage(remoteJid, {
            react: { text: '❌', key: m.key }
          })
        } catch (e) {
          console.log(`⚠️ No se pudo reaccionar: ${e.message}`)
        }
      }

    } catch (err) {
      console.error(`❌ Error en gpu.js:`, err.message)
      console.error(err.stack)

      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '❌', key: m.key }
        })
      } catch (e) {
        console.log(`⚠️ No se pudo reaccionar: ${e.message}`)
      }
    }
  }
}
