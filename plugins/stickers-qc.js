import fetch from 'node-fetch'
import { sticker } from "../lib/sticker.js"

function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

export default {
  command: ["qc", "quoted"],
  admin: false,

  run: async ({ conn, m, remoteJid, senderJid, text }) => {
    try {
      // ══════════════════════════════════════════════════════
      // 📝 OBTENER MENSAJE A CITAR
      // ══════════════════════════════════════════════════════
      let quotedMsg = null
      let quotedText = ""
      let quotedSender = senderJid
      let quotedName = m.pushName || "Usuario"

      // Si hay texto directo, usar ese
      if (text && text.trim()) {
        // Limpiar texto si viene con el comando
        text = text.replace(/^\.qc\s*/i, '').trim()
        
        quotedText = text
        quotedSender = senderJid
        quotedName = m.pushName || "Usuario"
      }
      // Si responde a un mensaje, usar ese mensaje
      else if (m.message?.extendedTextMessage?.contextInfo) {
        const contextInfo = m.message.extendedTextMessage.contextInfo
        
        quotedText = contextInfo.quotedMessage?.conversation ||
                     contextInfo.quotedMessage?.extendedTextMessage?.text ||
                     contextInfo.quotedMessage?.imageMessage?.caption ||
                     contextInfo.quotedMessage?.videoMessage?.caption ||
                     "Mensaje multimedia"
        
        quotedSender = contextInfo.participant || senderJid
        
        // Intentar obtener nombre del usuario citado
        try {
          quotedName = contextInfo.quotedMessage?.extendedTextMessage?.contextInfo?.pushName ||
                       contextInfo.pushName ||
                       await conn.getName(quotedSender) ||
                       "Usuario"
        } catch {
          quotedName = "Usuario"
        }
      } else {
        return await conn.sendText(
          remoteJid,
          `❌ Debes proporcionar un texto o responder a un mensaje.\n\n*Ejemplos:*\n.qc Hola mundo\n[Responder mensaje]\n.qc`,
          m
        )
      }

      if (!quotedText.trim()) {
        return await conn.sendText(
          remoteJid,
          `❌ No se pudo obtener el texto del mensaje.`,
          m
        )
      }

      // Validar longitud máxima
      if (quotedText.length > 100) {
        return await conn.sendText(
          remoteJid,
          `❌ El texto es muy largo. Máximo 100 caracteres.`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 🔄 REACCIÓN DE PROCESAMIENTO
      // ══════════════════════════════════════════════════════
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '⏳', key: m.key }
        })
      } catch (err) {
        console.log(`⚠️ No se pudo reaccionar`)
      }

      console.log(`💬 Generando QC de: ${quotedName}`)
      console.log(`📝 Texto: ${quotedText}`)

      // ══════════════════════════════════════════════════════
      // 📸 OBTENER FOTO DE PERFIL
      // ══════════════════════════════════════════════════════
      let ppUrl = "https://i.ibb.co/3Fh9V6p/avatar-contact.png" // Foto por defecto
      
      try {
        ppUrl = await conn.profilePictureUrl(quotedSender, 'image')
        console.log(`✅ Foto de perfil obtenida`)
      } catch (err) {
        console.log(`⚠️ Usando foto por defecto`)
      }

      // ══════════════════════════════════════════════════════
      // 🎨 GENERAR IMAGEN CON API
      // ══════════════════════════════════════════════════════
      console.log(`🎨 Generando imagen con API...`)

      const payload = {
        type: "quote",
        format: "png",
        backgroundColor: "#1b1429",
        width: 512,
        height: 768,
        scale: 2,
        messages: [
          {
            entities: [],
            avatar: true,
            from: {
              id: 1,
              name: quotedName,
              photo: {
                url: ppUrl
              }
            },
            text: quotedText,
            replyMessage: {}
          }
        ]
      }

      console.log(`🔄 Consultando API bot.lyo.su...`)
      
      const response = await fetch("https://bot.lyo.su/quote/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.result || !data.result.image) {
        throw new Error("API no devolvió imagen")
      }

      // La imagen viene en base64
      const imageBuffer = Buffer.from(data.result.image, 'base64')
      console.log(`✅ Imagen generada exitosamente`)

      // ══════════════════════════════════════════════════════
      // 🎯 CONVERTIR A STICKER
      // ══════════════════════════════════════════════════════
      console.log(`🎯 Convirtiendo a sticker...`)

const stik = await sticker(imageBuffer, null, { keepAspectRatio: true })

      // ══════════════════════════════════════════════════════
      // 📤 ENVIAR STICKER
      // ══════════════════════════════════════════════════════
      await conn.sendMessage(remoteJid, {
        sticker: stik
      }, { quoted: m })

      console.log(`✅ Sticker QC enviado`)

      // ══════════════════════════════════════════════════════
      // ✅ REACCIÓN DE ÉXITO
      // ══════════════════════════════════════════════════════
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '✅', key: m.key }
        })
      } catch (err) {
        console.log(`⚠️ No se pudo reaccionar`)
      }

    } catch (err) {
      console.error(`❌ Error en sticker-qc.js:`, err.message)
      console.error(err.stack)

      await conn.sendText(
        remoteJid,
        `❌ Ocurrió un error al crear el sticker.\n\n*Error:* ${err.message}\n\nIntenta nuevamente.`,
        m
      )

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
