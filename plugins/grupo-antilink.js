import { saveDB } from '../db.js'

function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

export default {
  command: ["antilink"],
  admin: true,
  run: async ({ conn, m, args, text, remoteJid, senderJid, isGroup, isAdmin }) => {
    try {
      // ══════════════════════════════════════════════════════
      // ✅ VALIDACIONES INICIALES
      // ══════════════════════════════════════════════════════

      // Validar que sea grupo
      if (!isGroup) {
        return await conn.sendText(
          remoteJid,
          `❌ Este comando solo funciona en grupos.`,
          m
        )
      }

      // Validar que sea admin
      if (!isAdmin) {
        return await conn.sendText(
          remoteJid,
          `🛡️ Solo los administradores pueden usar este comando.`,
          m,
          { mentions: [senderJid] }
        )
      }

      // ══════════════════════════════════════════════════════
      // 💾 INICIALIZAR BD DE GRUPO
      // ══════════════════════════════════════════════════════
      if (!global.db.data.chats) global.db.data.chats = {}
      if (!global.db.data.chats[remoteJid]) {
        global.db.data.chats[remoteJid] = {
          antilink: true,
          anticanal: true
        }
      }

      // ══════════════════════════════════════════════════════
      // 🔄 TOGGLE ANTILINK
      // ══════════════════════════════════════════════════════
      const estadoActual = global.db.data.chats[remoteJid].antilink
      const nuevoEstado = !estadoActual

      global.db.data.chats[remoteJid].antilink = nuevoEstado

      // GUARDAR EN JSON
      saveDB()

      // ══════════════════════════════════════════════════════
      // ✅ REACCIÓN DE CONFIRMACIÓN
      // ══════════════════════════════════════════════════════
      const emoji = nuevoEstado ? '✅' : '❌'
      try {
        const num = cleanNum(senderJid)
        const mentionVariants = [
          `${num}@s.whatsapp.net`,
          `${num}@lid`
        ]
        await conn.sendMessage(remoteJid, {
          react: { text: emoji, key: m.key }
        })
      } catch (err) {
        console.log(`⚠️ No se pudo reaccionar: ${err.message}`)
      }

      console.log(`${nuevoEstado ? '✅ Antilink ACTIVADO' : '❌ Antilink DESACTIVADO'}: ${remoteJid}`)

    } catch (err) {
      console.error(`❌ Error en antilink.js:`, err.message)
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
