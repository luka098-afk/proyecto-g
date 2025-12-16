function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

export default {
  command: ["banlist", "listban", "banlista"],
  owner: true,

  run: async ({ conn, m, args, text, remoteJid, senderJid, isOwner }) => {
    try {
      // OBTENER BANEADOS
      if (!global.db.data.users) global.db.data.users = {}
      if (!global.db.data.chats) global.db.data.chats = {}

      const users = Object.entries(global.db.data.users).filter(([jid, data]) => data.banned === true)
      const chats = Object.entries(global.db.data.chats).filter(([jid, data]) => data.isBanned === true)

      // MAPEO DE NÚMEROS A JID (incluyendo @lid)
      const userMentions = []
      let userList = ""
      
      for (const [jid, data] of users) {
        let userJid = jid.includes('@') ? jid : `${jid}@s.whatsapp.net`
        
        // Normalizar
        if (userJid.includes('@lid')) {
          userJid = userJid.replace('@lid', '@s.whatsapp.net')
        }
        
        const number = cleanNum(userJid)
        
        // Crear ambas versiones del JID para mencionar
        const jidS = `${number}@s.whatsapp.net`
        const jidLid = `${number}@lid`
        
        userList += `├ @${number}\n`
        
        // Agregar ambas versiones para intentar mencionar
        userMentions.push(jidS)
        userMentions.push(jidLid)
      }

      // PREPARAR LISTA DE CHATS
      let chatList = ""
      chats.forEach(([jid], i) => {
        chatList += `├ ${jid}\n`
      })

      // CONSTRUIR MENSAJE
      let caption = `┌〔 📋 LISTA DE BANEADOS 〕\n\n`

      caption += `┌〔 👤 Usuarios - Baneados 〕\n`
      caption += `├ Total : ${users.length}\n`
      if (users.length > 0) {
        caption += userList
      } else {
        caption += `├ Ninguno\n`
      }
      caption += `└────\n\n`

      caption += `┌〔 💬 Chats - Baneados 〕\n`
      caption += `├ Total : ${chats.length}\n`
      if (chats.length > 0) {
        caption += chatList
      } else {
        caption += `├ Ninguno\n`
      }
      caption += `└────`

      // Limpiar menciones duplicadas y inválidas
      const cleanMentions = [...new Set(userMentions.filter(m => m && m.length > 0))]

      console.log('Menciones finales:', cleanMentions)
      
      // ENVIAR
      await conn.sendText(
        remoteJid,
        caption,
        m,
        { 
          mentions: cleanMentions
        }
      )

    } catch (err) {
      console.error(`❌ Error en banlist.js:`, err.message)
      console.error(err.stack)
      await conn.sendText(remoteJid, "⚠️ Error listando bans.").catch(() => {})
    }
  }
}
