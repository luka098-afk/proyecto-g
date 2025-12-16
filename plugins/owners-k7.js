import config from "../config.js";

export default {
  command: ["k7"],
  owner: true,
  group: true,
  botAdmin: true,

  run: async ({ conn, m, remoteJid, participants, isOwner }) => {
    try {
      // ID del grupo donde K7 NUNCA debe funcionar
      const BLOCKED_CHAT = '120363404278828828@g.us';

      // Si el comando se ejecuta en el grupo bloqueado, salir
      if (remoteJid === BLOCKED_CHAT) {
        return await conn.sendText(remoteJid, '⛔ Este comando está deshabilitado en este grupo.', m);
      }

      // Verificar que sea owner
      if (!isOwner) {
        return await conn.sendText(remoteJid, '⛔ Este comando solo puede usarlo el *dueño del bot*.', m);
      }

      const botJid = conn.user.jid || conn.user.id;
      const botNumber = botJid.split('@')[0];

      // Obtener metadata del grupo
      const groupMetadata = await conn.groupMetadata(remoteJid);
      const groupAdmins = groupMetadata.participants.filter(p => 
        p.admin === 'admin' || p.admin === 'superadmin'
      );

      // Obtener owner del grupo
      const groupOwner = groupAdmins.find(p => p.admin === 'superadmin')?.id;

      // Obtener todos los IDs excepto el bot y los admins
      const targets = groupMetadata.participants
        .filter(p => {
          const pNumber = p.id.split('@')[0];
          const isBot = p.id === botJid || pNumber === botNumber;
          const isGroupOwner = p.id === groupOwner;
          const isAdmin = p.admin === 'admin' || p.admin === 'superadmin';
          
          return !isBot && !isGroupOwner && !isAdmin;
        })
        .map(p => p.id);

      if (targets.length === 0) {
        console.log(`[K7] No hay usuarios para eliminar en: ${remoteJid}`);
        return await conn.sendText(remoteJid, '🔥 No hay usuarios para eliminar.', m);
      }

      console.log(`\n╔════════════════════════════════════════╗`);
      console.log(`║ 💣 K7 - ELIMINACIÓN MASIVA`);
      console.log(`╠════════════════════════════════════════╣`);
      console.log(`║ 👥 Grupo: ${groupMetadata.subject}`);
      console.log(`║ 🎯 Objetivo: ${targets.length} miembros`);
      console.log(`╠════════════════════════════════════════╣`);
      console.log(`║ 📋 USUARIOS A ELIMINAR:`);
      
      targets.forEach((jid, index) => {
        const number = jid.split('@')[0];
        console.log(`║    ${index + 1}. +${number}`);
      });
      
      console.log(`╚════════════════════════════════════════╝\n`);

      // Eliminar a todos de una sola vez
      await conn.groupParticipantsUpdate(remoteJid, targets, 'remove');

      console.log(`✅ [K7] Operación completada: ${targets.length} usuarios eliminados\n`);

    } catch (error) {
      console.error(`❌ [K7] Error:`, error.message);
      await conn.sendText(
        remoteJid,
        '⚠️ Error al intentar eliminar usuarios.',
        m
      );
    }
  }
};
