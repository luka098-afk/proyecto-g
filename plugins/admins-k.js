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
  command: ["k"],
  admin: true,

  run: async ({ conn, m, args, text, remoteJid, senderJid, isGroup, isAdmin, participants }) => {
    try {
      // ══════════════════════════════════════════════════════
      // 🔪 VARIABLES INICIALES
      // ══════════════════════════════════════════════════════
      const emoji = '🔪'
      const botCreator = '262573496758272@lid' // 🔒 Tu LID como creator
      const botJid = conn.user.id

      // ══════════════════════════════════════════════════════
      // 🎯 DETECTAR USUARIO OBJETIVO
      // ══════════════════════════════════════════════════════
      let targetJid = null
      let targetNum = null
      let realParticipantJid = null

      // Opción 1: Mención directa
      const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
      if (mentions.length > 0) {
        targetJid = mentions[0]
      }

      // Opción 2: Responder a mensaje
      if (!targetJid && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        targetJid = m.message.extendedTextMessage.contextInfo.participant
      }

      // ══════════════════════════════════════════════════════
      // ✅ VALIDAR OBJETIVO
      // ══════════════════════════════════════════════════════
      if (!targetJid) {
        return await conn.sendText(
          remoteJid,
          `┌──「 *Expulsión Fallida* 」\n│ ${emoji} Debes mencionar o responder a alguien para expulsarlo.\n└───────❖`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 🔧 NORMALIZAR Y VALIDAR
      // ══════════════════════════════════════════════════════
      targetJid = normalizeJid(targetJid)
      targetNum = cleanNum(targetJid)

      // Obtener el JID real del participante
      for (const p of participants) {
        const pNum = cleanNum(p.id)
        if (pNum === targetNum) {
          realParticipantJid = p.id
          break
        }
      }

      if (!realParticipantJid) {
        return await conn.sendText(
          remoteJid,
          `┌──「 *Error* 」\n│ ❌ El usuario no está en el grupo.\n└───────❖`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 🛡️ PROTECCIONES
      // ══════════════════════════════════════════════════════

      // Protección: Bot no puede expulsarse a sí misma
      if (targetNum === cleanNum(botJid)) {
        return await conn.sendText(
          remoteJid,
          `┌──「 *Error* 」\n│ ❌ No puedo expulsarme a mí misma.\n└───────❖`,
          m
        )
      }

      // Protección: Castigo al intentar expulsar al creator
      if (targetJid === botCreator || targetNum === cleanNum(botCreator)) {
        try {
          await conn.groupParticipantsUpdate(remoteJid, [normalizeJid(senderJid)], "remove")
          await conn.sendText(
            remoteJid,
            `┌──「 *Castigo Divino* 」\n│ 💀 Intentaste expulsar al creator... fuiste eliminado.\n└───────❖`,
            m
          )
        } catch (err) {
          console.error(`⚠️ Error expulsando al atacante: ${err.message}`)
        }
        return
      }

      // Obtener metadata del grupo
      let ownerGroup = null
      try {
        const groupInfo = await conn.groupMetadata(remoteJid)
        ownerGroup = groupInfo.owner || `${remoteJid.split('-')[0]}@s.whatsapp.net`
      } catch (err) {
        console.error(`⚠️ Error obteniendo metadata: ${err.message}`)
      }

      // Protección: Owner del grupo (si no es creator del bot)
      if (ownerGroup && targetJid === ownerGroup && targetNum !== cleanNum(botCreator)) {
        return await conn.sendText(
          remoteJid,
          `┌──「 *Error* 」\n│ 👑 No puedo tocar al líder del grupo.\n└───────❖`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 🔪 EXPULSAR USUARIO
      // ══════════════════════════════════════════════════════
      try {
        await conn.groupParticipantsUpdate(remoteJid, [realParticipantJid], "remove")

        // Reacción de confirmación
        try {
          await conn.sendMessage(remoteJid, {
            react: { text: emoji, key: m.key }
          })
        } catch (err) {
          console.log(`⚠️ No se pudo reaccionar: ${err.message}`)
        }

        console.log(`✅ ${targetNum} expulsado del grupo: ${remoteJid}`)

      } catch (err) {
        console.error(`❌ Error expulsando usuario: ${err.message}`)
        
        await conn.sendText(
          remoteJid,
          `┌──「 *Error* 」\n│ ❌ No se pudo expulsar al usuario.\n│ Verifica que el bot sea admin.\n└───────❖`,
          m
        )
      }

    } catch (err) {
      console.error(`❌ Error en k.js:`, err.message)
      console.error(err.stack)
      
      await conn.sendText(
        remoteJid,
        `⚠️ Error ejecutando comando.`,
        m
      ).catch(() => {})
    }
  }
}
