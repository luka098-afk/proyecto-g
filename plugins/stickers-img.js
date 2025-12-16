import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import { spawn } from 'child_process'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

export default {
  command: ["img"],
  admin: false,

  run: async ({ conn, m, remoteJid }) => {
    try {
      // ══════════════════════════════════════════════════════
      // ✅ VALIDAR QUE SEA STICKER
      // ══════════════════════════════════════════════════════
      const stickerMessage = m.message?.stickerMessage || 
                            m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage

      if (!stickerMessage) {
        return await conn.sendText(
          remoteJid,
          `❌ Debes responder a un sticker.\n\n*Uso:*\n[Responder a sticker]\n.img`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 🔄 REACCIÓN DE PROCESAMIENTO
      // ══════════════════════════════════════════════════════
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '⏳', key: m.key }
        })
      } catch (err) {
        console.log(`⚠️ No se pudo reaccionar`)
      }

      console.log(`🖼️ Convirtiendo sticker a imagen...`)

      // ══════════════════════════════════════════════════════
      // 📥 DESCARGAR STICKER
      // ══════════════════════════════════════════════════════
      const stream = await downloadContentFromMessage(stickerMessage, 'sticker')
      let buffer = Buffer.from([])
      
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      console.log(`✅ Sticker descargado: ${buffer.length} bytes`)

      // ══════════════════════════════════════════════════════
      // 🎨 CONVERTIR WEBP A PNG CON FFMPEG
      // ══════════════════════════════════════════════════════
      console.log(`🎨 Convirtiendo a PNG con ffmpeg...`)

      const inputPath = join(tmpdir(), `${Date.now()}.webp`)
      const outputPath = join(tmpdir(), `${Date.now()}.png`)

      // Guardar sticker temporal
      await writeFile(inputPath, buffer)

      // Convertir con ffmpeg
      await new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
          '-i', inputPath,
          '-vcodec', 'png',
          outputPath
        ])

        ffmpeg.on('close', (code) => {
          if (code === 0) resolve()
          else reject(new Error(`FFmpeg falló con código ${code}`))
        })

        ffmpeg.on('error', reject)
      })

      // Leer imagen convertida
      const { readFile } = await import('fs/promises')
      const imageBuffer = await readFile(outputPath)

      // Limpiar archivos temporales
      await unlink(inputPath).catch(() => {})
      await unlink(outputPath).catch(() => {})

      console.log(`✅ Conversión exitosa`)

      // ══════════════════════════════════════════════════════
      // 📤 ENVIAR IMAGEN
      // ══════════════════════════════════════════════════════
      await conn.sendMessage(remoteJid, {
        image: imageBuffer,
        caption: `✅ Sticker convertido a imagen`,
        mimetype: 'image/png'
      }, { quoted: m })

      console.log(`✅ Imagen enviada`)

      // ══════════════════════════════════════════════════════
      // ✅ REACCIÓN DE ÉXITO
      // ══════════════════════════════════════════════════════
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '✅', key: m.key }
        })
      } catch (err) {
        console.log(`⚠️ No se pudo reaccionar`)
      }

    } catch (err) {
      console.error(`❌ Error en sticker-toimg.js:`, err.message)
      console.error(err.stack)

      await conn.sendText(
        remoteJid,
        `❌ Ocurrió un error al convertir el sticker.\n\n*Error:* ${err.message}\n\nIntenta con otro sticker.`,
        m
      )

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
