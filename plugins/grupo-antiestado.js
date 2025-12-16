import { saveDB } from '../db.js'

export default {
  command: ["antiestado"],
  admin: true,
  run: async ({ conn, m, remoteJid, isGroup, isAdmin, senderJid }) => {
    try {
      // Validar que sea grupo
      if (!isGroup) {
        return await conn.sendText(
          remoteJid,
          `❌ Este comando solo funciona en grupos.`,
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

      // Inicializar BD de grupo si no existe
      if (!global.db.data.chats) global.db.data.chats = {}
      if (!global.db.data.chats[remoteJid]) {
        global.db.data.chats[remoteJid] = {
          antilink: true,
          anticanal: true,
          antiestado: true
        }
      }

      // Toggle antiestado
      const estadoActual = global.db.data.chats[remoteJid].antiestado
      const nuevoEstado = !estadoActual

      global.db.data.chats[remoteJid].antiestado = nuevoEstado

      // Guardar en BD
      saveDB()

      // Reacción de confirmación
      const emoji = nuevoEstado ? '✅' : '❌'
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: emoji, key: m.key }
        })
      } catch (err) {
        console.log(`⚠️ No se pudo reaccionar: ${err.message}`)
      }

      console.log(`${nuevoEstado ? '✅ Antiestado ACTIVADO' : '❌ Antiestado DESACTIVADO'}: ${remoteJid}`)

    } catch (err) {
      console.error(`❌ Error en antiestado.js:`, err.message)
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
