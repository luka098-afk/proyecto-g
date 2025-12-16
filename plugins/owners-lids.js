import config from "../config.js"

export default {
  command: "lid",
  owner: true, // Solo owners pueden usarloo

  run: async ({ conn, m, remoteJid, isGroup, senderJid }) => {
    try {
      if (!isGroup) {
        return await conn.sendText(remoteJid, "❌ Este comando solo funciona en grupos.")
      }

      const metadata = await conn.groupMetadata(remoteJid)

      // Función para obtener número
      const numero = (jid) => {
        if (!jid) return "desconocido"
        return jid.split("@")[0]
      }

      // Función para obtener nombre real si existe
      const obtenerNombre = async (jid) => {
        try {
          if (!jid) return "desconocido"
          const name = await conn.getName(jid)
          if (!name || name === jid) return numero(jid)
          return name
        } catch {
          return numero(jid)
        }
      }

      // Función para obtener LID desde config.lidMap
      const obtenerLid = (jid) => {
        if (!jid) return "desconocido"
        const num = numero(jid)
        const entry = Object.entries(config.lidMap).find(([lid, n]) => n === num)
        return entry ? entry[0] : num
      }

      // Obtener menciones
      const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

      // ====================================================
      // SI MENCIONA A ALGUIEN → MOSTRAR SU LID
      // ====================================================
      if (mentions.length > 0) {
        const user = mentions[0]
        const name = await obtenerNombre(user)
        const num = numero(user)
        const lid = obtenerLid(user)

        const texto = `
╭─✿ *LID del Usuario* ✿─╮
│ *Nombre:* ${name}
│ *Número:* @${num}
│ *LID:* ${lid}
│ *JID:* ${user}
╰─────────────────────╯`.trim()

        return await conn.sendText(remoteJid, texto, m, { mentions: [user] })
      }

      // ====================================================
      // SIN MENCIONES → MI LID + GRUPO
      // ====================================================
      const myJid = senderJid || m.sender
      const myName = await obtenerNombre(myJid)
      const myNum = numero(myJid)
      const myLid = obtenerLid(myJid)

      const texto = `
╭─✿ *Mi LID* ✿─╮
│ *Nombre:* ${myName}
│ *Número:* @${myNum}
│ *LID:* ${myLid}
│ *JID:* ${myJid}
╰─────────────────────╯

╭─✿ *ID del Grupo* ✿─╮
│ *Nombre:* ${metadata.subject}
│ *JID:* ${remoteJid}
│ *Participantes:* ${metadata.participants.length}
╰─────────────────────╯`.trim()

      return await conn.sendText(remoteJid, texto, m, { mentions: [myJid] })

    } catch (e) {
      console.error("❌ Error en .lid:", e)
      return await conn.sendText(remoteJid, "❌ Error ejecutando LID.")
    }
  }
}
