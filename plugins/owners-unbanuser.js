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
  command: ["unbanuser", "unban"],
  owner: true,

  run: async ({ conn, m, args, text, remoteJid, senderJid, isOwner }) => {
    try {
      // ══════════════════════════════════════════════════════
      // 📋 VARIABLES INICIALES
      // ══════════════════════════════════════════════════════
      let targetJid = null
      let targetNum = null
      let targetJidMention = null

      // ══════════════════════════════════════════════════════
      // 🎯 DETERMINAR USUARIO OBJETIVO
      // ══════════════════════════════════════════════════════

      // Opción 1: Mención directa
      const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
      if (mentions.length > 0) {
        targetJid = mentions[0]
        targetJidMention = mentions[0]
      }

      // Opción 2: Número como argumento
      if (!targetJid && args[0]) {
        const cleanArg = args[0].replace(/[@]/g, "").replace(/[^0-9]/g, "")
        if (isValidNumber(cleanArg)) {
          targetJid = `${cleanArg}@s.whatsapp.net`
          targetJidMention = cleanArg
        }
      }

      // Opción 3: Responder a un mensaje
      if (!targetJid && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        targetJid = m.message.extendedTextMessage.contextInfo.participant
        targetJidMention = m.message.extendedTextMessage.contextInfo.participant
      }

      // ══════════════════════════════════════════════════════
      // ✅ VALIDAR OBJETIVO
      // ══════════════════════════════════════════════════════
      if (!targetJid) {
        return await conn.sendText(
          remoteJid,
          `✦ *UNBANUSER - FORMA DE USO*\n\n` +
          `Debes mencionar, escribir el número o citar a alguien.\n\n` +
          `*Ejemplos:*\n` +
          `• .unbanuser @usuario\n` +
          `• .unbanuser (responder mensaje)`
        )
      }

      // ══════════════════════════════════════════════════════
      // 🔧 NORMALIZAR JID
      // ══════════════════════════════════════════════════════
      targetJid = normalizeJid(targetJid)
      targetNum = cleanNum(targetJid)

      // ══════════════════════════════════════════════════════
      // 💾 GESTIONAR BD DE USUARIOS
      // ══════════════════════════════════════════════════════
      if (!global.db.data.users) global.db.data.users = {}

      if (!global.db.data.users[targetJid]) {
        global.db.data.users[targetJid] = { 
          banned: false,
          banRazon: '',
          bannedAt: null,
          bannedBy: null
        }
      }

      // ══════════════════════════════════════════════════════
      // ✅ VERIFICAR SI YA ESTÁ DESBANEADO
      // ══════════════════════════════════════════════════════
      if (global.db.data.users[targetJid].banned === false) {
        return await conn.sendText(
          remoteJid,
          `✦ El usuario @${targetNum} no está baneado.`,
          m,
          { mentions: [targetJid] }
        )
      }

      // ══════════════════════════════════════════════════════
      // ✅ DESBANEAR USUARIO
      // ══════════════════════════════════════════════════════
      global.db.data.users[targetJid].banned = false
      global.db.data.users[targetJid].banRazon = ''
      global.db.data.users[targetJid].bannedAt = null
      global.db.data.users[targetJid].bannedBy = null

      // ══════════════════════════════════════════════════════
      // 📨 MENSAJE DE CONFIRMACIÓN
      // ══════════════════════════════════════════════════════
      let mensaje = `✅ *USUARIO DESBANEADO*\n\n`
      mensaje += `━━━━━━━━━━━━━━━━━\n`
      mensaje += `👤 Usuario: @${targetNum}\n`
      mensaje += `⏰ Fecha: ${new Date().toLocaleString()}\n`
      mensaje += `✔️ Estado: Activo\n`
      mensaje += `━━━━━━━━━━━━━━━━━\n\n`
      mensaje += `El usuario podrá usar nuevamente los comandos del bot.\n\n`

      await conn.sendText(
        remoteJid,
        mensaje,
        m,
        { mentions: [targetJid, targetJid.replace('@s.whatsapp.net', '@lid')] }
      )

    } catch (err) {
      console.error(`❌ Error en unbanuser.js:`, err.message)
      console.error(err.stack)
      await conn.sendText(remoteJid, "⚠️ Error ejecutando unbanuser.").catch(() => {})
    }
  }
}
