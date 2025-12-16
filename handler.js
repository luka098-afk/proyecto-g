import fs from 'fs'
import path from 'path'
import config from './config.js'

let plugins = {}
let groupAdminsCache = {}

// ══════════════════════════════════════════════════════
// 🔧 FUNCIONES AUXILIARES
// ══════════════════════════════════════════════════════

const cleanNumber = (id) => String(id || "").replace(/[^0-9]/g, "").trim()

function getRealNumber(jid) {
  const cleaned = cleanNumber(jid)
  if (config.lidMap?.[cleaned]) return config.lidMap[cleaned]
  return /^[567892]\d{9,}/.test(cleaned) ? cleaned : cleaned
}

function isRealOwner(number) {
  if (!number) return false
  const cleanSender = getRealNumber(number)
  if (!cleanSender) return false

  const allOwners = new Set([
    ...(config.owner || []).map(cleanNumber),
    ...(config.ownerData || []).map(o => cleanNumber(Array.isArray(o) ? o[0] : o))
  ])

  return allOwners.has(cleanSender)
}

function extractText(msg) {
  if (!msg) return ""
  if (msg.conversation) return msg.conversation
  if (msg.extendedTextMessage) return msg.extendedTextMessage.text
  if (msg.imageMessage) return msg.imageMessage.caption || ""
  if (msg.videoMessage) return msg.videoMessage.caption || ""
  if (msg.buttonsResponseMessage) return msg.buttonsResponseMessage.selectedButtonId || ""
  if (msg.listResponseMessage) return msg.listResponseMessage.singleSelectReply?.selectedRowId || ""
  if (msg.ephemeralMessage) return extractText(msg.ephemeralMessage.message)
  if (msg.viewOnceMessage) return extractText(msg.viewOnceMessage.message)
  return ""
}

// ══════════════════════════════════════════════════════
// ⚡ METADATA CACHÉ (15s)
// ══════════════════════════════════════════════════════

global.groupMetadataCache = {}

async function getGroupMetadataFast(conn, jid) {
  if (!jid.endsWith("@g.us")) return null

  const cache = global.groupMetadataCache[jid]
  if (cache && Date.now() - cache.time < 15000) return cache.data

  try {
    const data = await conn.groupMetadata(jid)
    global.groupMetadataCache[jid] = { data, time: Date.now() }
    return data
  } catch {
    return null
  }
}

// ══════════════════════════════════════════════════════
// ⚡ CARGA DE PLUGINS OPTIMIZADA
// ══════════════════════════════════════════════════════

export async function loadPlugins() {
  plugins = {}
  const folder = './plugins'

  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })

  const files = fs.readdirSync(folder).filter(f => f.endsWith('.js'))
  if (files.length === 0) return console.log(`⚠️ No hay plugins`)

  let loaded = 0, errors = 0

  await Promise.all(files.map(async file => {
    try {
      const imported = await import(`file://${path.resolve(folder, file)}`)
      const plugin = imported.default || imported
      if (plugin) {
        plugins[file] = plugin
        loaded++
      }
    } catch (err) {
      console.error(`   ❌ ${file} → ${err.message}`)
      errors++
    }
  }))

  console.log(`🔌 Plugins: ${loaded} cargados${errors > 0 ? `, ${errors} errores` : ''}\n`)
  global.pluginsCache = plugins
}

await loadPlugins()

// ══════════════════════════════════════════════════════
// 🎯 HANDLER PRINCIPAL
// ══════════════════════════════════════════════════════

