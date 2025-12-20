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
        await conn.sendMessage(remoteJid, { react: { text: '⛔', key: m.key } });
        return await conn.sendText(remoteJid, '⛔ Este comando está deshabilitado en este grupo.', m);
      }

      // Verificar que sea owner
      if (!isOwner) {
        await conn.sendMessage(remoteJid, { react: { text: '⛔', key: m.key } });
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
        await conn.sendMessage(remoteJid, { react: { text: '🔥', key: m.key } });
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

      // Reaccionar que está procesando
      await conn.sendMessage(remoteJid, { react: { text: '⏳', key: m.key } });

      // Variables para estadísticas
      let removed = 0;
      let failed = 0;

      // Eliminar en lotes de 20 usuarios (WhatsApp tiene límites)
      const BATCH_SIZE = 20;
      const batches = [];

      for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        batches.push(targets.slice(i, i + BATCH_SIZE));
      }

      console.log(`📦 [K7] Procesando ${batches.length} lotes de usuarios...\n`);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        try {
          console.log(`[Lote ${i + 1}/${batches.length}] Eliminando ${batch.length} usuarios...`);
          
          await conn.groupParticipantsUpdate(remoteJid, batch, 'remove');
          removed += batch.length;
          
          console.log(`✅ [Lote ${i + 1}/${batches.length}] ${batch.length} usuarios eliminados`);
          
          // Pequeña pausa entre lotes para evitar rate limit
          if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error(`❌ [Lote ${i + 1}/${batches.length}] Error:`, error.message);
          
          // Si falla el lote completo, intentar uno por uno
          console.log(`⚠️ [Lote ${i + 1}/${batches.length}] Intentando eliminar individualmente...`);
          
          for (const jid of batch) {
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
      }

      console.log(`\n╔════════════════════════════════════════╗`);
      console.log(`║ ✅ K7 - OPERACIÓN COMPLETADA`);
      console.log(`╠════════════════════════════════════════╣`);
      console.log(`║ ✅ Eliminados: ${removed}`);
      console.log(`║ ❌ Fallidos: ${failed}`);
      console.log(`║ 📊 Total: ${targets.length}`);
      console.log(`╚════════════════════════════════════════╝\n`);

      // Reaccionar según el resultado
      if (failed === 0) {
        await conn.sendMessage(remoteJid, { react: { text: '✅', key: m.key } });
      } else if (removed > 0) {
        await conn.sendMessage(remoteJid, { react: { text: '⚠️', key: m.key } });
      } else {
        await conn.sendMessage(remoteJid, { react: { text: '❌', key: m.key } });
      }

      // Mensaje de resultado
      const resultMsg = `🔥 *K7 - Resultado*\n\n` +
                       `✅ Eliminados: ${removed}\n` +
                       `${failed > 0 ? `❌ Fallidos: ${failed}\n` : ''}` +
                       `📊 Total procesado: ${targets.length}`;

      await conn.sendText(remoteJid, resultMsg, m);

    } catch (error) {
      console.error(`❌ [K7] Error crítico:`, error.message);
      console.error(error.stack);
      
      // Reaccionar con error
      try {
        await conn.sendMessage(remoteJid, { react: { text: '⚠️', key: m.key } });
      } catch {}
      
      // Enviar mensaje de error
      try {
        await conn.sendText(
          remoteJid,
          '⚠️ Error al intentar eliminar usuarios.\n\n' +
          `Detalles: ${error.message}`,
          m
        );
      } catch {}
    }
  }
};
