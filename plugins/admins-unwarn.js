/**
 * Plugin: UNWARN/QUITARADVERTENCIA
 * Remueve advertencias a usuarios
 * 
 * Uso:
 * .unwarn @usuario
 * .unwarn número
 * .unwarn (citando mensaje)
 */

function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

export default {
  command: ["unwarn", "quitaradvertencia", "removeradvertencia", "remwarn"],
  admin: true,

  run: async ({ conn, m, args, text, remoteJid, isGroup, senderJid }) => {
    try {
      if (!isGroup) {
        return await conn.sendText(remoteJid, "❌ Este comando solo funciona en grupos.")
      }

      // VARIABLES
      let targetJid = null
      let targetJidMention = null
      let reason = ""

      console.log("\n=== DEBUG UNWARN ===")
      console.log("args:", args)
      console.log("text:", text)

      // OPCIÓN 1: Mención nativa (@lid o similar)
      const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
      if (mentions.length > 0) {
        targetJid = mentions[0]
        targetJidMention = mentions[0]
        console.log(`✓ Mención detectada: ${targetJid}`)
      }

      // OPCIÓN 2: Argumento como @número o número
      if (!targetJid && args[0]) {
        const cleanArg = args[0].replace(/[@]/g, "").replace(/[^0-9]/g, "")
        if (cleanArg.length > 5) {
          targetJid = cleanArg + "@s.whatsapp.net"
          targetJidMention = cleanArg + "@s.whatsapp.net"
          console.log(`✓ Argumento detectado: ${targetJid}`)
        }
      }

      // OPCIÓN 3: Citando un mensaje
      if (!targetJid && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        targetJid = m.message.extendedTextMessage.contextInfo.participant
        targetJidMention = m.message.extendedTextMessage.contextInfo.participant
        console.log(`✓ Citado detectado: ${targetJid}`)
      }

      // Si no hay objetivo, error
      if (!targetJid) {
        return await conn.sendText(
          remoteJid,
          `✦ Debes mencionar, escribir el número o citar a alguien.\n\n` +
          `Ejemplo: .unwarn @usuario`
        )
      }

      // NORMALIZAR JID
      if (targetJid.includes("@lid")) {
        targetJid = targetJid.replace("@lid", "@s.whatsapp.net")
      }

      const targetNum = cleanNum(targetJid)

      console.log(`Final - Target: ${targetJid}`)
      console.log(`Final - Mention: ${targetJidMention}`)
      console.log("====================\n")

      // VERIFICAR SI EXISTE EN BD
      if (!global.db.data.warn) global.db.data.warn = {}
      if (!global.db.data.warn[remoteJid]) {
        return await conn.sendText(remoteJid, "📋 No hay usuarios con advertencias en este grupo.")
      }

      if (!global.db.data.warn[remoteJid][targetJid]) {
        return await conn.sendText(
          remoteJid,
          `⚠️ @${targetNum} no tiene advertencias.`,
          m,
          { mentions: [targetJidMention] }
        )
      }

      const warnData = global.db.data.warn[remoteJid][targetJid]
      const currentWarns = warnData.warns
      const newWarnCount = currentWarns - 1

      // Si llega a 0, eliminar completamente
      if (newWarnCount <= 0) {
        delete global.db.data.warn[remoteJid][targetJid]

        let mensaje = `✅ *ADVERTENCIAS REMOVIDAS*\n\n`
        mensaje += `👤 Usuario: @${targetNum}\n`
        mensaje += `⚠️ Advertencias anteriores: *${currentWarns}/3*\n`
        mensaje += `🎉 Advertencias actuales: *0/3*\n`
        mensaje += `\n✨ El usuario ya no tiene advertencias.`

        await conn.sendText(remoteJid, mensaje, m, { mentions: [targetJidMention] })
        console.log(`✅ Todas las advertencias removidas de ${targetNum}`)

      } else {
        // Reducir una advertencia
        global.db.data.warn[remoteJid][targetJid].warns = newWarnCount

        let mensaje = `⬇️ *ADVERTENCIA REMOVIDA*\n\n`
        mensaje += `👤 Usuario: @${targetNum}\n`
        mensaje += `⚠️ Advertencias anteriores: *${currentWarns}/3*\n`
        mensaje += `📉 Advertencias actuales: *${newWarnCount}/3*\n`
        mensaje += `\n💡 Se removió una advertencia al usuario.`

        await conn.sendText(remoteJid, mensaje, m, { mentions: [targetJidMention] })
        console.log(`✅ Advertencia removida. Nuevas: ${newWarnCount}`)
      }

    } catch (err) {
      console.error(`❌ Error en unwarn.js:`, err.message)
      await conn.sendText(remoteJid, "⚠️ Error ejecutando unwarn.").catch(() => {})
    }
  }
}