export async function handler(conn, { messages }) {
  if (!messages?.length) return

  const m = messages[0]

  try {
    const rawSender = m.key?.participant || m.key?.remoteJid || ""
    const senderNumber = getRealNumber(rawSender)
    const senderJid = senderNumber + "@s.whatsapp.net"
    const text = m.message ? extractText(m.message) : ""
    const remoteJid = m.key.remoteJid

    // Inicializar DB
    global.db = global.db || { data: { users: {}, chats: {} } }
    global.db.data = global.db.data || { users: {}, chats: {} }
    if (remoteJid && !global.db.data.chats[remoteJid]) {
      global.db.data.chats[remoteJid] = { botEnabled: true }
    }

    const isGroup = remoteJid?.endsWith?.("@g.us")
    let isAdmin = false, isOwner = false, isBotAdmin = false, participants = []

    // ⚡ Metadata rápida
    if (isGroup) {
      try {
        const metadata = await getGroupMetadataFast(conn, remoteJid)
        if (metadata) {
          participants = metadata.participants || []
          groupAdminsCache[remoteJid] = participants
            .filter(p => p.admin === "admin" || p.admin === "superadmin")
            .map(p => p.id)

          const participant = participants.find(p => getRealNumber(p.id) === senderNumber)
          if (participant) isAdmin = participant.admin === "admin" || participant.admin === "superadmin"

          const botNumber = conn.user.id.split(':')[0]
          const botParticipant = participants.find(p => {
            const participantNumber = p.id.split('@')[0]
            return participantNumber === botNumber || p.id.includes(botNumber)
          })

          if (!botParticipant) {
            const adminBot = participants.find(p =>
              (p.admin === 'admin' || p.admin === 'superadmin') && getRealNumber(p.id) !== senderNumber
            )
            isBotAdmin = !!adminBot
          } else {
            isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin'
          }
        }
      } catch (err) {
        console.error("⚠️ Error metadata:", err.message)
      }
    }

    if (isRealOwner(senderJid)) {
      isOwner = true
      isAdmin = true
    }

    // 🚫 BAN
    if (!isOwner) {
      if (!global.db.data.users) global.db.data.users = {}
      const senderNum = cleanNumber(senderJid)
      const isBanned = Object.entries(global.db.data.users).some(([storedJid, userData]) =>
        cleanNumber(storedJid) === senderNum && userData.banned === true
      )

      if (isBanned) {
        if (m.message) await conn.sendText(remoteJid, `❌ *Estás baneado del bot*`, m).catch(() => {})
        return
      }
    }

    // ⚡ BEFORE HOOKS
    for (const name in plugins) {
      const plugin = plugins[name]
      if (!plugin?.before) continue

      try {
        const stop = await plugin.before({
          conn, m, text, isOwner, isAdmin, isBotAdmin, isGroup, remoteJid, senderJid, participants
        })
        if (stop) return
      } catch (err) {
        console.error(`⚠️ Before ${name}:`, err.message)
      }
    }

    if (!m.message) return

    // ON HOOKS
    for (const name in plugins) {
      const plugin = plugins[name]
      if (plugin?.on === "on" && plugin.run) {
        try {
          await plugin.run({
            conn, m, text, isOwner, isAdmin, isBotAdmin, isGroup, remoteJid, senderJid, participants
          })
        } catch (err) {
          console.error(`⚠️ Plugin ON ${name}:`, err.message)
        }
      }
    }

    const prefix = config.prefix || "."
    if (!text.startsWith(prefix)) return

    const textSinPrefix = text.slice(prefix.length).trim()
    const parts = textSinPrefix.split(/\s+/)
    const command = parts.shift().toLowerCase()
    const args = parts

    let matchedPlugin = null, matchedPluginName = null

    for (const name in plugins) {
      const plugin = plugins[name]
      if (!plugin?.command) continue

      let match = false
      try {
        if (Array.isArray(plugin.command)) {
          match = plugin.command.includes(command)
        } else if (plugin.command instanceof RegExp) {
          match = plugin.command.test(command)
        } else {
          match = plugin.command === command
        }
      } catch {}

      if (match) {
        matchedPlugin = plugin
        matchedPluginName = name
        break
      }
    }

    if (isGroup && global.db.data.chats[remoteJid]?.botEnabled === false) {
      if (!matchedPlugin?.ignoreDisabled && !isOwner) return
    }

    if (!matchedPlugin) return

    if (matchedPlugin.owner && !isOwner) {
      await conn.sendText(remoteJid, "❌ Solo para owner.")
      return
    }

    if (matchedPlugin.admin && !isAdmin && !isOwner) {
      await conn.sendText(remoteJid, "❌ Solo para admins.")
      return
    }

    try {
      await matchedPlugin.run({
        conn, m, text, args, remoteJid, senderJid, isGroup, isAdmin, isBotAdmin, isOwner,
        participants, groupAdmins: groupAdminsCache[remoteJid] || []
      })
    } catch (err) {
      console.error(`❌ ${matchedPluginName}:`, err.message)
      await conn.sendText(remoteJid, "⚠️ Error ejecutando comando.").catch(() => {})
    }

  } catch (err) {
    console.error(`❌ Error en handler:`, err.message)
    console.error(err.stack)
  }
}
