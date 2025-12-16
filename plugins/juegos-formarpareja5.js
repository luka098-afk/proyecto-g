function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

export default {
  command: ["formarpareja5"],
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
      if (!participants || participants.length < 10) {
        return await conn.sendText(
          remoteJid,
          `❌ Se necesitan al menos 10 miembros en el grupo para formar 5 parejas.`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 🎲 ELEGIR 10 PERSONAS AL AZAR (5 PAREJAS)
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

      // Asignar parejas
      const [a, b, c, d, e, f, g, h, i, j] = seleccionados

      // Obtener números limpios
      const numA = cleanNum(a)
      const numB = cleanNum(b)
      const numC = cleanNum(c)
      const numD = cleanNum(d)
      const numE = cleanNum(e)
      const numF = cleanNum(f)
      const numG = cleanNum(g)
      const numH = cleanNum(h)
      const numI = cleanNum(i)
      const numJ = cleanNum(j)

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
      // 💕 CREAR MENSAJE DE TOP 5 PAREJAS
      // ══════════════════════════════════════════════════════
      const mensaje = `*😍 Las 5 mejores parejas del grupo 😍*
    
*1.- @${numA} y @${numB}*
- Esta pareja está destinada a estar junta 💙

*2.- @${numC} y @${numD}*
- Esta pareja son dos pequeños tortolitos enamorados ✨

*3.- @${numE} y @${numF}*
- Ufff y qué decir de esta pareja, ya hasta familia deberían tener 🤱🧑‍🍼

*4.- @${numG} y @${numH}*
- Estos ya se casaron en secreto 💍

*5.- @${numI} y @${numJ}*
- Esta pareja está de luna de miel ✨🥵😍❤️`

      // ══════════════════════════════════════════════════════
      // 📤 ENVIAR MENSAJE
      // ══════════════════════════════════════════════════════
      await conn.sendText(
        remoteJid,
        mensaje,
        m,
        { mentions: realJids }
      )

      console.log(`💕 Top 5 parejas formadas en el grupo`)

    } catch (err) {
      console.error(`❌ Error en formarpareja5.js:`, err.message)
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
