export default {
  command: ["link"],

  run: async ({ conn, m, args, text, remoteJid, senderJid, isGroup }) => {
    try {
      // ══════════════════════════════════════════════════════
      // ✅ VALIDACIONES INICIALES
      // ══════════════════════════════════════════════════════

      // Validar que sea grupo
      if (!isGroup) {
        return await conn.sendText(
          remoteJid,
          `❌ Este comando solo funciona en grupos.`
        )
      }

      // ══════════════════════════════════════════════════════
      // 🔗 OBTENER ENLACE DEL GRUPO
      // ══════════════════════════════════════════════════════
      try {
        const link = await conn.groupInviteCode(remoteJid)

        // ══════════════════════════════════════════════════════
        // 📨 ENVIAR ENLACE
        // ══════════════════════════════════════════════════════
        let mensaje = `🔗 *Link del grupo:*\n`
        mensaje += `https://chat.whatsapp.com/${link}`

        await conn.sendText(
          remoteJid,
          mensaje,
          m
        )

        console.log(`✅ Enlace del grupo enviado: ${remoteJid}`)

      } catch (err) {
        console.error(`❌ Error obteniendo enlace: ${err.message}`)

        await conn.sendText(
          remoteJid,
          `⚠️ No pude obtener el enlace del grupo.\n\n` +
          `Verifica que el bot sea administrador.`,
          m
        )
      }

    } catch (err) {
      console.error(`❌ Error en link.js:`, err.message)
      console.error(err.stack)

      await conn.sendText(
        remoteJid,
        `⚠️ Error ejecutando comando.`,
        m
      ).catch(() => {})
    }
  }
}
