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
  command: ["p", "promote"],
  admin: true,

  run: async ({ conn, m, args, text, remoteJid, senderJid, isGroup, isAdmin, participants }) => {
    try {
      // ══════════════════════════════════════════════════════
      // ✅ VALIDACIONES INICIALES
      // ══════════════════════════════════════════════════════

      // Validar que sea grupo
      if (!isGroup) {
        return await conn.sendText(
          remoteJid,
          `❌ Este comando solo funciona en grupos.`,
          m,
          { mentions: [senderJid] }
        )
      }

      // Validar que sea admin
      if (!isAdmin) {
        return await conn.sendText(
          remoteJid,
          `❌ Solo los administradores pueden usar este comando.`,
          m,
          { mentions: [senderJid] }
        )
      }

      // ══════════════════════════════════════════════════════
      // 🎯 OBTENER USUARIO OBJETIVO
      // ══════════════════════════════════════════════════════
      let targetJid = null
      let targetNum = null

      // Opción 1: Mención directa
      const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
      if (mentions.length > 0) {
        targetJid = mentions[0]
      }

      // Opción 2: Responder a mensaje
      if (!targetJid && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        targetJid = m.message.extendedTextMessage.contextInfo.participant
      }

      // Opción 3: Número como argumento
      if (!targetJid && args[0]) {
        const cleanArg = args[0].replace(/[@]/g, "").replace(/[^0-9]/g, "")
        if (isValidNumber(cleanArg)) {
          targetJid = `${cleanArg}@s.whatsapp.net`
        }
      }

      // ══════════════════════════════════════════════════════
      // ✅ VALIDAR OBJETIVO
      // ══════════════════════════════════════════════════════
      if (!targetJid) {
        return await conn.sendText(
          remoteJid,
          `❌ Menciona, responde o escribe el número del usuario.\n\n` +
          `Ejemplo: *.promote @usuario*`,
          m,
          { mentions: [senderJid] }
        )
      }

      // ══════════════════════════════════════════════════════
      // 🔧 NORMALIZAR JID
      // ══════════════════════════════════════════════════════
      targetJid = normalizeJid(targetJid)
      targetNum = cleanNum(targetJid)

      // ══════════════════════════════════════════════════════
      // 👥 VALIDAR QUE ESTÉ EN EL GRUPO
      // ══════════════════════════════════════════════════════
      let realParticipantJid = null
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
          `❌ El usuario @${targetNum} no está en este grupo.`,
          m,
          { mentions: [targetJid] }
        )
      }

      // ══════════════════════════════════════════════════════
      // 🔼 PROMOVER A ADMIN
      // ══════════════════════════════════════════════════════
      try {
        await conn.groupParticipantsUpdate(remoteJid, [realParticipantJid], "promote")

        // ══════════════════════════════════════════════════════
        // 📨 MENSAJE DE CONFIRMACIÓN
        // ══════════════════════════════════════════════════════
        let mensaje = `🔼 *PROMOCIÓN A ADMIN* 🔼\n\n`
        mensaje += `━━━━━━━━━━━━━━━━━\n`
        mensaje += `👤 Usuario: @${targetNum}\n`
        mensaje += `✅ Estado: Admin\n`
        mensaje += `━━━━━━━━━━━━━━━━━\n\n`
        mensaje += `¡Felicidades! Ahora eres administrador del grupo.`

        // Mapeo de menciones (lid y @s.whatsapp.net)
        const mentionVariants = [
          `${targetNum}@s.whatsapp.net`,
          `${targetNum}@lid`
        ]

        await conn.sendText(
          remoteJid,
          mensaje,
          m,
          { mentions: mentionVariants }
        )

        console.log(`✅ ${targetNum} promovido a admin en ${remoteJid}`)

      } catch (err) {
        console.error(`❌ Error promoviendo usuario: ${err.message}`)
        console.log(`⚠️ No se pudo promover a ${targetNum}`)

        return await conn.sendText(
          remoteJid,
          `⚠️ No se pudo otorgar admin.\n\n` +
          `Asegúrate de que el bot tenga permisos de administrador.`,
          m,
          { mentions: [senderJid] }
        )
      }

    } catch (err) {
      console.error(`❌ Error en promote.js:`, err.message)
      console.error(err.stack)
      await conn.sendText(remoteJid, "⚠️ Error ejecutando comando.").catch(() => {})
    }
  }
}
