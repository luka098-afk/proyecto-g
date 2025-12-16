function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

export default {
  command: ["tagall2"],
  admin: true,

  run: async ({ conn, m, args, text, remoteJid, senderJid, isGroup, isAdmin, participants }) => {
    try {
      // ══════════════════════════════════════════════════════
      // VALIDACIONES
      // ══════════════════════════════════════════════════════

      if (!isGroup) {
        return await conn.sendText(
          remoteJid,
          `❗ Este comando solo se puede usar en grupos.`,
          m
        )
      }

      if (!isAdmin) {
        return await conn.sendText(
          remoteJid,
          `🛡️ Solo los administradores pueden usar este comando.`,
          m,
          { mentions: [senderJid] }
        )
      }

      // ══════════════════════════════════════════════════════
      // MENSAJE
      // ══════════════════════════════════════════════════════
      const mensaje = args.length > 0 ? args.join(' ') : 'HOLAAAAA'

      // ══════════════════════════════════════════════════════
      // MENCIONES
      // ══════════════════════════════════════════════════════
      const menciones = participants.map(p => p.id)
      const textoMencion = menciones.map(u => '@' + cleanNum(u)).join(' ')

      // ══════════════════════════════════════════════════════
      // 📢 ENVIAR TAGALL 5 VECES
      // ══════════════════════════════════════════════════════
      for (let i = 0; i < 5; i++) {
        await conn.sendText(
          remoteJid,
          `${mensaje}\n\n${textoMencion}`,
          m,
          { mentions: menciones }
        )

        await new Promise(res => setTimeout(res, 500)) // pequeña pausa opcional
      }

      console.log(`✅ TagAll2 enviado 5 veces a ${menciones.length} participantes`)
      console.log(`📝 Mensaje: ${mensaje}`)

    } catch (err) {
      console.error(`❌ Error en tagall2.js:`, err.message)
      console.error(err.stack)

      await conn.sendText(
        remoteJid,
        `⚠️ Error ejecutando comando.`,
        m
      ).catch(() => {})
    }
  }
}
