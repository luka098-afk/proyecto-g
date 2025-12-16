import fetch from 'node-fetch'

function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

export default {
  command: ["gay"],
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
      // 🌈 REACCIÓN INICIAL
      // ══════════════════════════════════════════════════════
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '🌈', key: m.key }
        })
      } catch (err) {
        console.log(`⚠️ No se pudo reaccionar: ${err.message}`)
      }

      // ══════════════════════════════════════════════════════
      // 🎯 DETECTAR USUARIO OBJETIVO
      // ══════════════════════════════════════════════════════
      let targetJid = null
      
      // Verificar si hay mención directa
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0]
      }
      
      // Verificar si es respuesta a un mensaje
      if (!targetJid && m.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJid = m.message.extendedTextMessage.contextInfo.participant
      }

      // Si no hay mención, usar el sender
      if (!targetJid) {
        targetJid = senderJid
      }

      const targetNum = cleanNum(targetJid)

      // ══════════════════════════════════════════════════════
      // 🎲 GENERAR PORCENTAJE ALEATORIO
      // ══════════════════════════════════════════════════════
      const porcentaje = Math.floor(Math.random() * 101)

      // ══════════════════════════════════════════════════════
      // 📸 INTENTAR OBTENER FOTO DE PERFIL
      // ══════════════════════════════════════════════════════
      let ppUrl = null
      try {
        ppUrl = await conn.profilePictureUrl(targetJid, 'image')
        console.log(`✅ Foto de perfil obtenida: ${ppUrl}`)
      } catch (err) {
        console.log(`⚠️ Usuario sin foto de perfil`)
        ppUrl = null
      }

      // ══════════════════════════════════════════════════════
      // 📍 OBTENER METADATA PARA MENCIONES
      // ══════════════════════════════════════════════════════
      const metadata = await conn.groupMetadata(remoteJid)
      const groupParticipants = metadata.participants || []
      
      // Mapear JID real del usuario
      let realTargetJid = targetJid
      for (const p of groupParticipants) {
        if (cleanNum(p.id) === targetNum) {
          realTargetJid = p.id
          break
        }
      }

      // ══════════════════════════════════════════════════════
      // 🚫 SI NO TIENE FOTO: SOLO TEXTO
      // ══════════════════════════════════════════════════════
      if (!ppUrl) {
        await conn.sendText(
          remoteJid,
          `🏳️‍🌈 @${targetNum} es *${porcentaje}% gay* 🌈`,
          m,
          { mentions: [realTargetJid] }
        )

        console.log(`🌈 Gay detector: ${targetNum} = ${porcentaje}% (sin foto)`)

        // Quitar reacción
        try {
          await conn.sendMessage(remoteJid, {
            react: { text: '', key: m.key }
          })
        } catch (err) {
          console.log(`⚠️ No se pudo quitar reacción`)
        }

        return
      }

      // ══════════════════════════════════════════════════════
      // 🖼️ GENERAR IMAGEN CON API
      // ══════════════════════════════════════════════════════
      const apiUrl = `https://some-random-api.com/canvas/misc/lgbt?avatar=${encodeURIComponent(ppUrl)}`

      console.log(`🔗 Generando imagen: ${apiUrl}`)

      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const imageBuffer = await response.buffer()

      // ══════════════════════════════════════════════════════
      // 📤 ENVIAR IMAGEN CON CAPTION
      // ══════════════════════════════════════════════════════
      await conn.sendMessage(remoteJid, {
        image: imageBuffer,
        caption: `🏳️‍🌈 @${targetNum} es *${porcentaje}% gay* 🌈`,
        mentions: [realTargetJid]
      })

      console.log(`🌈 Gay detector: ${targetNum} = ${porcentaje}% (con imagen)`)

      // ══════════════════════════════════════════════════════
      // ✅ QUITAR REACCIÓN
      // ══════════════════════════════════════════════════════
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '', key: m.key }
        })
      } catch (err) {
        console.log(`⚠️ No se pudo quitar reacción`)
      }

    } catch (err) {
      console.error(`❌ Error en gay.js:`, err.message)
      console.error(err.stack)

      await conn.sendText(
        remoteJid,
        `❌ Ocurrió un error al generar la imagen.`,
        m
      )

      // Quitar reacción en caso de error
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '', key: m.key }
        })
      } catch (e) {
        console.log(`⚠️ No se pudo quitar reacción`)
      }
    }
  }
}
