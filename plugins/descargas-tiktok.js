import axios from 'axios'

// Obtener token y cookies desde la web de tmate
async function obtenerTokenYCookie() {
  const res = await axios.get('https://tmate.cc/id', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })
  const cookie = res.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || ''
  const tokenMatch = res.data.match(/<input[^>]+name="token"[^>]+value="([^"]+)"/i)
  const token = tokenMatch?.[1]
  if (!token) throw new Error('No se encontró el token')
  return { token, cookie }
}

// Descargar video o imagen desde TikTok
async function descargarDeTikTok(urlTikTok) {
  const { token, cookie } = await obtenerTokenYCookie()
  const params = new URLSearchParams()
  params.append('url', urlTikTok)
  params.append('token', token)

  const res = await axios.post('https://tmate.cc/action', params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://tmate.cc/id',
      'Origin': 'https://tmate.cc',
      'Cookie': cookie
    }
  })

  const html = res.data?.data
  if (!html) throw new Error('No se recibió ningún dato')

  const tituloMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
  const titulo = tituloMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || 'Sin título'

  const coincidencias = [...html.matchAll(/<a[^>]+href="(https:\/\/[^"]+)"[^>]*>\s*<span>\s*<span>([^<]*)<\/span><\/span><\/a>/gi)]
  const vistos = new Set()
  const enlaces = coincidencias
    .map(([_, href, etiqueta]) => ({ href, label: etiqueta.trim() }))
    .filter(({ href }) => !href.includes('play.google.com') && !vistos.has(href) && vistos.add(href))

  const enlacesMp4 = enlaces.filter(v => /download without watermark/i.test(v.label))
  const enlaceMp3 = enlaces.find(v => /download mp3 audio/i.test(v.label))

  if (enlacesMp4.length > 0) {
    return { type: 'video', mp4Links: enlacesMp4, mp3Link: enlaceMp3 }
  }

  const coincidenciasImg = [...html.matchAll(/<img[^>]+src="(https:\/\/tikcdn\.app\/a\/images\/[^"]+)"/gi)]
  const imagenes = [...new Set(coincidenciasImg.map(m => m[1]))]

  if (imagenes.length > 0) {
    return { type: 'image', images: imagenes, mp3Link: enlaceMp3 }
  }

  throw new Error('No se encontró respuesta, puede que el enlace esté mal')
}

export default {
  command: ["tiktok"],
  run: async ({ conn, m, text, remoteJid }) => {
    try {
      if (!text) {
        await conn.sendMessage(remoteJid, { react: { text: "❌", key: m.key } })
        conn.sendText(remoteJid, `😕 ¿dónde está el enlace de TikTok?\nEjemplo: .tiktok https://vt.tiktok.com/abcd/`, m)
        return
      }

      await conn.sendMessage(remoteJid, { react: { text: "⏳", key: m.key } })
      const resultado = await descargarDeTikTok(text)

      if (resultado.type === 'video') {
        await conn.sendMessage(remoteJid, {
          video: { url: resultado.mp4Links[0].href },
          caption: `✅ Video descargado exitosamente`
        })
      } else if (resultado.type === 'image') {
        for (let i = 0; i < resultado.images.length; i++) {
          await conn.sendMessage(remoteJid, {
            image: { url: resultado.images[i] },
            caption: `🖼️ *Imagen ${i + 1}*`
          })
        }
        await conn.sendMessage(remoteJid, {
          text: `✅ Imágenes descargadas exitosamente`
        })
      }

      // Solo enviar MP3 si el contenido original es audio (no hay video)
      if (resultado.mp3Link && resultado.type !== 'video') {
        await conn.sendMessage(remoteJid, {
          audio: { url: resultado.mp3Link.href },
          mimetype: 'audio/mpeg'
        })
        await conn.sendMessage(remoteJid, {
          text: `🎵 Audio descargado exitosamente`
        })
      }

      await conn.sendMessage(remoteJid, { react: { text: "✨", key: m.key } })

    } catch (e) {
      console.error(`❌ Error en tiktok:`, e.message)
      await conn.sendMessage(remoteJid, { react: { text: "⛔️", key: m.key } })
      conn.sendText(remoteJid, `😔 Error al descargar desde TikTok\n> \`${e.message}\`\nIntenta enviar el enlace otra vez.`, m)
    }
  }
}
