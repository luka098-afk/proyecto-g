function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default {
  command: ["sortear"],
  admin: false,

  run: async ({ conn, m, remoteJid, senderJid, isGroup, participants, text }) => {
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
      // ✅ VALIDAR QUE HAYA TEXTO
      // ══════════════════════════════════════════════════════
      if (!text || !text.trim()) {
        return await conn.sendText(
          remoteJid,
          `🕷️ Por favor escribe lo que deseas sortear.\n\n*Ejemplo:*\n.sortear una skin\n.sortear un rol\n.sortear una pizza`,
          m
        )
      }

      // Limpiar el texto (quitar el comando si viene incluido)
      text = text.replace(/^\.sortear\s*/i, '').trim()

      // ══════════════════════════════════════════════════════
      // ✅ VALIDAR QUE HAYA PARTICIPANTES
      // ══════════════════════════════════════════════════════
      if (!participants || participants.length < 1) {
        return await conn.sendText(
          remoteJid,
          `❌ No hay participantes en el grupo.`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 🎲 ELEGIR GANADOR AL AZAR
      // ══════════════════════════════════════════════════════
      const allJids = participants.map(p => p.id)
      const ganadorJid = allJids[Math.floor(Math.random() * allJids.length)]
      const ganadorNum = cleanNum(ganadorJid)

      // ══════════════════════════════════════════════════════
      // 📍 MAPEAR JID REAL PARA MENCIONES
      // ══════════════════════════════════════════════════════
      const metadata = await conn.groupMetadata(remoteJid)
      const groupParticipants = metadata.participants || []
      
      let realGanadorJid = ganadorJid
      for (const p of groupParticipants) {
        if (cleanNum(p.id) === ganadorNum) {
          realGanadorJid = p.id
          break
        }
      }

      // ══════════════════════════════════════════════════════
      // 🎉 CREAR MENSAJE DE SORTEO
      // ══════════════════════════════════════════════════════
      let mensaje = `🎉 *¡SORTEO AL AZAR!* 🎉\n\n📦 Premio: *${text}*\n🥳 Ganador: @${ganadorNum}\n\n¡Felicitaciones! 🎊`

      // ══════════════════════════════════════════════════════
      // ⌨️ ANIMACIÓN DE ESCRITURA
      // ══════════════════════════════════════════════════════
      let txt = ''
      let count = 0

      for (const c of mensaje) {
        await delay(15)
        txt += c
        count++

        // Actualizar estado de "escribiendo" cada 10 caracteres
        if (count % 10 === 0) {
          try {
            await conn.sendPresenceUpdate('composing', remoteJid)
          } catch (err) {
            console.log(`⚠️ No se pudo actualizar presencia`)
          }
        }
      }

      // ══════════════════════════════════════════════════════
      // 📤 ENVIAR MENSAJE FINAL
      // ══════════════════════════════════════════════════════
      await conn.sendText(
        remoteJid,
        txt.trim(),
        m,
        { mentions: [realGanadorJid] }
      )

      console.log(`🎉 Sorteo realizado: ${text} → ganador: ${ganadorNum}`)

    } catch (err) {
      console.error(`❌ Error en sortear.js:`, err.message)
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
