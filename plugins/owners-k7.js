import config from "../config.js";

export default {
  command: ["k7"],
  owner: true,
  group: true,
  botAdmin: true,

  run: async ({ conn, m, remoteJid, participants, isOwner }) => {
    try {
      const BLOCKED_CHAT = '';

      if (remoteJid === BLOCKED_CHAT) {
        await conn.sendMessage(remoteJid, { react: { text: '⛔', key: m.key } });
        return;
      }

      if (!isOwner) {
        await conn.sendMessage(remoteJid, { react: { text: '⛔', key: m.key } });
        return;
      }

      const botJid = conn.user.jid || conn.user.id;
      const botNumber = botJid.split('@')[0];

      const groupMetadata = await conn.groupMetadata(remoteJid);
      const groupAdmins = groupMetadata.participants.filter(p =>
        p.admin === 'admin' || p.admin === 'superadmin'
      );

      const groupOwner = groupAdmins.find(p => p.admin === 'superadmin')?.id;

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
        await conn.sendMessage(remoteJid, { react: { text: '🔥', key: m.key } });
        return;
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

      await conn.sendMessage(remoteJid, { react: { text: '⏳', key: m.key } });

      let removed = 0;
      let failed = 0;

      try {
        await conn.groupParticipantsUpdate(remoteJid, targets, 'remove');
        removed = targets.length;
        console.log(`✅ [K7] ${targets.length} usuarios eliminados de una vez`);
      } catch (error) {
        console.error(`❌ [K7] Error en eliminación masiva:`, error.message);
        console.log(`⚠️ [K7] Intentando eliminar individualmente...`);

        for (const jid of targets) {
          try {
            await conn.groupParticipantsUpdate(remoteJid, [jid], 'remove');
            removed++;
            console.log(`  ✅ Eliminado: ${jid.split('@')[0]}`);
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            failed++;
            console.log(`  ❌ Falló: ${jid.split('@')[0]} - ${err.message}`);
          }
        }
      }

      console.log(`\n╔════════════════════════════════════════╗`);
      console.log(`║ ✅ K7 - OPERACIÓN COMPLETADA`);
      console.log(`╠════════════════════════════════════════╣`);
      console.log(`║ ✅ Eliminados: ${removed}`);
      console.log(`║ ❌ Fallidos: ${failed}`);
      console.log(`║ 📊 Total: ${targets.length}`);
      console.log(`╚════════════════════════════════════════╝\n`);

      if (failed === 0) {
        await conn.sendMessage(remoteJid, { react: { text: '✅', key: m.key } });
      } else if (removed > 0) {
        await conn.sendMessage(remoteJid, { react: { text: '⚠️', key: m.key } });
      } else {
        await conn.sendMessage(remoteJid, { react: { text: '❌', key: m.key } });
      }

    } catch (error) {
      console.error(`❌ [K7] Error crítico:`, error.message);
      console.error(error.stack);
      try {
        await conn.sendMessage(remoteJid, { react: { text: '⚠️', key: m.key } });
      } catch {}
    }
  }
};
