import { downloadContentFromMessage } from '@whiskeysockets/baileys'

export const command = ["setppgrupo", "setppgroup"]
export const admin = true
export const botAdmin = true

export const run = async ({ conn, m, remoteJid }) => {
  try {
    if (!conn) conn = global.conn

    // Debe responder a una imagen
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage

    if (!quoted?.imageMessage) {
      return await conn.sendText(
        remoteJid,
        "📸 *Responde a una imagen* con:\n.setppgrupo",
        m
      )
    }

    const img = quoted.imageMessage

    // Descargar imagen
    const stream = await downloadContentFromMessage(img, 'image')
    let buffer = Buffer.from([])

    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    // Subir foto del grupo SIN usar sharp/jimp
    await conn.query({
      tag: 'iq',
      attrs: {
        to: remoteJid,
        type: 'set',
        xmlns: 'w:profile:picture'
      },
      content: [
        {
          tag: 'picture',
          attrs: { type: 'image' },
          content: buffer
        }
      ]
    })

    // Confirmación
    await conn.sendText(
      remoteJid,
      "✅ *Foto del grupo actualizada correctamente.*",
      m
    )

  } catch (err) {
    console.error("❌ Error en setppgrupo:", err)
    await conn.sendText(remoteJid, "❌ Error al actualizar la foto del grupo.", m)
  }
}
