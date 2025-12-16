function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

export default {
  command: ["top"],
  admin: false,

  run: async ({ conn, m, remoteJid, isGroup, participants, text }) => {
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
          `Por favor, ingrese un texto para hacer un Top 10.\n\n*Ejemplo:*\n.top más guapos\n.top más inteligentes\n.top más graciosos`,
          m
        )
      }

      // Limpiar el texto (quitar el comando si viene incluido)
      text = text.replace(/^\.top\s*/i, '').trim()

      // ══════════════════════════════════════════════════════
      // ✅ VALIDAR QUE HAYA SUFICIENTES PARTICIPANTES
      // ══════════════════════════════════════════════════════
      if (!participants || participants.length < 10) {
        return await conn.sendText(
          remoteJid,
          `❌ Se necesitan al menos 10 miembros en el grupo para hacer un Top 10.`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 🎲 ELEGIR 10 PERSONAS AL AZAR
      // ══════════════════════════════════════════════════════
      const allJids = participants.map(p => p.id)
      const seleccionados = []

      // Seleccionar 10 personas únicas
      while (seleccionados.length < 10) {
        const randomJid = allJids[Math.floor(Math.random() * allJids.length)]
        if (!seleccionados.includes(randomJid)) {
          seleccionados.push(randomJid)
        }
      }

      // Asignar posiciones
      const [a, b, c, d, e, f, g, h, i, j] = seleccionados

      // Obtener números limpios
      const nums = seleccionados.map(jid => cleanNum(jid))

      // ══════════════════════════════════════════════════════
      // 📍 MAPEAR JIDS REALES PARA MENCIONES
      // ══════════════════════════════════════════════════════
      const metadata = await conn.groupMetadata(remoteJid)
      const groupParticipants = metadata.participants || []
      
      const realJids = []
      
      for (const selectedJid of seleccionados) {
        const selectedNum = cleanNum(selectedJid)
        let realJid = selectedJid
        
        for (const p of groupParticipants) {
          if (cleanNum(p.id) === selectedNum) {
            realJid = p.id
            break
          }
        }
        
        realJids.push(realJid)
      }

      // ══════════════════════════════════════════════════════
      // 🎨 EMOJI ALEATORIO
      // ══════════════════════════════════════════════════════
      const emoji = pickRandom(['🤓','😅','😂','😳','😎', '🥵', '😱', '🤑', '🙄', '💩','🍑','🤨','🥴','🔥','👇🏻','😔', '👀','🌚'])

      // ══════════════════════════════════════════════════════
      // 📋 CREAR MENSAJE DE TOP 10
      // ══════════════════════════════════════════════════════
      const mensaje = `*${emoji} Top 10 ${text} ${emoji}*
    
*1.* @${nums[0]}
*2.* @${nums[1]}
*3.* @${nums[2]}
*4.* @${nums[3]}
*5.* @${nums[4]}
*6.* @${nums[5]}
*7.* @${nums[6]}
*8.* @${nums[7]}
*9.* @${nums[8]}
*10.* @${nums[9]}`

      // ══════════════════════════════════════════════════════
      // 📤 ENVIAR MENSAJE
      // ══════════════════════════════════════════════════════
      await conn.sendText(
        remoteJid,
        mensaje,
        m,
        { mentions: realJids }
      )

      console.log(`🏆 Top 10 creado: ${text}`)

    } catch (err) {
      console.error(`❌ Error en top.js:`, err.message)
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
