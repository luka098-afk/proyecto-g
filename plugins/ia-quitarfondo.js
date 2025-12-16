import axios from 'axios'
import FormData from 'form-data'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const REMOVEBG_KEY = 'DoFQ3ioq9QQ4VGsmweVs9YUk'

// Función para remover fondo con remove.bg
async function removeBackground(imageBuffer) {
  const form = new FormData()
  form.append('image_file', imageBuffer, { filename: 'image.jpg' })
  form.append('size', 'auto')

  const response = await axios.post(
    'https://api.remove.bg/v1.0/removebg',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'X-Api-Key': REMOVEBG_KEY
      },
      responseType: 'arraybuffer'
    }
  )

  return Buffer.from(response.data)
}

export default {
  command: ["quitarfondo"],
  admin: false,

  run: async ({ conn, m, remoteJid }) => {
    try {
      // ══════════════════════════════════════════════════════
      // 📸 VERIFICAR QUE HAYA IMAGEN
      // ══════════════════════════════════════════════════════
      let q = m.message?.extendedTextMessage?.contextInfo ? m : null
      
      if (!q) {
        return await conn.sendText(
          remoteJid,
          `❌ Debes responder a una imagen para quitar el fondo.\n\n*Uso:*\n[Responder a imagen]\n.quitarfondo`,
          m
        )
      }

      // Verificar que sea una imagen
      const imageMessage = q.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
      
      if (!imageMessage) {
        return await conn.sendText(
          remoteJid,
          `❌ Debes responder a una imagen.\n\n*Uso:*\n[Responder a imagen]\n.quitarfondo`,
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

      await conn.sendText(
        remoteJid,
        `⏳ Removiendo fondo de la imagen...\n\nEsto puede tardar unos segundos...`,
        m
      )

      // ══════════════════════════════════════════════════════
      // 📥 DESCARGAR IMAGEN
      // ══════════════════════════════════════════════════════
      console.log(`📥 Descargando imagen...`)
      
      const stream = await downloadContentFromMessage(imageMessage, 'image')
      let buffer = Buffer.from([])
      
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      console.log(`✅ Imagen descargada: ${buffer.length} bytes`)

      // ══════════════════════════════════════════════════════
      // 🎨 REMOVER FONDO
      // ══════════════════════════════════════════════════════
      console.log(`🎨 Removiendo fondo con remove.bg...`)

      const resultBuffer = await removeBackground(buffer)

      console.log(`✅ Fondo removido: ${resultBuffer.length} bytes`)

      // ══════════════════════════════════════════════════════
      // 📤 ENVIAR RESULTADO
      // ══════════════════════════════════════════════════════
      await conn.sendMessage(remoteJid, {
        image: resultBuffer,
        caption: `✅ *Fondo removido*`,
        mimetype: 'image/png'
      }, { quoted: m })

      console.log(`✅ Imagen sin fondo enviada`)

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
      console.error(`❌ Error en ia-quitarfondo.js:`, err.message)
      console.error(err.stack)

      await conn.sendText(
        remoteJid,
        `❌ Ocurrió un error al remover el fondo.\n\n*Error:* ${err.message}\n\nIntenta con otra imagen o más tarde.`,
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
