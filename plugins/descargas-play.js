import yts from "yt-search"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import { existsSync, promises } from "fs"

const execAsync = promisify(exec)
const ytDlpPath = process.platform === "win32" ? "./node_modules/gs/ygs.exe" : "./node_modules/gs/ygs"

export default {
  command: ["play"],
  run: async ({ conn, m, args, text, remoteJid }) => {
    try {
      // Limpiar el comando del texto
      let query = (text || "").replace(/^\.play\s*/i, "").trim()
      
      // Si no hay query en text, usar args
      if (!query && args?.length > 0) {
        query = args.join(" ").trim()
      }
      
      if (!query) {
        return conn.sendText(remoteJid, "❗ Debes ingresar un artista y una canción.\n\nEjemplo: .play Canserbero - mundo de piedra", m)
      }
      
      await conn.sendMessage(remoteJid, { react: { text: "⌛", key: m.key } })

      const yt_play = await search(query)
      if (!yt_play.length) {
        console.log("❌ No se encontraron resultados para:", query)
        return
      }

      const url = yt_play[0].url
      const randomFileName = Math.random().toString(36).substring(2, 15)
      
      const format = "140/251/249"
      const messageType = "audio"
      const mimeType = "audio/mp4"
      const fileExtension = ".m4a"
      const outputPath = path.join("./tmp", `${randomFileName}${fileExtension}`)

      // Crear carpeta tmp si no existe
      try {
        await promises.mkdir("./tmp", { recursive: true })
      } catch (e) {
        console.error("⚠️ Error creando carpeta tmp:", e.message)
      }

      // Enviar preview
      await conn.sendMessage(
        remoteJid,
        {
          image: { url: yt_play[0].thumbnail },
          caption: `🎧 *${yt_play[0].title}*\n\n⏳ Descargando audio...`
        },
        { quoted: m }
      )

      // Descargar
      const commandStr = `${ytDlpPath} -f "${format}" --extractor-args "youtube:player_client=default" --no-warnings -o "${outputPath}" "${url}"`
      
      let execResult
      try {
        execResult = await execAsync(commandStr)
      } catch (error) {
        execResult = {
          stdout: error.stdout || "",
          stderr: error.stderr || error.message || ""
        }
      }

      const stderr = typeof execResult.stderr === "string" ? execResult.stderr : ""
      const lower = stderr.toLowerCase()
      const esWarning = lower.includes("warning:") || lower.includes("signature extraction failed") || lower.includes("sabr streaming") || lower.includes("some web_safari")

      if (!esWarning && stderr && lower.includes("error")) {
        console.error(`❌ Error en YouTube: ${stderr}`)
        return
      }

      // Buscar archivo real
      const tmpFiles = await promises.readdir("./tmp")
      const foundFile = tmpFiles.find(f => f.startsWith(randomFileName))
      const finalPath = foundFile ? path.join("./tmp", foundFile) : outputPath

      if (existsSync(finalPath)) {
        const mediaBuffer = await promises.readFile(finalPath)
        await conn.sendMessage(remoteJid, { [messageType]: mediaBuffer, mimetype: mimeType }, { quoted: m })
        await promises.unlink(finalPath)
        await conn.sendMessage(remoteJid, { react: { text: "✨", key: m.key } })
        console.log(`✅ ${yt_play[0].title} enviado exitosamente`)
      } else {
        console.error(`❌ El archivo de audio no se encontró.`)
      }

    } catch (error) {
      console.error("❌ Error en plugin de youtube:", error.message)
    }
  }
}

async function search(query, options = {}) {
  const r = await yts.search({ query, hl: "es", gl: "ES", ...options })
  return r.videos
}
