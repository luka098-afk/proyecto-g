export default {
  command: "ping",
  
  async run({ conn, remoteJid }) {
    // Usar sendText que ya tiene el canal integrado automáticamente
    await conn.sendText(remoteJid, "🏓 Pong!")
  }
}
