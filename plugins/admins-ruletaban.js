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
  command: ["ruletaban"],
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
          `❌ Este comando solo se puede usar en grupos.`,
          m
        )
      }

      // Validar que sea admin
      if (!isAdmin) {
        return await conn.sendText(
          remoteJid,
          `⛔ Este comando solo puede usarlo un administrador.`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 🎯 FILTRAR USUARIOS EXPULSABLES
      // ══════════════════════════════════════════════════════
      
      // Obtener owners del bot
      const ownerNumbers = new Set([
        ...(global.owner || []).map(o => cleanNum(Array.isArray(o) ? o[0] : o)),
        ...(global.ownerData || []).map(o => cleanNum(Array.isArray(o) ? o[0] : o))
      ])

      const botNum = cleanNum(conn.user.jid)

      // Filtrar solo usuarios normales (no admins, ni bot, ni dueños)
      let kickables = participants.filter(p => {
        const pNum = cleanNum(p.id)
        return (
          !p.admin &&                    // no es admin
          !ownerNumbers.has(pNum) &&     // no es owner
          pNum !== botNum                // no es el bot
        )
      })

      // ══════════════════════════════════════════════════════
      // ✅ VALIDAR QUE HAY USUARIOS EXPULSABLES
      // ══════════════════════════════════════════════════════
      if (kickables.length === 0) {
        return await conn.sendText(
          remoteJid,
          `😅 No hay miembros normales disponibles para expulsar.`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 🎲 ELEGIR USUARIO AL AZAR
      // ══════════════════════════════════════════════════════
      const elegido = kickables[Math.floor(Math.random() * kickables.length)]
      const elegidoNum = cleanNum(elegido.id)
      const elegidoJid = normalizeJid(elegido.id)

      // ══════════════════════════════════════════════════════
      // 📢 ENVIAR MENSAJE DE RULETA
      // ══════════════════════════════════════════════════════
      let mensaje = `🎯 *Ruleta Ban Activada...*\n`
      mensaje += `💣 ¡El elegido al azar fue @${elegidoNum}!\n\n`
      mensaje += `👋 ¡Hasta la próxima!`

      // Mapeo de menciones
      const mentionVariants = [
        `${elegidoNum}@s.whatsapp.net`,
        `${elegidoNum}@lid`
      ]

      await conn.sendText(
        remoteJid,
        mensaje,
        m,
        { mentions: mentionVariants }
      )

      console.log(`🎲 Ruleta Ban: ${elegidoNum} fue elegido`)

      // ══════════════════════════════════════════════════════
      // ⏳ ESPERAR 3 SEGUNDOS
      // ══════════════════════════════════════════════════════
      await new Promise(resolve => setTimeout(resolve, 3000))

      // ══════════════════════════════════════════════════════
      // 🔪 EXPULSAR USUARIO
      // ══════════════════════════════════════════════════════
      try {
        await conn.groupParticipantsUpdate(remoteJid, [elegido.id], "remove")

        console.log(`✅ ${elegidoNum} expulsado por Ruleta Ban`)

      } catch (err) {
        console.error(`❌ Error expulsando: ${err.message}`)
        
        await conn.sendText(
          remoteJid,
          `⚠️ Hubo un error expulsando al usuario.`,
          m
        )
      }

    } catch (err) {
      console.error(`❌ Error en ruletaban.js:`, err.message)
      console.error(err.stack)

      await conn.sendText(
        remoteJid,
        `⚠️ Error ejecutando comando.`,
        m
      ).catch(() => {})
    }
  }
}
