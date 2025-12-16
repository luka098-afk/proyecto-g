import { saveDB } from '../db.js'

export default {
  command: ["config"],
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
        global.db.data.chats[remoteJid] = {}
      }

      const chat = global.db.data.chats[remoteJid]

      // Valores por defecto
      const defaults = {
        antilink: true,
        anticanal: true,
        antiestado: true,
        antieliminar: false,
        antiInstagram: false,
        antiTiktok: false,
        antiTelegram: false,
        anticall: false,
        detect: false,
        adminMode: false,
        botEnabled: true
      }

      // Aplicar valores por defecto solo si no existen
      Object.keys(defaults).forEach(key => {
        if (chat[key] === undefined) {
          chat[key] = defaults[key]
        }
      })

      // Guardar cambios en BD
      if (global.db.write) {
        await global.db.write()
      } else {
        saveDB()
      }

      // Crear mensaje de estado
      const antilink = chat.antilink ? '✅ Activo' : '❌ Inactivo'
      const anticanal = chat.anticanal ? '✅ Activo' : '❌ Inactivo'
      const antiestado = chat.antiestado ? '✅ Activo' : '❌ Inactivo'
      const antieliminar = chat.antieliminar ? '✅ Activo' : '❌ Inactivo'
      const antiInstagram = chat.antiInstagram ? '✅ Activo' : '❌ Inactivo'
      const antiTiktok = chat.antiTiktok ? '✅ Activo' : '❌ Inactivo'
      const antiTelegram = chat.antiTelegram ? '✅ Activo' : '❌ Inactivo'
      const anticall = chat.anticall ? '✅ Activo' : '❌ Inactivo'
      const detect = chat.detect ? '✅ Activo' : '❌ Inactivo'
      const adminMode = chat.adminMode ? '🔒 Activo' : '🔓 Inactivo'
      const botEnabled = chat.botEnabled !== false ? '✅ Encendido' : '🔴 Apagado'

      let mensaje = `*⚙️ CONFIGURACIÓN DEL GRUPO*\n\n`
      mensaje += `━━━━━━━━━━━━━━━━━━━━\n`
      mensaje += `🤖 *Estado del Bot:* ${botEnabled}\n`
      mensaje += `👥 *Modo Admin:* ${adminMode}\n`
      mensaje += `━━━━━━━━━━━━━━━━━━━━\n\n`
      mensaje += `*🛡️ PROTECCIONES:*\n`
      mensaje += `🔗 *Antilink:* ${antilink}\n`
      mensaje += `📱 *Anticanal:* ${anticanal}\n`
      mensaje += `📊 *Antiestado:* ${antiestado}\n`
      mensaje += `🗑️ *Antieliminar:* ${antieliminar}\n`
      mensaje += `📷 *AntiInstagram:* ${antiInstagram}\n`
      mensaje += `🎵 *AntiTikTok:* ${antiTiktok}\n`
      mensaje += `✈️ *AntiTelegram:* ${antiTelegram}\n`
      mensaje += `📞 *Anticall:* ${anticall}\n`
      mensaje += `🔍 *Detect:* ${detect}\n\n`
      mensaje += `━━━━━━━━━━━━━━━━━━━━\n`
      mensaje += `_Para activar/desactivar usa:_\n`
      mensaje += `• .bc → Encender/apagar bot\n`
      mensaje += `• .modoadmin → Modo solo admins\n`
      mensaje += `• .detect → Detectar cambios del grupo\n`
      mensaje += `• Y los comandos específicos de cada función`

      await conn.sendText(remoteJid, mensaje, m)

    } catch (err) {
      console.error(`❌ Error en config.js:`, err.message)
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
