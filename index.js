import fs from 'fs'
import {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore
} from "@whiskeysockets/baileys"
import pino from 'pino'
import chalk from 'chalk'
import figlet from 'figlet'
import { makeWASocket, protoType, serialize } from "./lib/waSocket.js"
import { handler } from "./handler.js"
import config from "./config.js"
import { installYtDlp } from "./loadFunctions.js"
import { isBlacklisted } from './db.js'

// ══════════════════════════════════════════════════════
// 🚀 INICIALIZACIÓN
// ══════════════════════════════════════════════════════

// loadDB() y setInterval se ejecutan automáticamente en db.js

global.config = config
global.prefix = new RegExp(`^${(config.prefix || ".").replace(/[-/^$*+?.()|[\]{}]/g, '\\$&')}`, 'i')
global.db = global.db || { data: { chats: {}, users: {} } }
global.botstatus = true

protoType()
serialize()

const CONFIG = {
  logger: pino({ level: "silent" }),
  phoneNumber: config.number || config.owner[0],
  authDir: "./auth",
  browser: Browsers.ubuntu("Chrome"),
  retryDelay: 5000
}

console.log(chalk.cyan(figlet.textSync("PROYECTO G", { font: "Standard" })))
console.log(chalk.blueBright("══════════════════════════════════════════════════════"))
console.log(chalk.whiteBright("🔵 BOT INICIANDO — Modo Proyecto G"))
console.log(chalk.blueBright("══════════════════════════════════════════════════════\n"))

// ══════════════════════════════════════════════════════
// 📱 HANDLE MESSAGES
// ══════════════════════════════════════════════════════

async function handleMessages(conn, { messages, type }) {
  if (type !== "notify" || !messages[0]?.message) return

  const m = messages[0]
  const texto = m.message?.conversation || m.message?.extendedTextMessage?.text || "[media]"
  const isGroup = m.key.remoteJid.endsWith("@g.us")
  const timestamp = new Date(m.messageTimestamp * 1000).toLocaleTimeString()

  try {
    let groupName = isGroup ? (await conn.groupMetadata(m.key.remoteJid).catch(() => ({ subject: "Grupo" }))).subject : "DM"

    console.log(chalk[isGroup ? 'cyan' : 'magenta'](`
╔════════════════════════════════════════╗
║ ${isGroup ? '📱 MENSAJE EN GRUPO' : '💌 MENSAJE PRIVADO'}
╠════════════════════════════════════════╣
║ ⏰ ${timestamp}
${isGroup ? `║ 👥 Grupo: ${chalk.bold(groupName)}` : ''}
║ 👤 ${isGroup ? 'Usuario' : 'De'}: ${chalk.yellow(m.pushName || "Unknown")}
║ 💬 Mensaje: ${chalk.green(texto.substring(0, 50))}${texto.length > 50 ? '...' : ''}
╚════════════════════════════════════════╝`))

    await handler(conn, { messages: [m] })
  } catch (err) {
    console.log(chalk.red(`❌ [ERROR] ${err.message}`))
  }
}

// ══════════════════════════════════════════════════════
// 🚫 BLACKLIST AUTO-KICK
// ══════════════════════════════════════════════════════

function setupBlacklistListener(conn) {
  conn.ev.on("group-participants.update", async ({ id, participants, action }) => {
    if (action !== "add") return

    try {
      const groupMeta = await conn.groupMetadata(id).catch(() => null)
      if (!groupMeta) return

      const botJid = conn.user.jid || conn.user.id
      const isBotAdmin = groupMeta.participants.find(p =>
        p.id === botJid || p.id.split('@')[0] === botJid.split('@')[0]
      )?.admin

      if (!isBotAdmin) return

      for (const p of participants) {
        const userJid = typeof p === 'string' ? p : (p.id || p.jid || String(p))
        let realNumber = userJid.split('@')[0]
        let realJid = userJid
        let blacklistEntry = null

        // Buscar en blacklist
        blacklistEntry = isBlacklisted(userJid)

        if (!blacklistEntry) {
          const participant = groupMeta.participants.find(p => p.id === userJid)
          if (participant?.phoneNumber) {
            realNumber = participant.phoneNumber.split('@')[0]
            realJid = realNumber + "@s.whatsapp.net"
            blacklistEntry = isBlacklisted(realJid)
          }
        }

        if (!blacklistEntry) {
          blacklistEntry = isBlacklisted(realNumber + "@lid")
          if (blacklistEntry) realJid = realNumber + "@lid"
        }

        if (!blacklistEntry) {
          for (const [jid, entry] of Object.entries(global.db.blacklist || {})) {
            if (jid.split('@')[0] === realNumber || entry.phoneNumber === realNumber) {
              blacklistEntry = entry
              realJid = jid
              break
            }
          }
        }

        if (!blacklistEntry) continue

        console.log(chalk.red(`🚫 Usuario en blacklist: ${realNumber}`))
        await new Promise(r => setTimeout(r, 1500))

        // Intentar expulsar
        const jidsToTry = [realJid, userJid, realNumber + "@s.whatsapp.net"]
        let expelled = false

        for (const jid of jidsToTry) {
          if (expelled) break
          try {
            await conn.groupParticipantsUpdate(id, [jid], "remove")
            expelled = true
          } catch {}
        }

        if (expelled) {
          console.log(chalk.green(`✅ Usuario expulsado`))

          const mensaje = `🚫 *Usuario en Lista Negra Rechazado*\n\n` +
                         `👤 Usuario: @${realNumber}\n` +
                         `📝 Razón: ${blacklistEntry.reason}\n\n` +
                         `⚠️ Este usuario no puede unirse al grupo.`

          await conn.sendMessage(id, {
            text: mensaje,
            mentions: [userJid, realJid]
          }).catch(() => {})
        }

        await new Promise(r => setTimeout(r, 1000))
      }
    } catch (err) {
      console.log(chalk.red(`❌ [BLACKLIST] ${err.message}`))
    }
  })
}

