import fs from 'fs'
import path from 'path'

const DB_PATH = './lib/db.json'
const BLACKLIST_PATH = './lib/blacklist.json'

// ══════════════════════════════════════════════════════
// 📌 ESTRUCTURA BASE
// ══════════════════════════════════════════════════════

const DEFAULT_STRUCTURE = {
  users: {},
  chats: {},
  settings: {}
}

const DEFAULT_BLACKLIST = {}

// ══════════════════════════════════════════════════════
// 📂 ASEGURAR CARPETA lib/
// ══════════════════════════════════════════════════════

function ensureLibFolder() {
  const libDir = path.dirname(DB_PATH)
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true })
    console.log(`📁 Carpeta ${libDir} creada`)
  }
}

// ══════════════════════════════════════════════════════
// 📂 CARGAR / GUARDAR BD PRINCIPAL
// ══════════════════════════════════════════════════════

export function loadDB() {
  try {
    ensureLibFolder()

    if (fs.existsSync(DB_PATH)) {
      global.db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))

      // Asegurar que existen las estructuras mínimas
      global.db.users ||= {}
      global.db.chats ||= {}
      global.db.settings ||= {}

      // Compatibilidad con código anterior
      if (!global.db.data) {
        global.db.data = {
          users: global.db.users,
          chats: global.db.chats,
          settings: global.db.settings
        }
      }

      console.log(`✅ BD cargada desde ${DB_PATH}`)
    } else {
      global.db = JSON.parse(JSON.stringify(DEFAULT_STRUCTURE))
      global.db.data = {
        users: global.db.users,
        chats: global.db.chats,
        settings: global.db.settings
      }
      saveDB()
      console.log(`🆕 Nueva BD creada en ${DB_PATH}`)
    }
  } catch (e) {
    console.error("❌ Error cargando BD:", e.message)
    global.db = JSON.parse(JSON.stringify(DEFAULT_STRUCTURE))
    global.db.data = {
      users: global.db.users,
      chats: global.db.chats,
      settings: global.db.settings
    }
  }

  // Cargar blacklist por separado
  loadBlacklist()
}

