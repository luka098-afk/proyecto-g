import axios from 'axios'

export default {
  command: ["instagram"],
  run: async ({ conn, m, args, text, remoteJid }) => {
    try {
      // Limpiar el comando del texto
      let url = (text || "").replace(/^\.instagram\s*/i, "").replace(/^\.ig\s*/i, "").trim()
      
      // Si no hay url en text, usar args
      if (!url && args?.length > 0) {
        url = args.join(" ").trim()
      }
      
      if (!url) {
        return conn.sendText(remoteJid, "❗ Debes ingresar un enlace de Instagram.\n\nEjemplo: .instagram https://www.instagram.com/p/...", m)
      }

      await conn.sendMessage(remoteJid, { react: { text: "⏳", key: m.key } })

      let res
      try {
        res = await axios.get(`https://apis-starlights-team.koyeb.app/starlight/instagram-dl?url=${encodeURIComponent(url)}`)
      } catch (e) {
        console.error("❌ Error al obtener datos de Instagram:", e.message)
        await conn.sendMessage(remoteJid, { react: { text: "⚠️", key: m.key } })
        return
      }

      const result = res.data
      
      if (!result || !result.url || result.url.length === 0) {
        console.log("❌ No se encontraron resultados para:", url)
        await conn.sendMessage(remoteJid, { react: { text: "⚠️", key: m.key } })
        return
      }

      const videoUrl = result.url[0]

      if (!videoUrl) {
        console.error("❌ No se encontró un enlace de descarga válido.")
        await conn.sendMessage(remoteJid, { react: { text: "⚠️", key: m.key } })
        return
      }

      const maxRetries = 3

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await conn.sendMessage(remoteJid, {
            video: { url: videoUrl },
            caption: "📸 Aquí tienes el video de Instagram.",
            fileName: "instagram.mp4",
            mimetype: "video/mp4"
          }, { quoted: m })

          await conn.sendMessage(remoteJid, { react: { text: "✨", key: m.key } })
          console.log(`✅ Video de Instagram descargado exitosamente`)
          break
        } catch (e) {
          if (attempt === maxRetries) {
            console.error(`❌ Error al enviar el video después de ${maxRetries} intentos:`, e.message)
            await conn.sendMessage(remoteJid, { react: { text: "⚠️", key: m.key } })
            return
          }
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

    } catch (error) {
      console.error("❌ Error en plugin de Instagram:", error.message)
      await conn.sendMessage(remoteJid, { react: { text: "⚠️", key: m.key } })
    }
  }
}
