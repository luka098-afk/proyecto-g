/**
 * Plugin: Validador de Comandos
 * - Si empieza con . y NO es un comando válido → Dice que no existe
 * - Cuenta comandos usados
 * - Permite comandos del owner y comandos con ignoreDisabled cuando el bot está apagado
 * - Ignora texto que no sea un comando válido (ej: ..., ._., ./, etc)
 */

let globalPlugins = {}

export default {
  before: async ({ conn, m, text, remoteJid, isGroup, senderJid, isOwner }) => {
    try {
      if (!text || !text.startsWith(".")) return false

      const prefix = "."
      const comando = text.slice(prefix.length).trim().split(" ")[0].toLowerCase()

      if (!comando) return false

      // ✅ VALIDAR que el comando empiece con letra o número
      // Ignora: ..., ._., ./, .-., .!., etc
      if (!/^[a-z0-9]/.test(comando)) {
        return false // No es un comando real, ignorar
      }

      // Obtener plugins desde memoria global
      globalPlugins = global.pluginsCache || {}

      // Verificar si es un comando válido
      let commandoExiste = false
      let pluginEncontrado = null

      for (const plugin of Object.values(globalPlugins)) {
        if (!plugin?.command) continue

        let match = false
        if (typeof plugin.command === "function") {
          match = plugin.command(comando)
        } else if (plugin.command instanceof RegExp) {
          match = plugin.command.test(comando)
        } else if (Array.isArray(plugin.command)) {
          match = plugin.command.map(c => c.toLowerCase()).includes(comando)
        } else {
          match = plugin.command?.toString?.().toLowerCase() === comando
        }

        if (match) {
          commandoExiste = true
          pluginEncontrado = plugin
          break
        }
      }

      // No validar ciertos comandos especiales
      if (comando === "bot" || comando === "boton" || comando === "help" || comando === "bc") {
        return false
      }

      // Si es grupo, verificar si bot está habilitado
      if (isGroup && global.db.data.chats[remoteJid]?.botEnabled === false) {
        // PERMITIR si es owner O si el plugin tiene ignoreDisabled
        if (!isOwner && !pluginEncontrado?.ignoreDisabled) {
          // Solo reaccionar con ❌, sin mensaje
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
          return true // Detener ejecución
        }
      }

      // Contar comandos
      if (!global.db.data.users) global.db.data.users = {}
      if (!global.db.data.users[senderJid]) {
        global.db.data.users[senderJid] = { commands: 0 }
      }
      global.db.data.users[senderJid].commands = (global.db.data.users[senderJid].commands || 0) + 1

      // Si comando NO existe
      if (!commandoExiste) {
        console.log(`⚠️ Comando no válido: ${comando}`)
        await conn.sendText(remoteJid, `《✦》El comando *${text.trim()}* no existe.\n\nUsa: *.help* para ver la lista.`).catch(() => {})
        return true // Detener ejecución
      }

      return false // Continuar con el comando

    } catch (error) {
      console.error(`❌ Error en _validCommand:`, error.message)
      return false
    }
  }
}
