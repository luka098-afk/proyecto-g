/**
 * Plugin: WARN/ADVERTENCIA
 * Sistema de advertencias para usuarios
 * 3 advertencias = expulsión automática
 *
 * Uso:
 * .warn @usuario razón
 * .warn número razón
 * .warn (citando mensaje) razón
 */

function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

export default {
  command: ["warn", "advertencia", "ad", "advertir"],
  admin: true,

  run: async ({ conn, m, args, text, remoteJid, isGroup, senderJid }) => {
    try {
      if (!isGroup) {
        return await conn.sendText(remoteJid, "❌ Este comando solo funciona en grupos.")
      }

      // VARIABLES INICIALES
      let targetJid = null
      let targetJidOriginal = null
      let targetJidMention = null // JID para mencionar (puede ser @lid)
      let reason = ""

      // OPCIÓN 1: Mención nativa (@lid o similar)
      const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
      if (mentions.length > 0) {
        targetJid = mentions[0]
        targetJidOriginal = mentions[0]
        targetJidMention = mentions[0] // Guardar el JID original para mencionar
        reason = args.slice(1).join(" ").trim()
      }

      // OPCIÓN 2: Argumento como @número o número
      if (!targetJid && args[0]) {
        const cleanArg = args[0].replace(/[@]/g, "").replace(/[^0-9]/g, "")
        if (cleanArg.length > 5) {
          targetJid = cleanArg + "@s.whatsapp.net"
          targetJidOriginal = cleanArg + "@s.whatsapp.net"
          targetJidMention = cleanArg + "@s.whatsapp.net"
          reason = args.slice(1).join(" ").trim()
        }
      }

      // OPCIÓN 3: Citando un mensaje
      if (!targetJid && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        targetJid = m.message.extendedTextMessage.contextInfo.participant
        targetJidOriginal = m.message.extendedTextMessage.contextInfo.participant
        targetJidMention = m.message.extendedTextMessage.contextInfo.participant
        reason = args.join(" ").trim()
      }

      // Si no hay objetivo, error
      if (!targetJid) {
        return await conn.sendText(
          remoteJid,
          `✦ Debes mencionar, escribir el número o citar a alguien.\n\n` +
          `Ejemplos:\n` +
          `• .warn @usuario razón\n` +
          `• .warn 123456789 razón\n` +
          `• .warn razón (citando mensaje)`
        )
      }

      // NORMALIZAR JID: convertir @lid a @s.whatsapp.net para almacenamiento
      if (targetJid.includes("@lid")) {
        targetJid = targetJid.replace("@lid", "@s.whatsapp.net")
      }

      if (!reason) reason = "Sin razón especificada."

      const targetNum = cleanNum(targetJid)

      // SISTEMA DE WARNS EN BD
      if (!global.db.data.warn) global.db.data.warn = {}
      if (!global.db.data.warn[remoteJid]) global.db.data.warn[remoteJid] = {}
      if (!global.db.data.warn[remoteJid][targetJid]) {
        global.db.data.warn[remoteJid][targetJid] = { warns: 0, reasons: [] }
      }

      global.db.data.warn[remoteJid][targetJid].warns++
      global.db.data.warn[remoteJid][targetJid].reasons.push(reason)

      const wCount = global.db.data.warn[remoteJid][targetJid].warns
      const maxWarns = 3

      // MENSAJE RESPUESTA
      let mensaje = `⚠️ *ADVERTENCIA APLICADA*\n\n`
      mensaje += `👤 Usuario: @${targetNum}\n`
      mensaje += `📄 Motivo: *${reason}*\n`
      mensaje += `🔢 Advertencias: *${wCount}/${maxWarns}*\n`

      if (wCount >= maxWarns) {
        mensaje += `\n🚫 *LÍMITE ALCANZADO - Usuario será removido*`
      }

      // ENVIAR MENSAJE CON MENCIÓN
      await conn.sendText(remoteJid, mensaje, m, { mentions: [targetJidMention] })

      // Si llegó al límite, remover usuario
      if (wCount >= maxWarns) {
        try {
          await conn.groupParticipantsUpdate(remoteJid, [targetJidOriginal], "remove")
          await conn.sendText(
            remoteJid,
            `✅ @${targetNum} fue removido del grupo por exceso de advertencias.`,
            m,
            { mentions: [targetJidMention] }
          )
          delete global.db.data.warn[remoteJid][targetJid]
        } catch (err) {
          await conn.sendText(
            remoteJid,
            `⚠️ No pude remover al usuario. Verifica que el bot sea admin.`
          )
        }
      }

    } catch (err) {
      console.error(`❌ Error en warn.js:`, err.message)
      console.error(err.stack)
      await conn.sendText(remoteJid, "⚠️ Error ejecutando warn.").catch(() => {})
    }
  }
} // ✅ Cierre final del export default
