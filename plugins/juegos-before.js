export default {
  before: async ({ conn, m, remoteJid, isGroup, text, isAdmin, isOwner }) => {
    try {
      // Solo validar si es un grupo
      if (!isGroup) return
      
      // Si es admin u owner, permitir siempre los juegos
      if (isAdmin || isOwner) return

      // Inicializar BD si no existe
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
      // 🎮 DETECTAR COMANDO DESDE EL TEXTO
      // ══════════════════════════════════════════════════════
      const prefix = '.'
      if (!text || !text.startsWith(prefix)) return

      const commandText = text.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase()

      // ══════════════════════════════════════════════════════
      // 🎮 LISTA DE COMANDOS DE JUEGOS
      // ══════════════════════════════════════════════════════
      const gameCommands = [
        'besar',
        'gay',
        'doxxear',
        'formarpareja',
        'formarpareja5',
        'top',
        'pajeame',
        'sortear',
        'chiste',
        'suicidarse',
        'trivia'
      ]

      // ══════════════════════════════════════════════════════
      // 🚫 VERIFICAR SI EL COMANDO ES UN JUEGO
      // ══════════════════════════════════════════════════════
      if (gameCommands.includes(commandText)) {
        // Si los juegos están desactivados, NADIE puede usarlos
        if (!chat.juegos) {
          await conn.sendText(
            remoteJid,
            `🚫 Los juegos están desactivados en este grupo.\n\n` +
            `Un administrador puede activarlos con: *.juegos*`,
            m
          )
          
          console.log(`🚫 Comando de juego bloqueado: ${commandText}`)
          
          // Detener la ejecución del comando
          return true
        }
      }

    } catch (err) {
      console.error(`❌ Error en juegos-before.js:`, err.message)
      console.error(err.stack)
    }
  }
}
