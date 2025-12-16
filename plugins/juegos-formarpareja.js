function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

export default {
  command: ["formarpareja"],
  admin: false,

  run: async ({ conn, m, remoteJid, isGroup, participants }) => {
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
      // ✅ VALIDAR QUE HAYA SUFICIENTES PARTICIPANTES
      // ══════════════════════════════════════════════════════
      if (!participants || participants.length < 2) {
        return await conn.sendText(
          remoteJid,
          `❌ Se necesitan al menos 2 miembros en el grupo.`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 🎲 ELEGIR DOS PERSONAS AL AZAR
      // ══════════════════════════════════════════════════════
      const allJids = participants.map(p => p.id)

      // Primera persona
      const personaA = allJids[Math.floor(Math.random() * allJids.length)]
      
      // Segunda persona (diferente a la primera)
      let personaB
      do {
        personaB = allJids[Math.floor(Math.random() * allJids.length)]
      } while (personaB === personaA)

      const numA = cleanNum(personaA)
      const numB = cleanNum(personaB)

      // ══════════════════════════════════════════════════════
      // 📍 MAPEAR JIDS REALES PARA MENCIONES
      // ══════════════════════════════════════════════════════
      const metadata = await conn.groupMetadata(remoteJid)
      const groupParticipants = metadata.participants || []
      
      let realPersonaA = personaA
      let realPersonaB = personaB
      
      for (const p of groupParticipants) {
        const pNum = cleanNum(p.id)
        if (pNum === numA) {
          realPersonaA = p.id
        }
        if (pNum === numB) {
          realPersonaB = p.id
        }
      }

      // ══════════════════════════════════════════════════════
      // 💕 ENVIAR MENSAJE DE PAREJA
      // ══════════════════════════════════════════════════════
      await conn.sendText(
        remoteJid,
        `💍 *@${numA}, Deberías casarte con @${numB}, hacen una bonita pareja* 💓`,
        m,
        { mentions: [realPersonaA, realPersonaB] }
      )

      console.log(`💕 Pareja formada: ${numA} + ${numB}`)

    } catch (err) {
      console.error(`❌ Error en formarpareja.js:`, err.message)
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
