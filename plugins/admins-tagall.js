function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

export default {
  command: ["tagall"],
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
          `❗ Este comando solo se puede usar en grupos.`,
          m
        )
      }

      // Validar que sea admin
      if (!isAdmin) {
        return await conn.sendText(
          remoteJid,
          `🛡️ Solo los administradores pueden usar este comando.`,
          m,
          { mentions: [senderJid] }
        )
      }

      // ══════════════════════════════════════════════════════
      // 📝 OBTENER MENSAJE
      // ══════════════════════════════════════════════════════
      const mensaje = args.length > 0 ? args.join(' ') : 'HOLAAAAA'

      // ══════════════════════════════════════════════════════
      // 👥 OBTENER MENCIONES
      // ══════════════════════════════════════════════════════
      const menciones = participants.map(p => p.id)
      const textoMencion = menciones.map(u => '@' + cleanNum(u)).join(' ')

      // ══════════════════════════════════════════════════════
      // 📢 ENVIAR MENSAJE CON TAGALL
      // ══════════════════════════════════════════════════════
      await conn.sendText(
        remoteJid,
        `${mensaje}\n\n${textoMencion}`,
        m,
        { mentions: menciones }
      )

      console.log(`✅ TagAll enviado a ${menciones.length} participantes`)
      console.log(`📝 Mensaje: ${mensaje}`)

    } catch (err) {
      console.error(`❌ Error en tagall.js:`, err.message)
      console.error(err.stack)

      await conn.sendText(
        remoteJid,
        `⚠️ Error ejecutando comando.`,
        m
      ).catch(() => {})
    }
  }
}
