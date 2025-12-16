function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "")
}

export default {
  command: ["autoadmin"],
  tags: ["owner"],
  owner: true,        // Solo owners
  group: true,
  botAdmin: true,     // El bot debe ser admin para promover

  run: async ({ conn, m, remoteJid, isAdmin }) => {
    const ok = "✅"
    const warn = "⚠️"
    const err = "❌"

    try {
      // Ya es admin
      if (isAdmin) {
        return await conn.sendText(remoteJid, `${warn} Ya eres administrador.`, m)
      }

      console.log(`🔼 Promoviendo a owner: ${m.sender}`)

      // Promover al usuario
      await conn.groupParticipantsUpdate(remoteJid, [m.sender], "promote")

      // Reacción de éxito
      await m.react(ok)

    } catch (e) {
      console.error("❌ Error en autoadmin:", e)
      await conn.sendText(remoteJid, `${err} Ocurrió un error.`, m)
    }
  }
}
