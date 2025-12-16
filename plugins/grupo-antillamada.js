/**
 * Plugin: Anti-Llamadas (Toggle)
 * .antillamada → Activa/desactiva el bloqueo automático
 */

export default {
  command: ["antillamada", "anticall"],
  owner: true,

  run: async ({ conn, remoteJid }) => {
    // Inicializar config si no existe
    if (!global.db.data.settings) {
      global.db.data.settings = {}
    }
    if (!global.db.data.settings.anticall) {
      global.db.data.settings.anticall = { enabled: true }
    }

    // Toggle
    const config = global.db.data.settings.anticall
    config.enabled = !config.enabled

    // Guardar
    try {
      const { saveDB } = await import('../db.js')
      await saveDB()
    } catch (err) {
      console.error(`⚠️ Error guardando: ${err.message}`)
    }

    // Responder
    if (config.enabled) {
      return await conn.sendText(remoteJid, "✅ *Anti-llamadas ACTIVADO*\n\nSe bloqueará automáticamente a quien llame.")
    } else {
      return await conn.sendText(remoteJid, "🔴 *Anti-llamadas DESACTIVADO*\n\nNo se bloqueará a quien llame.")
    }
  }
}
