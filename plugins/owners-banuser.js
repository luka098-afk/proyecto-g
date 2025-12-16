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

// Mapeo de número a JID con múltiples formatos
function createMentionVariants(number) {
  return [
    `${number}@s.whatsapp.net`,
    `${number}@lid`,
    `@${number}`
  ]
}

export default {
  command: ["banuser", "ban"],
  owner: true,

  run: async ({ conn, m, args, text, remoteJid, senderJid, isOwner }) => {
    try {
      // ══════════════════════════════════════════════════════
      // 📋 VARIABLES INICIALES
      // ══════════════════════════════════════════════════════
      let targetJid = null
      let targetNum = null
      const botNum = cleanNum(conn.user.jid)

      // ══════════════════════════════════════════════════════
      // 🎯 DETERMINAR USUARIO OBJETIVO
      // ══════════════════════════════════════════════════════

      // Opción 1: Mención directa
      const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
      if (mentions.length > 0) {
        targetJid = mentions[0]
      }

      // Opción 2: Número como argumento
      if (!targetJid && args[0]) {
        const cleanArg = args[0].replace(/[@]/g, "").replace(/[^0-9]/g, "")
        if (isValidNumber(cleanArg)) {
          targetJid = `${cleanArg}@s.whatsapp.net`
        }
      }

      // Opción 3: Responder a un mensaje
      if (!targetJid && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        targetJid = m.message.extendedTextMessage.contextInfo.participant
      }

      // ══════════════════════════════════════════════════════
      // ✅ VALIDAR OBJETIVO
      // ══════════════════════════════════════════════════════
      if (!targetJid) {
        return await conn.sendText(
          remoteJid,
          `✦ *BANUSER - FORMA DE USO*\n\n` +
          `Debes mencionar, escribir el número o citar a alguien.\n\n` +
          `*Ejemplos:*\n` +
          `• .banuser @usuario\n` +
          `• .banuser (responder mensaje)`
        )
      }

      // ══════════════════════════════════════════════════════
      // 🔧 NORMALIZAR JID
      // ══════════════════════════════════════════════════════
      targetJid = normalizeJid(targetJid)
      targetNum = cleanNum(targetJid)

      // ══════════════════════════════════════════════════════
      // 🛡️ VALIDACIONES DE SEGURIDAD
      // ══════════════════════════════════════════════════════

      // Validar que no sea el bot
      if (targetNum === botNum) {
        return await conn.sendText(
          remoteJid,
          `✧ El bot no puede ser baneado.`,
          m
        )
      }

      // Validar que no sea owner
      const allOwners = new Set([
        ...(global.owner || []).map(o => cleanNum(Array.isArray(o) ? o[0] : o)),
        ...(global.ownerData || []).map(o => cleanNum(Array.isArray(o) ? o[0] : o))
      ])

      if (allOwners.has(targetNum)) {
        return await conn.sendText(
          remoteJid,
          `✧ No puedo banear a un propietario del bot.`,
          m
        )
      }

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
      // ✅ VERIFICAR SI YA ESTÁ BANEADO
      // ══════════════════════════════════════════════════════
      if (global.db.data.users[targetJid].banned === true) {
        return await conn.sendText(
          remoteJid,
          `✦ El usuario @${targetNum} ya está baneado.`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 🚫 BANEAR USUARIO
      // ══════════════════════════════════════════════════════
      global.db.data.users[targetJid].banned = true
      global.db.data.users[targetJid].bannedAt = new Date().toISOString()
      global.db.data.users[targetJid].bannedBy = senderJid

      // ══════════════════════════════════════════════════════
      // 📨 MENSAJE DE CONFIRMACIÓN
      // ══════════════════════════════════════════════════════
      let mensaje = `🚫 *USUARIO BANEADO*\n\n`
      mensaje += `━━━━━━━━━━━━━━━━━\n`
      mensaje += `👤 Usuario: @${targetNum}\n`
      mensaje += `⏰ Fecha: ${new Date().toLocaleString()}\n`
      mensaje += `❌ Estado: Baneado\n`
      mensaje += `━━━━━━━━━━━━━━━━━\n\n`
      mensaje += `El usuario no podrá usar comandos del bot.\n\n`

      // ══════════════════════════════════════════════════════
      // 📌 MAPEO DE MENCIONES (múltiples formatos)
      // ══════════════════════════════════════════════════════
      const mentionVariants = createMentionVariants(targetNum)

      await conn.sendText(
        remoteJid,
        mensaje,
        m,
        { mentions: mentionVariants }
      )

    } catch (err) {
      console.error(`❌ Error en banuser.js:`, err.message)
      console.error(err.stack)
      await conn.sendText(remoteJid, "⚠️ Error ejecutando banuser.").catch(() => {})
    }
  }
}
