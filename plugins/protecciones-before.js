import { downloadContentFromMessage } from '@whiskeysockets/baileys'

function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

export default {
  before: async ({ conn, m, text, isAdmin, isOwner, remoteJid, isGroup, senderJid }) => {
    try {
      const OWNER_NUMBER = "59896026646"
      const ownerJid = `${OWNER_NUMBER}@s.whatsapp.net`

      if (!isGroup) return
      if (isAdmin || isOwner || m.fromMe) return
      if (!global.db.data.chats) global.db.data.chats = {}
      if (!global.db.data.chats[remoteJid]) {
        global.db.data.chats[remoteJid] = {
          antilink: true,
          anticanal: true,
          antiestado: true,
          antieliminar: false,
          antiInstagram: false,
          antiTiktok: false,
          antiTelegram: false
        }
      }

      const chat = global.db.data.chats[remoteJid]
      const num = cleanNum(senderJid)

      // Obtener el JID real del participante del grupo
      let mention = senderJid
      try {
        const metadata = await conn.groupMetadata(remoteJid)
        const groupParticipants = metadata.participants || []

        for (const p of groupParticipants) {
          if (cleanNum(p.id) === num) {
            mention = p.id
            break
          }
        }
      } catch (err) {
        mention = `${num}@s.whatsapp.net`
      }

      // ══════════════════════════════════════════════════════
      // 🔗 ANTILINK
      // ══════════════════════════════════════════════════════
      if (chat.antilink && text) {
        const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
        const linkRegex1 = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i

        if (linkRegex.exec(text) || linkRegex1.exec(text)) {
          try {
            const linkThisGroup = `https://chat.whatsapp.com/${await conn.groupInviteCode(remoteJid)}`
            if (text.includes(linkThisGroup)) return
          } catch (err) {
            console.log(`⚠️ Error: ${err.message}`)
          }

          console.log(`🔗 Enlace detectado de: ${senderJid}`)

          await conn.sendText(remoteJid, `🔗 @${num} compartió un enlace externo. Serás eliminado...`, null, { mentions: [mention] })

          try {
            await conn.sendMessage(remoteJid, {
              delete: { remoteJid, fromMe: false, id: m.key.id, participant: m.key.participant }
            })
          } catch (err) {
            console.error(`⚠️ Error eliminando: ${err.message}`)
          }

          if (ownerJid) {
            try {
              const metadata = await conn.groupMetadata(remoteJid)
              let reportMsg = `🔗 ${text}\n\n`
              reportMsg += `💬 Grupo: ${metadata.subject || remoteJid}`
              await conn.sendText(ownerJid, reportMsg)
              console.log(`✅ Link reenviado al owner`)
            } catch (err) {
              console.error(`⚠️ Error reenviando al owner: ${err.message}`)
            }
          }

          try {
            const metadata = await conn.groupMetadata(remoteJid)
            const groupParticipants = metadata.participants || []
            let realJid = senderJid
            const senderNum = cleanNum(senderJid)

            for (const p of groupParticipants) {
              const pNum = cleanNum(p.id)
              if (senderNum === pNum) {
                realJid = p.id
                break
              }
            }

            await conn.groupParticipantsUpdate(remoteJid, [realJid], "remove")
            console.log(`✅ ${num} eliminado (antilink)`)
          } catch (err) {
            console.error(`⚠️ Error expulsando: ${err.message}`)
          }

          return true
        }
      }

      // ══════════════════════════════════════════════════════
      // 📷 ANTI-INSTAGRAM
      // ══════════════════════════════════════════════════════
      if (chat.antiInstagram && text) {
        const instagramRegex = /instagram\.com/i
        
        if (instagramRegex.test(text)) {
          console.log(`📷 Link de Instagram detectado de: ${senderJid}`)

          await conn.sendText(remoteJid, `📷 @${num} compartió un link de Instagram. Serás eliminado...`, null, { mentions: [mention] })

          try {
            await conn.sendMessage(remoteJid, {
              delete: { remoteJid, fromMe: false, id: m.key.id, participant: m.key.participant }
            })
          } catch (err) {
            console.error(`⚠️ Error eliminando: ${err.message}`)
          }

          try {
            const metadata = await conn.groupMetadata(remoteJid)
            const groupParticipants = metadata.participants || []
            let realJid = senderJid
            const senderNum = cleanNum(senderJid)

            for (const p of groupParticipants) {
              const pNum = cleanNum(p.id)
              if (senderNum === pNum) {
                realJid = p.id
                break
              }
            }

            await conn.groupParticipantsUpdate(remoteJid, [realJid], "remove")
            console.log(`✅ ${num} eliminado (anti-instagram)`)
          } catch (err) {
            console.error(`⚠️ Error expulsando: ${err.message}`)
          }

          return true
        }
      }

      // ══════════════════════════════════════════════════════
      // 🎵 ANTI-TIKTOK
      // ══════════════════════════════════════════════════════
      if (chat.antiTiktok && text) {
        const tiktokRegex = /tiktok\.com/i
        
        if (tiktokRegex.test(text)) {
          console.log(`🎵 Link de TikTok detectado de: ${senderJid}`)

          await conn.sendText(remoteJid, `🎵 @${num} compartió un link de TikTok. Serás eliminado...`, null, { mentions: [mention] })

          try {
            await conn.sendMessage(remoteJid, {
              delete: { remoteJid, fromMe: false, id: m.key.id, participant: m.key.participant }
            })
          } catch (err) {
            console.error(`⚠️ Error eliminando: ${err.message}`)
          }

          try {
            const metadata = await conn.groupMetadata(remoteJid)
            const groupParticipants = metadata.participants || []
            let realJid = senderJid
            const senderNum = cleanNum(senderJid)

            for (const p of groupParticipants) {
              const pNum = cleanNum(p.id)
              if (senderNum === pNum) {
                realJid = p.id
                break
              }
            }

            await conn.groupParticipantsUpdate(remoteJid, [realJid], "remove")
            console.log(`✅ ${num} eliminado (anti-tiktok)`)
          } catch (err) {
            console.error(`⚠️ Error expulsando: ${err.message}`)
          }

          return true
        }
      }

      // ══════════════════════════════════════════════════════
      // ✈️ ANTI-TELEGRAM
      // ══════════════════════════════════════════════════════
      if (chat.antiTelegram && text) {
        const telegramRegex = /telegram\.com|t\.me/i
        
        if (telegramRegex.test(text)) {
          console.log(`✈️ Link de Telegram detectado de: ${senderJid}`)

          await conn.sendText(remoteJid, `✈️ @${num} compartió un link de Telegram. Serás eliminado...`, null, { mentions: [mention] })

          try {
            await conn.sendMessage(remoteJid, {
              delete: { remoteJid, fromMe: false, id: m.key.id, participant: m.key.participant }
            })
          } catch (err) {
            console.error(`⚠️ Error eliminando: ${err.message}`)
          }

          try {
            const metadata = await conn.groupMetadata(remoteJid)
            const groupParticipants = metadata.participants || []
            let realJid = senderJid
            const senderNum = cleanNum(senderJid)

            for (const p of groupParticipants) {
              const pNum = cleanNum(p.id)
              if (senderNum === pNum) {
                realJid = p.id
                break
              }
            }

            await conn.groupParticipantsUpdate(remoteJid, [realJid], "remove")
            console.log(`✅ ${num} eliminado (anti-telegram)`)
          } catch (err) {
            console.error(`⚠️ Error expulsando: ${err.message}`)
          }

          return true
        }
      }

      // ══════════════════════════════════════════════════════
      // 📱 ANTICANAL
      // ══════════════════════════════════════════════════════
      if (chat.anticanal) {
        const isForwarded = m.message?.extendedTextMessage?.contextInfo?.isForwarded
        const isFromNewsletter = m.message?.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo

        if (isForwarded && isFromNewsletter) {
          console.log(`📱 Contenido de canal detectado de: ${senderJid}`)

          await conn.sendText(remoteJid, `📱 @${num} compartió contenido de canal. Serás eliminado...`, null, { mentions: [mention] })

          try {
            await conn.sendMessage(remoteJid, {
              delete: { remoteJid, fromMe: false, id: m.key.id, participant: m.key.participant }
            })
          } catch (err) {
            console.error(`⚠️ Error eliminando: ${err.message}`)
          }

          try {
            const metadata = await conn.groupMetadata(remoteJid)
            const groupParticipants = metadata.participants || []
            let realJid = senderJid
            const senderNum = cleanNum(senderJid)

            for (const p of groupParticipants) {
              const pNum = cleanNum(p.id)
              if (senderNum === pNum) {
                realJid = p.id
                break
              }
            }

            await conn.groupParticipantsUpdate(remoteJid, [realJid], "remove")
            console.log(`✅ ${num} eliminado (anticanal)`)
          } catch (err) {
            console.error(`⚠️ Error expulsando: ${err.message}`)
          }

          return true
        }
      }

      // ══════════════════════════════════════════════════════
      // 📊 ANTIESTADO
      // ══════════════════════════════════════════════════════
      if (chat.antiestado) {
        const groupStatusMentionMessage = m.message?.groupStatusMentionMessage

        if (groupStatusMentionMessage) {
          console.log(`📊 Estado etiquetado detectado de: ${senderJid}`)

          await conn.sendText(remoteJid, `📊 @${num} etiquetó el grupo en un estado. Serás eliminado...`, null, { mentions: [mention] })

          try {
            await conn.sendMessage(remoteJid, {
              delete: { remoteJid, fromMe: false, id: m.key.id, participant: m.key.participant }
            })
          } catch (err) {
            console.error(`⚠️ Error eliminando mensaje: ${err.message}`)
          }

          // Notificar silenciosa a admins
          try {
            const metadata = await conn.groupMetadata(remoteJid)
            const admins = metadata.participants.filter(p => p.admin).map(p => p.id)

            let adminMsg = `📊 *ESTADO ETIQUETADO DETECTADO*\n\n`
            adminMsg += `👤 Usuario: @${num}\n`
            adminMsg += `📍 Grupo: ${metadata.subject}\n`
            adminMsg += `⚠️ Usuario eliminado`

            for (const admin of admins) {
              try {
                await conn.sendMessage(admin, { text: adminMsg }, { mentions: [senderJid] })
              } catch (e) {
                console.error(`⚠️ Error notificando admin:`, e.message)
              }
            }
          } catch (err) {
            console.error(`⚠️ Error notificando admins: ${err.message}`)
          }

          // Eliminar usuario
          try {
            const metadata = await conn.groupMetadata(remoteJid)
            const groupParticipants = metadata.participants || []
            let realJid = senderJid
            const senderNum = cleanNum(senderJid)

            for (const p of groupParticipants) {
              const pNum = cleanNum(p.id)
              if (senderNum === pNum) {
                realJid = p.id
                break
              }
            }

            await conn.groupParticipantsUpdate(remoteJid, [realJid], "remove")
            console.log(`✅ ${num} eliminado (antiestado)`)
          } catch (err) {
            console.error(`⚠️ Error expulsando: ${err.message}`)
          }

          return true
        }
      }

      // Inicializar caché de mensajes global si no existe
      if (!global.messageCache) {
        global.messageCache = {}
      }

      // ══════════════════════════════════════════════════════
      // 💾 GUARDAR TODOS LOS MENSAJES
      // ══════════════════════════════════════════════════════
      if (!global.messageCache[remoteJid]) {
        global.messageCache[remoteJid] = []
      }

      // Guardar el mensaje actual
      if (m.message && m.key.id) {
        global.messageCache[remoteJid].push({
          id: m.key.id,
          sender: senderJid,
          senderName: m.pushName || num,
          message: m.message,
          timestamp: m.messageTimestamp,
          key: m.key
        })

        // Mantener solo los últimos 100 mensajes
        if (global.messageCache[remoteJid].length > 100) {
          global.messageCache[remoteJid].shift()
        }
      }

      // ══════════════════════════════════════════════════════
      // 🗑️ ANTIELIMINAR
      // ══════════════════════════════════════════════════════
      if (chat.antieliminar) {
        const protocolMessage = m.message?.protocolMessage

        if (protocolMessage && protocolMessage.type === 0) {
          console.log(`🗑️ Intento de eliminar mensaje detectado de: ${senderJid}`)

          // Buscar el mensaje eliminado en el caché
          const deletedMessageId = protocolMessage.key?.id
          const cachedMessage = global.messageCache[remoteJid]?.find(msg => msg.id === deletedMessageId)

          await conn.sendText(remoteJid, `🗑️ @${num} intentó eliminar un mensaje. *Está prohibido eliminar cosas en este grupo.*`, null, { mentions: [mention] })

          // Si encontramos el mensaje en caché, reenviarlo
          if (cachedMessage) {
            try {
              const msgContent = cachedMessage.message
              const senderMention = cachedMessage.sender
              const senderNum = cleanNum(senderMention)

              // Obtener el JID real para etiquetar correctamente
              let realMention = senderMention
              try {
                const metadata = await conn.groupMetadata(remoteJid)
                const groupParticipants = metadata.participants || []
                for (const p of groupParticipants) {
                  if (cleanNum(p.id) === senderNum) {
                    realMention = p.id
                    break
                  }
                }
              } catch (err) {
                realMention = `${senderNum}@s.whatsapp.net`
              }

              if (msgContent.conversation) {
                await conn.sendMessage(remoteJid, {
                  text: `📌 *Mensaje Eliminado de:* @${senderNum}\n\n${msgContent.conversation}`,
                  mentions: [realMention]
                })
              } else if (msgContent.imageMessage) {
                try {
                  const stream = await downloadContentFromMessage(msgContent.imageMessage, 'image')
                  let buffer = Buffer.from([])
                  for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk])
                  }
                  await conn.sendMessage(remoteJid, {
                    image: buffer,
                    caption: `📌 *Foto eliminada de:* @${senderNum}`,
                    mentions: [realMention]
                  })
                } catch (err) {
                  console.error(`⚠️ Error descargando imagen: ${err.message}`)
                }
              } else if (msgContent.videoMessage) {
                try {
                  const stream = await downloadContentFromMessage(msgContent.videoMessage, 'video')
                  let buffer = Buffer.from([])
                  for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk])
                  }
                  await conn.sendMessage(remoteJid, {
                    video: buffer,
                    caption: `📌 *Video eliminado de:* @${senderNum}`,
                    mentions: [realMention]
                  })
                } catch (err) {
                  console.error(`⚠️ Error descargando video: ${err.message}`)
                }
              } else if (msgContent.audioMessage) {
                try {
                  const stream = await downloadContentFromMessage(msgContent.audioMessage, 'audio')
                  let buffer = Buffer.from([])
                  for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk])
                  }
                  await conn.sendMessage(remoteJid, {
                    audio: buffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    mentions: [realMention]
                  })
                } catch (err) {
                  console.error(`⚠️ Error descargando audio: ${err.message}`)
                }
              } else if (msgContent.stickerMessage) {
                try {
                  const stream = await downloadContentFromMessage(msgContent.stickerMessage, 'sticker')
                  let buffer = Buffer.from([])
                  for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk])
                  }
                  await conn.sendMessage(remoteJid, {
                    sticker: buffer,
                    mentions: [realMention]
                  })
                } catch (err) {
                  console.error(`⚠️ Error descargando sticker: ${err.message}`)
                }
              }

              console.log(`✅ Mensaje eliminado reenviado`)
            } catch (err) {
              console.error(`⚠️ Error reenviando mensaje: ${err.message}`)
            }
          }

          try {
            await conn.sendMessage(remoteJid, {
              delete: { remoteJid, fromMe: false, id: m.key.id, participant: m.key.participant }
            })
          } catch (err) {
            console.error(`⚠️ Error eliminando: ${err.message}`)
          }

          return true
        }
      }

    } catch (err) {
      console.error(`❌ Error en protecciones-before:`, err.message)
    }
  }
}
