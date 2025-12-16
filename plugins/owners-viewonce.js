let { downloadContentFromMessage } = (await import('@whiskeysockets/baileys'))

export default {
  command: ["r"],
  owner: true,
  register: true,
  run: async ({ conn, m, remoteJid }) => {
    try {
      let quoted = m.quoted || m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      if (!quoted) {
        conn.sendText(remoteJid, `*Responde a un mensaje ViewOnce para ver su contenido.*`, m)
        return
      }

      try {
        // Intentar obtener el mensaje ViewOnce
        let viewOnceMessage = quoted.imageMessage || 
                             quoted.videoMessage ||
                             quoted.audioMessage ||
                             quoted.message?.viewOnceMessage?.mediaMessage || 
                             quoted.message?.documentMessage ||
                             quoted.mediaMessage?.imageMessage || 
                             quoted.mediaMessage?.videoMessage || 
                             quoted.mediaMessage?.audioMessage ||
                             quoted.viewOnceMessage?.mediaMessage
        
        // Verificar si es ViewOnce
        const isViewOnce = viewOnceMessage?.viewOnce
        
        if (!viewOnceMessage || !isViewOnce) {
          conn.sendText(remoteJid, `*❌ No es un mensaje ViewOnce válido.*`, m)
          return
        }
        
        let messageType = viewOnceMessage.mimetype || quoted.mtype
        
        if (!messageType) {
          conn.sendText(remoteJid, `*❌ No se pudo determinar el tipo de mensaje.*`, m)
          return
        }

        let stream = await downloadContentFromMessage(viewOnceMessage, messageType.split('/')[0])

        if (!stream) {
          conn.sendText(remoteJid, `*❌ No se pudo descargar el contenido.*`, m)
          return
        }

        let buffer = Buffer.from([])
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk])
        }

        if (messageType.includes('video')) {
          await conn.sendMessage(remoteJid, { video: buffer, caption: viewOnceMessage.caption || '', mimetype: 'video/mp4' }, { quoted: m })

        } else if (messageType.includes('image')) {
          await conn.sendMessage(remoteJid, { image: buffer, caption: viewOnceMessage.caption || '' }, { quoted: m })

        } else if (messageType.includes('audio')) {
          await conn.sendMessage(remoteJid, { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: viewOnceMessage.ptt || false }, { quoted: m })
        }

      } catch (err) {
        console.error(`❌ Error en readviewonce.js:`, err.message)
        conn.sendText(remoteJid, `*❌ No es un mensaje de imagen, video o audio ViewOnce.*`, m)
      }

    } catch (err) {
      console.error(`❌ Error en readviewonce.js:`, err.message)
    }
  }
}
