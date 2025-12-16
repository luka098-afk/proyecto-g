import fetch from "node-fetch"
import { downloadContentFromMessage } from "@whiskeysockets/baileys"

export default {
  command: ["gemini"],
  admin: false,

  run: async ({ conn, m, args, text, remoteJid, usedPrefix, command }) => {
    try {
      // ══════════════════════════════════════════════════════
      // 🔍 DETECTAR SI EL MENSAJE ES UNA RESPUESTA CON IMAGEN
      // ══════════════════════════════════════════════════════
      let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || null
      let mime = quoted?.imageMessage?.mimetype || ""
      let hasImage = /^image\/(jpe?g|png)$/.test(mime)

      // ══════════════════════════════════════════════════════
      // 🛑 VALIDACIÓN
      // ══════════════════════════════════════════════════════
      if (!text && !hasImage) {
        return await conn.sendText(
          remoteJid,
          `💡 Envía o responde a una *imagen con una pregunta*, o escribe un *prompt para generar una imagen*.\n\nEjemplos:\n${usedPrefix + command} ¿Qué ves en esta imagen?\n${usedPrefix + command} Genera una imagen de un dragón futurista`,
          m
        )
      }

      // Reacción inicial
      try {
        await conn.sendMessage(remoteJid, { react: { text: "🌟", key: m.key } })
      } catch {}

      conn.sendPresenceUpdate("composing", remoteJid)

      // ══════════════════════════════════════════════════════
      // 📥 DESCARGAR IMAGEN (si existe)
      // ══════════════════════════════════════════════════════
      let base64Image = null
      let mimeType = null

      if (hasImage) {
        const stream = await downloadContentFromMessage(quoted.imageMessage, "image")
        let buffer = Buffer.from([])

        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk])
        }

        base64Image = `data:${mime};base64,${buffer.toString("base64")}`
        mimeType = mime
      }

      // ══════════════════════════════════════════════════════
      // 📦 BODY PARA API
      // ══════════════════════════════════════════════════════
      const body = {
        prompts: text ? [text] : [],
        imageBase64List: base64Image ? [base64Image] : [],
        mimeTypes: mimeType ? [mimeType] : [],
        temperature: 0.7
      }

      // ══════════════════════════════════════════════════════
      // 🌐 CONSULTA A API GEMINI
      // ══════════════════════════════════════════════════════
      const res = await fetch("https://g-mini-ia.vercel.app/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      // ══════════════════════════════════════════════════════
      // 🖼️ SI GENERÓ IMAGEN
      // ══════════════════════════════════════════════════════
      if (data?.image && data?.from === "image-generator") {
        return await conn.sendMessage(
          remoteJid,
          {
            image: data.image,
            caption: `✨ Imagen generada\n"${text}"\n\n> Gemini IA`
          },
          { quoted: m }
        )
      }

      // ══════════════════════════════════════════════════════
      // 📝 SI RESPONDIÓ TEXTO
      // ══════════════════════════════════════════════════════
      const respuesta = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!respuesta) throw new Error("La IA no devolvió respuesta válida.")

      await conn.sendText(remoteJid, respuesta.trim(), m)

      // Reacción final
      try {
        await conn.sendMessage(remoteJid, { react: { text: "✅", key: m.key } })
      } catch {}

    } catch (err) {
      console.error("❌ ERROR EN GEMINI:", err)

      await conn.sendText(
        remoteJid,
        `⚠️ Ocurrió un error procesando tu solicitud.\n\n*Error:* ${err.message}`,
        m
      )

      try {
        await conn.sendMessage(remoteJid, { react: { text: "⚠️", key: m.key } })
      } catch {}
    }
  }
}
