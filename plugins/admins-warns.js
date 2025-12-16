function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

export default {
  command: ["warns", "listadv", "listaadvertencias", "listwarns", "advertencias"],
  admin: true,

  run: async ({ conn, m, args, remoteJid, isGroup }) => {
    try {
      if (!isGroup) {
        return await conn.sendText(remoteJid, "❌ Este comando solo funciona en grupos.")
      }

      if (!global.db.data.warn || !global.db.data.warn[remoteJid]) {
        return await conn.sendText(remoteJid, "📋 No hay usuarios con advertencias en este grupo.")
      }

      const groupWarns = global.db.data.warn[remoteJid]
      const warnedUsers = Object.keys(groupWarns)
      if (warnedUsers.length === 0) {
        return await conn.sendText(remoteJid, "📋 No hay usuarios con advertencias en este grupo.")
      }

      // --- Obtener participantes del grupo y mapear número -> JID real ---
      const groupMetadata = await conn.groupMetadata(remoteJid)
      const jidMap = {}
      groupMetadata.participants.forEach(p => {
        const num = cleanNum(p.id)
        jidMap[num] = p.id
      })

      // --- Ver si se especifica un usuario ---
      let targetJid = null

      const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

      if (mentions.length > 0) {
        targetJid = mentions[0]
      } else if (args[0]) {
        const cleanArg = args[0].replace(/[^0-9]/g, "")
        if (cleanArg.length > 5) {
          targetJid = cleanArg + "@s.whatsapp.net"
        }
      } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        targetJid = m.message.extendedTextMessage.contextInfo.participant
      }

      if (targetJid) {
        // Normalizar @lid
        targetJid = targetJid.includes("@lid") ? targetJid.replace("@lid", "@s.whatsapp.net") : targetJid
        const targetNum = cleanNum(targetJid)
        const realJid = jidMap[targetNum] || targetJid

        if (!groupWarns[targetJid]) {
          return await conn.sendText(
            remoteJid,
            `⚠️ @${targetNum} no tiene advertencias.`,
            m,
            { mentions: [realJid] }
          )
        }

        const userData = groupWarns[targetJid]

        let mensaje = `📋 *ADVERTENCIAS DE @${targetNum}*\n\n`
        mensaje += `👤 Usuario: @${targetNum}\n`
        mensaje += `⚠️ Total: *${userData.warns}/3*\n`

        if (userData.reasons?.length) {
          mensaje += `\n📝 *Razones:*\n`
          userData.reasons.forEach((r, i) => {
            mensaje += `${i + 1}. ${r}\n`
          })
        }

        if (userData.warns >= 3) mensaje += `\n🚫 *Usuario con límite alcanzado*`

        return await conn.sendText(remoteJid, mensaje, m, { mentions: [realJid] })
      }

      // --- Mostrar lista completa ---
      let listaTexto = `📋 *LISTA DE ADVERTENCIAS DEL GRUPO*\n\n`
      const mentionsForList = []
      let contador = 1

      for (const userJid of warnedUsers) {
        const warnData = groupWarns[userJid]
        if (!warnData || warnData.warns <= 0) continue

        const userNum = cleanNum(userJid)
        const estado = warnData.warns >= 3 ? "🚫" : "⚠️"
        const realJid = jidMap[userNum] || userJid

        listaTexto += `${contador}. @${userNum}\n`
        listaTexto += `   ${estado} *Advertencias:* ${warnData.warns}/3\n`
        if (warnData.reasons?.length)
          listaTexto += `   📝 *Último motivo:* ${warnData.reasons[warnData.reasons.length - 1]}\n`
        listaTexto += "\n"

        mentionsForList.push(realJid)
        contador++
      }

      listaTexto += `📊 *Total de usuarios advertidos:* ${mentionsForList.length}\n`
      listaTexto += `\n💡 Usa: *.warns @usuario* para ver detalles`

      await conn.sendText(remoteJid, listaTexto, m, { mentions: mentionsForList })

    } catch (err) {
      console.error("❌ Error en warns.js:", err)
      await conn.sendText(remoteJid, "⚠️ Error ejecutando warns.").catch(() => {})
    }
  }
}
