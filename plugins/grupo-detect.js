import { WAMessageStubType } from '@whiskeysockets/baileys';

export default {
  command: "detect",
  admin: true,
  
  run: async ({ conn, m, remoteJid, isGroup }) => {
    try {
      if (!isGroup) {
        return await conn.sendText(remoteJid, "❌ Este comando solo funciona en grupos.", m);
      }

      // Inicializar BD
      if (!global.db) global.db = { data: { chats: {} } }
      if (!global.db.data) global.db.data = { chats: {} }
      if (!global.db.data.chats) global.db.data.chats = {}
      if (!global.db.data.chats[remoteJid]) {
        global.db.data.chats[remoteJid] = {}
      }

      // Toggle detect
      const wasEnabled = global.db.data.chats[remoteJid].detect || false
      global.db.data.chats[remoteJid].detect = !wasEnabled

      // Guardar BD
      if (global.db.write) {
        await global.db.write()
      }

      const newState = global.db.data.chats[remoteJid].detect

      if (newState) {
        return await conn.sendText(
          remoteJid, 
          "🛰️ Detect: *ACTIVADO* ✅\n\n_Ahora recibirás notificaciones de cambios en el grupo._", 
          m
        );
      } else {
        return await conn.sendText(
          remoteJid, 
          "🛰️ Detect: *DESACTIVADO*\n\n_No recibirás notificaciones de cambios._", 
          m
        );
      }

    } catch (err) {
      await conn.sendText(remoteJid, "⚠️ Error al cambiar detect.", m).catch(() => {});
    }
  },

  before: async ({ conn, m, remoteJid, isGroup }) => {
    try {
      // Solo procesar en grupos y con messageStubType
      if (!isGroup || !m.messageStubType) return false;

      // Verificar si detect está activado
      const detectEnabled = global.db?.data?.chats?.[remoteJid]?.detect;
      if (!detectEnabled) return false;

      // Obtener sender
      const rawSender = m.key?.participant || m.key?.remoteJid;
      if (!rawSender) return false;

      const senderNumber = rawSender.split('@')[0];
      const usuario = `@${senderNumber}`;

      let mensaje = '';
      let mentions = [rawSender];

      // Obtener el parámetro y convertirlo a JID limpio
      let paramRaw = m.messageStubParameters?.[0];
      let paramJid = null;
      
      if (paramRaw) {
        // Si es string JSON, parsearlo
        if (typeof paramRaw === 'string' && paramRaw.startsWith('{')) {
          try {
            paramRaw = JSON.parse(paramRaw);
          } catch (e) {
            // Ignorar error de parseo
          }
        }
        
        // Extraer id o phoneNumber
        if (typeof paramRaw === 'object') {
          if (paramRaw.phoneNumber) {
            paramJid = String(paramRaw.phoneNumber);
          } else if (paramRaw.id) {
            paramJid = String(paramRaw.id);
          }
        } else {
          paramJid = String(paramRaw);
        }
        
        // Asegurar que tenga @
        if (paramJid && !paramJid.includes('@')) {
          paramJid = paramJid + '@s.whatsapp.net';
        }
      }
      
      // Extraer número limpio para mostrar
      const paramNumero = paramJid ? paramJid.split('@')[0] : null;

      switch (m.messageStubType) {
        case 21: // Cambio de nombre
          mensaje = `✨️ *${usuario} \`ha cambiado el nombre del grupo\`*\n\n📝 \`Nuevo nombre\`:*${paramRaw || 'Nombre no disponible'}*`;
          break;

        case 22: // Cambio de foto
          mensaje = `✨️ *Se ha cambiado la imagen del grupo*\n\n👤 Acción hecha por: ${usuario}`;
          break;

        case 23: // Nuevo enlace
          mensaje = `*[🔗 ENLACE RESTABLECIDO 🔗]*\n*[❗]* \`Acción hecha por:\` ${usuario}`;
          break;

        case 24: // Cambio de descripción
          const descripcion = typeof paramRaw === 'object' ? (paramRaw.id || 'Descripción no disponible') : (paramRaw || 'Descripción no disponible');
          mensaje = `✨️ *${usuario} ha cambiado la descripción del grupo*\n\n📄 Nueva descripción: *${descripcion}*`;
          break;

        case 25: // Configuración del grupo
          const quien = paramRaw === 'on' ? 'solo admins' : 'todos';
          mensaje = `✨️ *${usuario} ha actualizado la configuración*\n\n⚙️ Ahora *${quien}* pueden configurar el grupo`;
          break;

        case 26: // Grupo abierto/cerrado
          const estado = paramRaw === 'on' ? 'cerrado 🔒' : 'abierto 🔓';
          const quienes = paramRaw === 'on' ? 'solo admins' : 'todos';
          mensaje = `✨️ *El grupo ha sido ${estado}*\n\n👤 Por: ${usuario}\n📢 Ahora *${quienes}* pueden enviar mensajes`;
          break;

        case 27: // Usuario agregado
          if (paramNumero) {
            mensaje = `✨️ *${usuario} ha agregado a @${paramNumero}*\n\n👋 ¡Bienvenido al grupo!`;
            mentions.push(paramJid);
          }
          break;

        case 28: // Usuario eliminado
          if (paramNumero) {
            mensaje = `@${paramNumero} fue eliminado por ${usuario}`;
            mentions.push(paramJid);
          }
          break;

        case 29: // Promovido a admin
          if (paramNumero) {
            mensaje = `*[✅]* \`AHORA ES ADMIN:\` @${paramNumero}\n*[❗]* \`Acción hecha por:\` ${usuario}`;
            mentions.push(paramJid);
          }
          break;

        case 30: // Degradado de admin
          if (paramNumero) {
            mensaje = `*[❌]* \`YA NO ES ADMIN:\` @${paramNumero}\n*[❗]* \`Acción hecha por:\` ${usuario}`;
            mentions.push(paramJid);
          }
          break;

        case 32: // Usuario salió del grupo
          mensaje = `✨️ *${usuario} ha salido del grupo*\n\n👋 Adiós!`;
          break;

        default:
          return false;
      }

      // Enviar mensaje
      if (mensaje) {
        await conn.sendText(remoteJid, mensaje, null, { mentions });
      }

      return false;

    } catch (error) {
      return false;
    }
  }
};
