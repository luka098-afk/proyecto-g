export default {
  command: ["g"],
  admin: true,

  run: async ({ conn, m, args, text, remoteJid, senderJid, isGroup, isAdmin }) => {
    try {
      // ══════════════════════════════════════════════════════
      // ✅ VALIDACIONES INICIALES
      // ══════════════════════════════════════════════════════

      // Validar que sea grupo
      if (!isGroup) {
        return await conn.sendText(
          remoteJid,
          `❗ Este comando solo se puede usar en grupos.`
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
      // 🔧 OBTENER INFORMACIÓN DEL GRUPO
      // ══════════════════════════════════════════════════════
      let groupInfo = null
      try {
        groupInfo = await conn.groupMetadata(remoteJid)
      } catch (err) {
        console.error(`⚠️ Error obteniendo metadata del grupo: ${err.message}`)
        return await conn.sendText(
          remoteJid,
          `⚠️ No se pudo obtener la información del grupo.`
        )
      }

      const isAnnouncement = groupInfo.announce

      // ══════════════════════════════════════════════════════
      // 🔄 CAMBIAR CONFIGURACIÓN
      // ══════════════════════════════════════════════════════
      let mensaje = ""
      let newStatus = ""

      try {
        if (isAnnouncement) {
          // El grupo está cerrado, abrirlo
          await conn.groupSettingUpdate(remoteJid, 'not_announcement')
          newStatus = "ABIERTO"
          
          // Reaccionar con candado abierto
          try {
            await conn.sendMessage(remoteJid, { react: { text: '🔓', key: m.key } })
          } catch (err) {
            console.log(`⚠️ No se pudo reaccionar con 🔓: ${err.message}`)
          }
          
        } else {
          // El grupo está abierto, cerrarlo
          await conn.groupSettingUpdate(remoteJid, 'announcement')
          newStatus = "CERRADO"
          
          // Reaccionar con candado cerrado
          try {
            await conn.sendMessage(remoteJid, { react: { text: '🔒', key: m.key } })
          } catch (err) {
            console.log(`⚠️ No se pudo reaccionar con 🔒: ${err.message}`)
          }
        }

        console.log(`✅ Grupo ${newStatus}: ${remoteJid}`)

      } catch (err) {
        console.error(`❌ Error cambiando configuración: ${err.message}`)
        console.log(`⚠️ No se pudo cambiar la configuración del grupo`)
        
        // Reaccionar con advertencia
        try {
          await conn.sendMessage(remoteJid, { react: { text: '⚠️', key: m.key } })
        } catch (e) {
          console.log(`⚠️ No se pudo reaccionar: ${e.message}`)
        }
        
        return await conn.sendText(
          remoteJid,
          `❌ No se pudo cambiar la configuración del grupo.\n\n` +
          `Verifica que el bot sea administrador.`
        )
      }

    } catch (err) {
      console.error(`❌ Error en g.js:`, err.message)
      console.error(err.stack)
      await conn.sendText(remoteJid, "⚠️ Error ejecutando comando.").catch(() => {})
    }
  }
}
