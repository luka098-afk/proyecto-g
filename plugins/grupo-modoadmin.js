/**
 * Plugin: MODO ADMIN
 * Permite a los admins restringir el bot solo para administradores
 * 
 * Uso:
 * .modoadmin → Alterna entre modo normal/admin (toggle)
 * .modoadmin status → Ver estado del modo admin
 * .modoadmin on → Activar modo admin
 * .modoadmin off → Desactivar modo admin
 *
 * Cuando está activo: solo los admins y el owner pueden usar comandos
 * Los usuarios normales reciben una reacción ❌
 */

export default {
  command: ["modoadmin", "adminmode"],
  admin: true, // Solo admins pueden cambiar este modo
  
  run: async (ctx) => {
    const { conn, m, args, remoteJid, isGroup } = ctx;

    console.log(`🎮 Ejecutando: modoadmin`);

    if (!isGroup) {
      return await conn.sendText(remoteJid, "❌ Este comando solo funciona en grupos.", m);
    }

    // Inicializar configuración si no existe
    if (!global.db.data.chats[remoteJid]) {
      global.db.data.chats[remoteJid] = { adminMode: false };
    }

    const action = (args[0] || "toggle").toLowerCase().trim();

    switch (action) {
      case "status":
      case "estado":
        const estado = global.db.data.chats[remoteJid].adminMode 
          ? "🔒 Activado - Solo admins" 
          : "🔓 Desactivado - Todos pueden usar";
        console.log(`📊 Estado modo admin: ${estado}`);
        return await conn.sendText(
          remoteJid, 
          `*Estado del Modo Admin:*\n\n${estado}`, 
          m
        );

      case "on":
      case "activar":
      case "1":
        global.db.data.chats[remoteJid].adminMode = true;
        console.log(`🔒 Modo Admin ON en ${remoteJid}`);
        return await conn.sendText(
          remoteJid,
          "🔒 *Modo Admin ACTIVADO*\n\nSolo los administradores pueden usar comandos.\n\nLos usuarios normales recibirán una reacción ❌",
          m
        );

      case "off":
      case "desactivar":
      case "0":
        global.db.data.chats[remoteJid].adminMode = false;
        console.log(`🔓 Modo Admin OFF en ${remoteJid}`);
        return await conn.sendText(
          remoteJid,
          "🔓 *Modo Admin DESACTIVADO*\n\nTodos los usuarios pueden usar comandos nuevamente.",
          m
        );

      case "toggle":
      default:
        // Toggle: alternar el estado
        global.db.data.chats[remoteJid].adminMode = !global.db.data.chats[remoteJid].adminMode;

        if (global.db.data.chats[remoteJid].adminMode) {
          console.log(`🔒 Modo Admin ON en ${remoteJid}`);
          return await conn.sendText(
            remoteJid,
            "🔒 *Modo Admin ACTIVADO*\n\nSolo los administradores pueden usar comandos.\n\nLos usuarios normales recibirán una reacción ❌",
            m
          );
        } else {
          console.log(`🔓 Modo Admin OFF en ${remoteJid}`);
          return await conn.sendText(
            remoteJid,
            "🔓 *Modo Admin DESACTIVADO*\n\nTodos los usuarios pueden usar comandos nuevamente.",
            m
          );
        }
    }
  },

  // BEFORE HOOK: Ejecuta antes de procesar cualquier comando
  // Reacciona con ❌ cuando el modo admin está activo y un usuario normal intenta usar comandos
  before: async (ctx) => {
    const { conn, m, remoteJid, isGroup, isAdmin, isOwner } = ctx;

    // Solo verificar en grupos
    if (!isGroup) return false;

    // Si es admin u owner, dejar pasar
    if (isAdmin || isOwner) return false;

    // Verificar si el modo admin está activo
    if (global.db.data.chats[remoteJid]?.adminMode === true) {
      // Extraer el texto del mensaje
      const text = m.message?.conversation ||
                   m.message?.extendedTextMessage?.text ||
                   m.message?.imageMessage?.caption ||
                   m.message?.videoMessage?.caption || "";

      // Si el mensaje empieza con el prefijo (es un intento de comando)
      const prefix = global.config?.prefix || ".";
      if (text.startsWith(prefix)) {
        console.log(`🚫 Modo Admin activo - Bloqueando comando de usuario no-admin: ${m.sender}`);

        // Reaccionar con ❌
        try {
          await conn.sendMessage(remoteJid, {
            react: {
              text: "❌",
              key: m.key
            }
          });
        } catch (err) {
          console.error("Error reaccionando:", err.message);
        }

        // Detener el procesamiento del comando
        return true;
      }
    }

    // No detener el procesamiento
    return false;
  }
};
