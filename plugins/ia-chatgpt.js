const requests = {}
const lastRequestTime = {}

function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

export default {
  command: ["ia", "chatgpt", "bot", "ia2", "chatgpt2", "bot2"],
  admin: false,

  before: async ({ conn, m, text, senderJid }) => {
    try {
      // ══════════════════════════════════════════════════════
      // 📥 VERIFICAR SI ES RESPUESTA DE LA IA
      // ══════════════════════════════════════════════════════
      const senderNum = cleanNum(senderJid)
      const iaNum = "18002428478" // Número de la IA sin @s.whatsapp.net
      
      // Verificar si el remitente es la IA (por número, no por JID completo)
      if (senderNum !== iaNum) return

      console.log("📩 Mensaje recibido de ChatGPT")
      console.log("📍 Sender:", senderJid)

      const messageText = text || ''
      console.log("📝 Texto existe:", !!messageText)

      // Extraer el identificador de la respuesta de la IA
      let match = messageText.match(/^identificador:\s*([^\n]+)\n([\s\S]+)/i)

      if (match) {
        console.log("✅ Match exitoso")

        let requestId = match[1].trim() // El identificador único
        let iaResponse = match[2].trim() // Mensaje real de la IA

        console.log("🔑 Request ID:", requestId)

        if (requests[requestId]) {
          let { chat, originalMessage } = requests[requestId]

          // Enviar la respuesta al usuario original citando su mensaje
          await conn.sendText(chat, iaResponse, originalMessage)

          // Eliminar la solicitud de la memoria
          delete requests[requestId]

          console.log(`✅ Respuesta enviada para: ${requestId}`)
        } else {
          console.log(`⚠️ No se encontró request para: ${requestId}`)
          console.log(`📋 Requests disponibles:`, Object.keys(requests))
        }
      } else {
        console.log("❌ No se pudo hacer match del identificador")
        console.log("📝 Texto recibido:", messageText.substring(0, 100))
      }
    } catch (err) {
      console.error(`❌ Error en ia.js (before):`, err.message)
    }
  },

  run: async ({ conn, m, remoteJid, senderJid, isGroup, text }) => {
    try {
      // ══════════════════════════════════════════════════════
      // ✅ VALIDAR QUE HAYA TEXTO
      // ══════════════════════════════════════════════════════
      if (!text || !text.trim()) {
        return await conn.sendText(
          remoteJid,
          `❌ Por favor, proporciona un texto para la consulta.\n\n*Ejemplo:*\n.ia ¿Cuál es la capital de Francia?\n.ia Explícame la teoría de la relatividad`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // ⏱️ VERIFICAR COOLDOWN (30 SEGUNDOS)
      // ══════════════════════════════════════════════════════
      if (lastRequestTime[senderJid] && Date.now() - lastRequestTime[senderJid] < 30000) {
        const remainingTime = Math.ceil((30000 - (Date.now() - lastRequestTime[senderJid])) / 1000)
        return await conn.sendText(
          remoteJid,
          `⏱️ Espera *${remainingTime} segundos* para usar nuevamente el comando.`,
          m
        )
      }

      lastRequestTime[senderJid] = Date.now()

      // ══════════════════════════════════════════════════════
      // 💬 INDICAR QUE ESTÁ ESCRIBIENDO
      // ══════════════════════════════════════════════════════
      try {
        await conn.sendPresenceUpdate("composing", remoteJid)
      } catch (err) {
        console.log(`⚠️ No se pudo actualizar presencia`)
      }

      // ══════════════════════════════════════════════════════
      // 📤 PREPARAR MENSAJE PARA LA IA
      // ══════════════════════════════════════════════════════
      const sendMsg = `prompt: cada mensaje que se te envía pertenece a un identificador único. En absolutamente todas tus respuestas, pondrás al comienzo de tu respuesta: identificador: y aqui el identificador.

Mensaje del identificador: ${m.key.id}

Mensaje: ${text}`

      // Almacenar la solicitud con el identificador
      requests[m.key.id] = {
        user: senderJid,
        chat: remoteJid,
        originalMessage: m
      }

      console.log(`📨 Solicitud almacenada: ${m.key.id}`)

      // ══════════════════════════════════════════════════════
      // ⏳ TIMEOUT (120 SEGUNDOS)
      // ══════════════════════════════════════════════════════
      setTimeout(() => {
        if (requests[m.key.id]) {
          delete requests[m.key.id]
          conn.sendText(
            remoteJid,
            "⏱️ Lo siento, no puedo ayudarte con esa petición (timeout).",
            m
          )
          console.log(`⏱️ Timeout para: ${m.key.id}`)
        }
      }, 120000)

      // ══════════════════════════════════════════════════════
      // 📨 ENVIAR CONSULTA A LA IA
      // ══════════════════════════════════════════════════════
      await conn.sendMessage("18002428478@s.whatsapp.net", { text: sendMsg })

      console.log(`✅ Consulta enviada a ChatGPT para: ${m.key.id}`)

    } catch (err) {
      console.error(`❌ Error en ia.js:`, err.message)
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
