import { saveDB } from '../db.js'

export default {
  command: ["juegos"],
  admin: true,

  run: async ({ conn, m, remoteJid, isGroup, isAdmin, senderJid }) => {
    try {
      // ══════════════════════════════════════════════════════
      // ✅ VALIDAR QUE SEA GRUPO
      // ══════════════════════════════════════════════════════
      if (!isGroup) {
        return await conn.sendText(
          remoteJid,
          `❌ Este comando solo funciona en grupos.`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // ✅ VALIDAR QUE SEA ADMIN
      // ══════════════════════════════════════════════════════
      if (!isAdmin) {
        return await conn.sendText(
          remoteJid,
          `🛡️ Solo los administradores pueden usar este comando.`,
          m,
          { mentions: [senderJid] }
        )
      }

      // ══════════════════════════════════════════════════════
      // 💾 INICIALIZAR BD
      // ══════════════════════════════════════════════════════
      if (!global.db.data.chats) global.db.data.chats = {}
      if (!global.db.data.chats[remoteJid]) {
        global.db.data.chats[remoteJid] = {}
      }
      
      // Inicializar solo el campo de juegos si no existe
      if (global.db.data.chats[remoteJid].juegos === undefined) {
        global.db.data.chats[remoteJid].juegos = true
      }

      const chat = global.db.data.chats[remoteJid]

      // ══════════════════════════════════════════════════════
      // 🎮 TOGGLE JUEGOS
      // ══════════════════════════════════════════════════════
      chat.juegos = !chat.juegos

      // Guardar cambios en la base de datos
      await saveDB()

      // ══════════════════════════════════════════════════════
      // 📢 MENSAJE DE CONFIRMACIÓN
      // ══════════════════════════════════════════════════════
      const estado = chat.juegos ? '✅ ACTIVADOS' : '❌ DESACTIVADOS'
      const emoji = chat.juegos ? '🎮' : '🚫'

      let mensaje = `${emoji} *JUEGOS ${estado}*\n\n`
      
      if (chat.juegos) {
        mensaje += `Ahora todos los miembros pueden jugar.\n`
        mensaje += `Usa *.menu* para ver los juegos disponibles.`
      } else {
        mensaje += `Los juegos están desactivados.\n`
        mensaje += `Un admin puede activarlos con: *.juegos*`
      }

      await conn.sendText(remoteJid, mensaje, m)

      console.log(`🎮 Juegos ${chat.juegos ? 'activados' : 'desactivados'} en: ${remoteJid}`)

    } catch (err) {
      console.error(`❌ Error en juegos.js:`, err.message)
      console.error(err.stack)

      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '⚠️', key: m.key }
        })
      } catch (e) {
        console.log(`⚠️ No se pudo reaccionar: ${e.message}`)
      }
    }
  }
}