export function saveDB() {
  try {
    ensureLibFolder()

    // Sincronizar data con la estructura principal
    if (global.db.data) {
      global.db.users = global.db.data.users || {}
      global.db.chats = global.db.data.chats || {}
      global.db.settings = global.db.data.settings || {}
    }

    const dataToSave = {
      users: global.db.users || {},
      chats: global.db.chats || {},
      settings: global.db.settings || {}
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8')
    return true
  } catch (e) {
    console.error("❌ Error guardando BD:", e.message)
    return false
  }
}

// ══════════════════════════════════════════════════════
// 📂 CARGAR / GUARDAR BLACKLIST (SEPARADA)
// ══════════════════════════════════════════════════════

export function loadBlacklist() {
  try {
    ensureLibFolder()

    if (fs.existsSync(BLACKLIST_PATH)) {
      global.db.blacklist = JSON.parse(fs.readFileSync(BLACKLIST_PATH, 'utf-8'))
      console.log(`✅ Blacklist cargada desde ${BLACKLIST_PATH}`)
    } else {
      global.db.blacklist = JSON.parse(JSON.stringify(DEFAULT_BLACKLIST))
      saveBlacklist()
      console.log(`🆕 Nueva blacklist creada en ${BLACKLIST_PATH}`)
    }
  } catch (e) {
    console.error("❌ Error cargando blacklist:", e.message)
    global.db.blacklist = JSON.parse(JSON.stringify(DEFAULT_BLACKLIST))
  }
}

export function saveBlacklist() {
  try {
    ensureLibFolder()
    fs.writeFileSync(
      BLACKLIST_PATH, 
      JSON.stringify(global.db.blacklist || {}, null, 2), 
      'utf-8'
    )
    return true
  } catch (e) {
    console.error("❌ Error guardando blacklist:", e.message)
    return false
  }
}

// ══════════════════════════════════════════════════════
// 🚫 BLACKLIST
// ══════════════════════════════════════════════════════

/**
 * Agregar usuario a blacklist
 * @param {string} jid - JID del usuario
 * @param {string} reason - Razón del baneo
 * @param {string} phoneNumber - Número real (opcional)
 */
export function addToBlacklist(jid, reason = "Sin razón especificada", phoneNumber = null) {
  global.db.blacklist ??= {}

  global.db.blacklist[jid] = {
    jid,
    reason,
    phoneNumber: phoneNumber || jid.split('@')[0],
    addedAt: Date.now(),
    addedDate: new Date().toLocaleString()
  }

  saveBlacklist()
  return true
}

/**
 * Remover usuario de blacklist
 * @param {string} jid - JID del usuario
 */
export function removeFromBlacklist(jid) {
  if (global.db.blacklist?.[jid]) {
    delete global.db.blacklist[jid]
    saveBlacklist()
    return true
  }
  return false
}

/**
 * Verificar si usuario está en blacklist
 * @param {string} jid - JID del usuario
 * @returns {object|null} - Datos del usuario o null
 */
export function isBlacklisted(jid) {
  return global.db.blacklist?.[jid] || null
}

/**
 * Obtener toda la blacklist
 * @returns {array} - Array de usuarios
 */
export function getBlacklist() {
  return Object.values(global.db.blacklist || {})
}

/**
 * Limpiar toda la blacklist
 */
export function clearBlacklist() {
  global.db.blacklist = {}
  saveBlacklist()
  return true
}

/**
 * Contar usuarios en blacklist
 * @returns {number}
 */
export function countBlacklist() {
  return Object.keys(global.db.blacklist || {}).length
}

// ══════════════════════════════════════════════════════
// 👤 USERS
// ══════════════════════════════════════════════════════

/**
 * Obtener usuario (crea si no existe)
 * @param {string} jid - JID del usuario
 */
export function getUser(jid) {
  global.db.users ||= {}
  global.db.data ||= {}
  global.db.data.users ||= {}

  if (!global.db.users[jid]) {
    global.db.users[jid] = {
      jid,
      messageCount: 0,
      commands: {},
      banned: false,
      muted: false,
      warn: 0,
      lastSeen: Date.now(),
      lastSeenDate: new Date().toLocaleString(),
      createdAt: Date.now(),
      createdDate: new Date().toLocaleString()
    }
    global.db.data.users[jid] = global.db.users[jid]
    saveDB()
  }

  return global.db.users[jid]
}

/**
 * Actualizar datos de usuario
 * @param {string} jid - JID del usuario
 * @param {object} data - Datos a actualizar
 */
export function updateUser(jid, data) {
  global.db.users ||= {}
  global.db.data ||= {}
  global.db.data.users ||= {}

  if (!global.db.users[jid]) getUser(jid)

  global.db.users[jid] = {
    ...global.db.users[jid],
    ...data,
    lastSeen: Date.now(),
    lastSeenDate: new Date().toLocaleString()
  }

  global.db.data.users[jid] = global.db.users[jid]
  saveDB()
  return true
}

/**
 * Incrementar contador de mensajes
 * @param {string} jid - JID del usuario
 */
export function incrementMessageCount(jid) {
  const user = getUser(jid)
  user.messageCount = (user.messageCount || 0) + 1
  updateUser(jid, user)
  return user.messageCount
}

/**
 * Registrar uso de comando
 * @param {string} jid - JID del usuario
 * @param {string} command - Nombre del comando
 */
export function incrementCommand(jid, command) {
  const user = getUser(jid)
  user.commands ||= {}
  user.commands[command] = (user.commands[command] || 0) + 1
  updateUser(jid, user)
  return user.commands[command]
}

/**
 * Obtener comandos usados por usuario
 * @param {string} jid - JID del usuario
 * @returns {object}
 */
export function getUserCommands(jid) {
  const user = getUser(jid)
  return user.commands || {}
}

/**
 * Obtener todos los usuarios
 * @returns {array}
 */
export function getAllUsers() {
  return Object.values(global.db.users || {})
}

/**
 * Contar usuarios totales
 * @returns {number}
 */
export function getTotalUsers() {
  return Object.keys(global.db.users || {}).length
}

/**
 * Eliminar usuario
 * @param {string} jid - JID del usuario
 */
export function deleteUser(jid) {
  if (global.db.users?.[jid]) {
    delete global.db.users[jid]
    if (global.db.data?.users?.[jid]) {
      delete global.db.data.users[jid]
    }
    saveDB()
    return true
  }
  return false
}

/**
 * Banear/desbanear usuario
 * @param {string} jid - JID del usuario
 * @param {boolean} banned - true para banear
 */
export function setBanned(jid, banned = true) {
  const user = getUser(jid)
  user.banned = banned
  updateUser(jid, user)
  return true
}

/**
 * Verificar si usuario está baneado
 * @param {string} jid - JID del usuario
 * @returns {boolean}
 */
export function isBanned(jid) {
  const user = global.db.users?.[jid]
  return user?.banned || false
}

/**
 * Mutear/desmutear usuario
 * @param {string} jid - JID del usuario
 * @param {boolean} muted - true para mutear
 */
export function setMuted(jid, muted = true) {
  const user = getUser(jid)
  user.muted = muted
  updateUser(jid, user)
  return true
}

/**
 * Verificar si usuario está muteado
 * @param {string} jid - JID del usuario
 * @returns {boolean}
 */
export function isMuted(jid) {
  const user = global.db.users?.[jid]
  return user?.muted || false
}

// ══════════════════════════════════════════════════════
// 💬 GROUPS/CHATS
// ══════════════════════════════════════════════════════

/**
 * Obtener configuración de grupo (crea si no existe)
 * @param {string} jid - JID del grupo
 */
export function getChat(jid) {
  global.db.chats ||= {}
  global.db.data ||= {}
  global.db.data.chats ||= {}

  if (!global.db.chats[jid]) {
    global.db.chats[jid] = {
      jid,
      antilink: true,
      anticanal: true,
      antiestado: true,
      antieliminar: false,
      antiInstagram: false,
      antiTiktok: false,
      antiTelegram: false,
      anticall: false,
      detect: false,
      adminMode: false,
      botEnabled: true,
      muted: false,
      createdAt: Date.now(),
      createdDate: new Date().toLocaleString()
    }
    global.db.data.chats[jid] = global.db.chats[jid]
    saveDB()
  }

  return global.db.chats[jid]
}

/**
 * Actualizar configuración de grupo
 * @param {string} jid - JID del grupo
 * @param {object} data - Datos a actualizar
 */
export function updateChat(jid, data) {
  global.db.chats ||= {}
  global.db.data ||= {}
  global.db.data.chats ||= {}

  if (!global.db.chats[jid]) getChat(jid)

  global.db.chats[jid] = {
    ...global.db.chats[jid],
    ...data
  }

  global.db.data.chats[jid] = global.db.chats[jid]
  saveDB()
  return true
}

/**
 * Obtener todos los chats
 * @returns {array}
 */
export function getAllChats() {
  return Object.values(global.db.chats || {})
}

/**
 * Eliminar chat
 * @param {string} jid - JID del chat
 */
export function deleteChat(jid) {
  if (global.db.chats?.[jid]) {
    delete global.db.chats[jid]
    if (global.db.data?.chats?.[jid]) {
      delete global.db.data.chats[jid]
    }
    saveDB()
    return true
  }
  return false
}

/**
 * Activar/desactivar función en grupo
 * @param {string} jid - JID del grupo
 * @param {string} feature - Nombre de la función
 * @param {boolean} enabled - Estado
 */
export function setChatFeature(jid, feature, enabled = true) {
  const chat = getChat(jid)
  chat[feature] = enabled
  updateChat(jid, chat)
  return true
}

/**
 * Verificar si función está activa
 * @param {string} jid - JID del grupo
 * @param {string} feature - Nombre de la función
 * @returns {boolean}
 */
export function isChatFeatureEnabled(jid, feature) {
  const chat = global.db.chats?.[jid]
  return chat?.[feature] || false
}

// ══════════════════════════════════════════════════════
// ⚙️ SETTINGS
// ══════════════════════════════════════════════════════

/**
 * Obtener configuración global
 * @param {string} key - Clave de configuración
 * @param {any} defaultValue - Valor por defecto
 */
export function getSetting(key, defaultValue = null) {
  global.db.settings ||= {}
  global.db.data ||= {}
  global.db.data.settings ||= {}

  if (global.db.settings[key] === undefined) {
    global.db.settings[key] = defaultValue
    global.db.data.settings[key] = defaultValue
    saveDB()
  }

  return global.db.settings[key]
}

/**
 * Establecer configuración global
 * @param {string} key - Clave de configuración
 * @param {any} value - Valor
 */
export function setSetting(key, value) {
  global.db.settings ||= {}
  global.db.data ||= {}
  global.db.data.settings ||= {}

  global.db.settings[key] = value
  global.db.data.settings[key] = value
  saveDB()
  return true
}

/**
 * Obtener todas las configuraciones
 * @returns {object}
 */
export function getAllSettings() {
  return global.db.settings || {}
}

// ══════════════════════════════════════════════════════
// 📊 ESTADÍSTICAS RÁPIDAS
// ══════════════════════════════════════════════════════

/**
 * Obtener estadísticas generales
 */
export function getStats() {
  const users = getAllUsers()
  return {
    totalUsers: getTotalUsers(),
    totalBlacklist: countBlacklist(),
    bannedUsers: users.filter(u => u.banned).length,
    mutedUsers: users.filter(u => u.muted).length,
    totalChats: Object.keys(global.db.chats || {}).length,
    totalMessages: users.reduce((sum, u) => sum + (u.messageCount || 0), 0)
  }
}

/**
 * Obtener top comandos usados
 * @param {number} limit - Cantidad de comandos a retornar
 * @returns {array}
 */
export function getTopCommands(limit = 10) {
  const allCommands = {}

  Object.values(global.db.users || {}).forEach(user => {
    if (user.commands) {
      Object.entries(user.commands).forEach(([cmd, count]) => {
        allCommands[cmd] = (allCommands[cmd] || 0) + count
      })
    }
  })

  return Object.entries(allCommands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([command, count]) => ({ command, count }))
}

/**
 * Obtener usuarios más activos
 * @param {number} limit - Cantidad de usuarios a retornar
 * @returns {array}
 */
export function getTopUsers(limit = 10) {
  return Object.values(global.db.users || {})
    .sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0))
    .slice(0, limit)
    .map(user => ({
      jid: user.jid,
      messageCount: user.messageCount || 0,
      commandCount: Object.values(user.commands || {}).reduce((sum, n) => sum + n, 0)
    }))
}

// ══════════════════════════════════════════════════════
// 🚀 INICIALIZAR
// ══════════════════════════════════════════════════════

// Cargar BD al importar
loadDB()

// Compatibilidad con código anterior
if (!global.db.write) global.db.write = saveDB

// Auto-guardar cada 30 segundos (BD principal)
setInterval(() => {
  if (global.db) saveDB()
}, 30000)

// Auto-guardar blacklist cada 1 minuto
setInterval(() => {
  if (global.db?.blacklist) saveBlacklist()
}, 60000)

export default global.db
