/**
 * Plugin: BOT ON/OFF (Toggle)
 * Permite al owner apagar/encender el bot en un grupo específico
 *
 * Uso:
 * .bc → Alterna entre encendido/apagado (toggle)
 * .bc status → Ver estado del bot
 * 
 * Cuando está apagado: reacciona con ❌ a usuarios no-owner
 */

export default {
  command: "bc",
  owner: true,
  ignoreDisabled: true, // Este comando SIEMPRE funciona, incluso con bot apagado

  run: async (ctx) => {
    const { conn, m, args, remoteJid, isGroup } = ctx

    console.log(`🎮 Ejecutando: bc`)

    if (!isGroup) {
      return await conn.sendText(remoteJid, "❌ Este comando solo funciona en grupos.")
    }

    if (!global.db.data.chats[remoteJid]) {
      global.db.data.chats[remoteJid] = { botEnabled: true }
    }

    const action = (args[0] || "toggle").toLowerCase().trim()

    switch (action) {
      case "status":
      case "estado":
        const estado = global.db.data.chats[remoteJid].botEnabled ? "✅ Encendido" : "🔴 Apagado"
        console.log(`📊 Estado: ${estado}`)
        return await conn.sendText(remoteJid, `Estado del bot: ${estado}`)

      case "toggle":
      default:
        // Toggle: alternar el estado
        global.db.data.chats[remoteJid].botEnabled = !global.db.data.chats[remoteJid].botEnabled

        if (global.db.data.chats[remoteJid].botEnabled) {
          console.log(`✅ Bot ON en ${remoteJid}`)
          return await conn.sendText(remoteJid, "✅ *Bot ENCENDIDO*\n\nEl bot ya responderá a comandos.")
        } else {
          console.log(`🔴 Bot OFF en ${remoteJid}`)
          return await conn.sendText(remoteJid, "🔴 *Bot APAGADO*\n\nSolo el owner puede encenderlo.")
        }
    }
  },

  // BEFORE HOOK: Ejecuta antes de procesar cualquier comando
  // Reacciona con ❌ cuando el bot está apagado y un usuario no-owner intenta usarlo
  before: async (ctx) => {
    const { conn, m, remoteJid, isGroup, isOwner } = ctx

    // Solo verificar en grupos
    if (!isGroup) return false

    // Si es owner, dejar pasar
    if (isOwner) return false

    // Verificar si el bot está deshabilitado
    if (global.db.data.chats[remoteJid]?.botEnabled === false) {
      // Extraer el texto del mensaje
      const text = m.message?.conversation || 
                   m.message?.extendedTextMessage?.text || 
                   m.message?.imageMessage?.caption || 
                   m.message?.videoMessage?.caption || ""

      // Si el mensaje empieza con el prefijo (es un intento de comando)
      const prefix = global.config?.prefix || "."
      if (text.startsWith(prefix)) {
        console.log(`🚫 Bot deshabilitado - Reaccionando con ❌ a comando de usuario`)
        
        // Reaccionar con ❌
        try {
          await conn.sendMessage(remoteJid, {
            react: {
              text: "❌",
              key: m.key
            }
          })
        } catch (err) {
          console.error("Error reaccionando:", err.message)
        }
        
        // Detener el procesamiento del comando
        return true
      }
    }

    // No detener el procesamiento
    return false
  }
}