// ══════════════════════════════════════════════════════
// 📞 ANTI-LLAMADAS
// ══════════════════════════════════════════════════════

function setupAntiCallListener(conn) {
  conn.ev.on("call", async (calls) => {
    for (const call of calls) {
      if (!global.db.data?.settings?.anticall?.enabled) continue

      try {
        const callerId = call.from
        const callerNumber = callerId.replace("@s.whatsapp.net", "")
        console.log(`🚨 ${call.isVideo ? '📹 Videollamada' : '📞 Llamada'} de: ${callerNumber}`)

        await new Promise(r => setTimeout(r, 2000))
        await conn.updateBlockStatus(callerId, "block")
        console.log(`🔒 Bloqueado: ${callerNumber}`)
      } catch (err) {
        console.error(`❌ Error en anti-llamadas: ${err.message}`)
      }
    }
  })
}

// ══════════════════════════════════════════════════════
// 🔐 PAIRING CODE
// ══════════════════════════════════════════════════════

async function requestPairingCode(conn) {
  await new Promise(r => setTimeout(r, 3000))
  if (conn.authState.creds.registered) return console.log(chalk.green("✔ Dispositivo ya registrado"))

  try {
    const phoneNumber = CONFIG.phoneNumber.replace(/[^0-9]/g, '')
    const code = await conn.requestPairingCode(phoneNumber)
    console.log(chalk.blueBright(`
╔════════════════════════════════════════╗
║ 🔐 CÓDIGO: ${chalk.bold.green(code)}
║ 📱 Ingresa en WhatsApp:
║    Dispositivos vinculados > Vincular
╚════════════════════════════════════════╝`))
  } catch (err) {
    console.log(chalk.red(`❌ Error: ${err.message}`))
  }
}

// ══════════════════════════════════════════════════════
// 🔗 CONNECTION HANDLER
// ══════════════════════════════════════════════════════

function setupConnectionHandler(conn) {
  conn.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log(chalk.green(`✔ BOT CONECTADO - ${CONFIG.phoneNumber}`))
      installYtDlp().catch(() => {})
    }

    if (connection === "connecting") console.log(chalk.blue("⏳ Conectando..."))

    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log(chalk.yellow(`🔌 Conexión cerrada. Razón: ${lastDisconnect?.error?.output?.statusCode}`))

      if (shouldReconnect) {
        console.log(chalk.yellow("🔄 Reconectando en 5s..."))
        await new Promise(r => setTimeout(r, CONFIG.retryDelay))
        startBot()
      } else {
        console.log(chalk.red("❌ SESIÓN CERRADA\nPara reconectar: rm -rf auth && npm start"))
        process.exit(0)
      }
    }
  })
}

// ══════════════════════════════════════════════════════
// 🚀 START BOT
// ══════════════════════════════════════════════════════

async function startBot() {
  try {
    if (!fs.existsSync(CONFIG.authDir)) {
      fs.mkdirSync(CONFIG.authDir, { recursive: true })
      console.log(chalk.blue("📁 Carpeta 'auth' creada"))
    }

    const { state, saveCreds } = await useMultiFileAuthState(CONFIG.authDir)
    const { version } = await fetchLatestBaileysVersion()

    console.log(chalk.blue(`📦 Baileys v${version.join('.')}`))

    const conn = makeWASocket({
      version,
      logger: CONFIG.logger,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, CONFIG.logger)
      },
      browser: CONFIG.browser,
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      getMessage: async () => ({ conversation: '' }),
      syncFullHistory: false,
      defaultQueryTimeoutMs: undefined
    })

    global.conn = conn

    conn.ev.on("messages.upsert", (data) => handleMessages(conn, data))
    conn.ev.on("creds.update", saveCreds)
    setupConnectionHandler(conn)
    setupBlacklistListener(conn)
    setupAntiCallListener(conn)

    if (!state.creds.registered) await requestPairingCode(conn)

  } catch (err) {
    console.log(chalk.red(`❌ ERROR INICIANDO BOT: ${err.message}`))
    console.log(chalk.yellow("🔄 Reintentando en 5s..."))
    await new Promise(r => setTimeout(r, CONFIG.retryDelay))
    startBot()
  }
}

console.log(chalk.blue("🤖 Iniciando PROYECTO G...\n"))
startBot()
