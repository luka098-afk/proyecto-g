import fetch from 'node-fetch'

function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
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
        const cleanArg = args[0].replace(/[@+]/g, "").replace(/[^0-9]/g, "")
        if (cleanArg.length > 5 && /^[0-9]+$/.test(cleanArg)) {
          targetNum = cleanArg
          targetJid = `${cleanArg}@s.whatsapp.net`
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
      // 🔧 EXTRAER NÚMERO REAL
      // ══════════════════════════════════════════════════════
      
      if (!targetNum) {
        targetNum = cleanNum(targetJid)
      }

      // ══════════════════════════════════════════════════════
      // ⏳ REACCIÓN DE CARGA
      // ══════════════════════════════════════════════════════
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '🖼️', key: m.key }
        })
      } catch (err) {
        console.log(`⚠️ No se pudo reaccionar: ${err.message}`)
      }

      // ══════════════════════════════════════════════════════
      // 🔍 INTENTAR OBTENER FOTO CON MÚLTIPLES FORMATOS
      // ══════════════════════════════════════════════════════
      
      let profileBuffer = null
      const jidsToTry = [
        targetJid,                           // Original (puede ser @lid o @s.whatsapp.net)
        `${targetNum}@s.whatsapp.net`,      // Formato estándar
        `${targetNum}@lid`,                  // Formato LID
      ]

      // Eliminar duplicados
      const uniqueJids = [...new Set(jidsToTry)]

      console.log(`🔍 Intentando obtener foto de perfil:`)
      console.log(`   Número objetivo: ${targetNum}`)
      console.log(`   JIDs a intentar: ${uniqueJids.join(', ')}`)

      for (const jid of uniqueJids) {
        if (profileBuffer) break // Ya encontramos la foto

        // Intento con 'image'
        try {
          console.log(`   📡 Intentando (image): ${jid}`)
          const profilePicUrl = await conn.profilePictureUrl(jid, 'image')
          if (profilePicUrl) {
            const response = await fetch(profilePicUrl)
            if (response.ok) {
              profileBuffer = await response.buffer()
              console.log(`   ✅ Foto encontrada con: ${jid}`)
              break
            }
          }
        } catch (err) {
          console.log(`   ❌ Falló (image) con ${jid}: ${err.message}`)
        }

        // Intento con 'preview'
        try {
          console.log(`   📡 Intentando (preview): ${jid}`)
          const profilePicUrl = await conn.profilePictureUrl(jid, 'preview')
          if (profilePicUrl) {
            const response = await fetch(profilePicUrl)
            if (response.ok) {
              profileBuffer = await response.buffer()
              console.log(`   ✅ Foto encontrada con: ${jid}`)
              break
            }
          }
        } catch (err) {
          console.log(`   ❌ Falló (preview) con ${jid}: ${err.message}`)
        }
      }

      // Si estamos en grupo, intentar obtener el JID real desde metadata
      if (!profileBuffer && isGroup) {
        try {
          console.log(`   🔍 Buscando en metadata del grupo...`)
          const groupMetadata = await conn.groupMetadata(remoteJid)
          const participant = groupMetadata.participants.find(p => {
            const pNum = cleanNum(p.id)
            return pNum === targetNum
          })

          if (participant) {
            console.log(`   📋 JID real encontrado en metadata: ${participant.id}`)
            
            // Intentar con el JID real del grupo
            try {
              const profilePicUrl = await conn.profilePictureUrl(participant.id, 'image')
              if (profilePicUrl) {
                const response = await fetch(profilePicUrl)
                if (response.ok) {
                  profileBuffer = await response.buffer()
                  console.log(`   ✅ Foto encontrada con JID del grupo`)
                }
              }
            } catch (err) {
              console.log(`   ❌ Falló con JID del grupo: ${err.message}`)
            }
          }
        } catch (err) {
          console.log(`   ⚠️ No se pudo obtener metadata: ${err.message}`)
        }
      }

      // ══════════════════════════════════════════════════════
      // 📨 ENVIAR RESULTADO
      // ══════════════════════════════════════════════════════
      
      if (profileBuffer && profileBuffer.length > 0) {
        // Enviar foto
        await conn.sendMessage(remoteJid, {
          image: profileBuffer,
          caption: `👤 Foto de perfil de @${targetNum}`,
          mentions: [`${targetNum}@s.whatsapp.net`, `${targetNum}@lid`]
        }, { quoted: m })

        console.log(`✅ Foto de perfil enviada: @${targetNum}`)

        // Reacción de éxito
        try {
          await conn.sendMessage(remoteJid, {
            react: { text: '✅', key: m.key }
          })
        } catch {}

      } else {
        // No hay foto disponible
        await conn.sendText(
          remoteJid,
          `❌ No se pudo obtener la foto de perfil de @${targetNum}\n\n_Puede que:\n• No tenga foto de perfil\n• Tenga la privacidad activada\n• El número no esté registrado en WhatsApp_`,
          m,
          { mentions: [`${targetNum}@s.whatsapp.net`, `${targetNum}@lid`] }
        )

        console.log(`⚠️ Sin foto disponible: @${targetNum}`)

        // Reacción de error
        try {
          await conn.sendMessage(remoteJid, {
            react: { text: '❌', key: m.key }
          })
        } catch {}
      }

    } catch (err) {
      console.error(`❌ Error en gpu.js:`, err.message)
      console.error(err.stack)

      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '⚠️', key: m.key }
        })
      } catch {}
    }
  }
}
