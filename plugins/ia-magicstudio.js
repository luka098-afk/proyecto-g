import axios from 'axios'
import FormData from 'form-data'
import { v4 as uuidv4 } from 'uuid'

// ─────────────────────────────────────────
// 🔧 Funciones auxiliares (SIEMPRE van afuera)
// ─────────────────────────────────────────

function generateClientId(length = 40) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = ''
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

async function magicstudio(prompt) {
  const anonymousUserId = uuidv4()
  const requestTimestamp = (Date.now() / 1000).toFixed(3)
  const clientId = generateClientId()

  const formData = new FormData()
  formData.append('prompt', prompt)
  formData.append('output_format', 'bytes')
  formData.append('user_profile_id', 'null')
  formData.append('anonymous_user_id', anonymousUserId)
  formData.append('request_timestamp', requestTimestamp)
  formData.append('user_is_subscribed', 'false')
  formData.append('client_id', clientId)

  const config = {
    method: 'POST',
    url: 'https://ai-api.magicstudio.com/api/ai-art-generator',
    headers: {
      ...formData.getHeaders(),
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json, text/plain, */*',
      'origin': 'https://magicstudio.com',
      'referer': 'https://magicstudio.com/ai-art-generator/'
    },
    responseType: 'arraybuffer',
    data: formData
  }

  const response = await axios.request(config)
  return response.data
}

// ─────────────────────────────────────────
// 📌 PLUGIN (todo acá dentro, sin azul)
// ─────────────────────────────────────────

export default {
  command: ["magicstudio", "ms"],
  admin: false,

  run: async ({ conn, m, remoteJid, args }) => {
    try {
      const prompt = args.join(" ")
      if (!prompt) {
        return await conn.sendText(
          remoteJid,
          `✏️ *Escribe un texto para generar una imagen*\n\nEjemplo:\n.magicstudio chica anime con cabello azul`,
          m
        )
      }

      // Reacción inicial
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: "🎨", key: m.key }
        })
      } catch {}

      await conn.sendText(
        remoteJid,
        `⏳ *Generando imagen...*\nEsto puede tardar unos segundos.`,
        m
      )

      // Generar imagen
      const imageBuffer = await magicstudio(prompt)

      // Enviar imagen
      await conn.sendMessage(
        remoteJid,
        {
          image: imageBuffer,
          caption: `✨ *Imagen generada por MagicStudio*\n\nPrompt: _${prompt}_`
        },
        { quoted: m }
      )

      // Reacción final
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: "✅", key: m.key }
        })
      } catch {}

    } catch (e) {
      await conn.sendText(
        remoteJid,
        `❌ *Error:* ${e.message}`,
        m
      )

      try {
        await conn.sendMessage(remoteJid, {
          react: { text: "⚠️", key: m.key }
        })
      } catch {}
    }
  }
}
