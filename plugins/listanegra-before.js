import { isBlacklisted } from "../db.js";

export default {
  before: async ({ conn, m, remoteJid, isGroup, isAdmin, isOwner }) => {
    try {
      // Solo en grupos
      if (!isGroup) return;
      
      // No procesar eventos de grupo (stub messages)
      if (m.messageStubType) return;
      
      // No afectar a admins y owners
      if (isAdmin || isOwner) return;

      // Obtener JID del sender
      const senderJid = m.key?.participant || m.key?.remoteJid;
      if (!senderJid) return;

      // ══════════════════════════════════════════════════════
      // 🔍 OBTENER NÚMERO REAL DEL USUARIO
      // ══════════════════════════════════════════════════════

      let realNumber = null;
      let realJid = senderJid;

      try {
        // Obtener metadata del grupo
        const groupMetadata = await conn.groupMetadata(remoteJid).catch(() => null);
        
        if (groupMetadata) {
          const numRaw = senderJid.split("@")[0];
          
          // Buscar participante en metadata
          const participant = groupMetadata.participants.find(
            p => p.id === senderJid || p.id.includes(numRaw)
          );

          if (participant?.phoneNumber) {
            // Baileys 7: phoneNumber viene como "598...@s.whatsapp.net"
            realNumber = participant.phoneNumber.split("@")[0];
          } else if (participant?.id) {
            realNumber = participant.id.split("@")[0];
          } else {
            realNumber = numRaw;
          }

          // Construir JID real
          realJid = realNumber + "@s.whatsapp.net";
        }
      } catch (err) {
        console.error(`⚠️ Error obteniendo número real:`, err.message);
        realNumber = senderJid.split("@")[0];
      }

      // ══════════════════════════════════════════════════════
      // 🚫 VERIFICAR BLACKLIST (PROBAR AMBOS FORMATOS)
      // ══════════════════════════════════════════════════════

      let blacklistEntry = null;

      // Intentar con JID original
      blacklistEntry = isBlacklisted(senderJid);

      // Si no encuentra, intentar con número real
      if (!blacklistEntry && realJid !== senderJid) {
        blacklistEntry = isBlacklisted(realJid);
      }

      // Si tampoco, intentar con @lid
      if (!blacklistEntry && realNumber) {
        const lidJid = realNumber + "@lid";
        blacklistEntry = isBlacklisted(lidJid);
      }

      // No está en blacklist
      if (!blacklistEntry) return;

      console.log(`🚫 Usuario en blacklist detectado: ${realNumber || senderJid.split('@')[0]}`);

      // ══════════════════════════════════════════════════════
      // ⚡ VERIFICAR SI EL BOT ES ADMIN
      // ══════════════════════════════════════════════════════

      const groupMetadata = await conn.groupMetadata(remoteJid).catch(() => null);
      if (!groupMetadata) return;

      const botJid = conn.user.jid || conn.user.id;
      const botParticipant = groupMetadata.participants.find(p =>
        p.id === botJid || p.id.split('@')[0] === botJid.split('@')[0]
      );

      if (!botParticipant?.admin) return; // Bot no es admin

      // ══════════════════════════════════════════════════════
      // 🗑️ ELIMINAR MENSAJE
      // ══════════════════════════════════════════════════════

      try {
        await conn.sendMessage(remoteJid, { delete: m.key });
      } catch (err) {
        // Silencioso - no es crítico
      }

      // ══════════════════════════════════════════════════════
      // 👢 EXPULSAR USUARIO
      // ══════════════════════════════════════════════════════

      try {
        // Intentar expulsar con el JID real
        await conn.groupParticipantsUpdate(remoteJid, [realJid], "remove");
        console.log(`✅ Usuario expulsado del grupo`);
      } catch (err) {
        // Si falla, intentar con el JID original
        try {
          await conn.groupParticipantsUpdate(remoteJid, [senderJid], "remove");
          console.log(`✅ Usuario expulsado del grupo (JID alternativo)`);
        } catch (err2) {
          console.log(`⚠️ No se pudo expulsar: ${err2.message}`);
          return;
        }
      }

      // ══════════════════════════════════════════════════════
      // 📢 MENSAJE INFORMATIVO
      // ══════════════════════════════════════════════════════

      const numero = realNumber || senderJid.split('@')[0];
      const mensaje = `🚫 *Usuario en Lista Negra Expulsado*\n\n` +
                     `👤 Usuario: @${numero}\n` +
                     `📝 Razón: ${blacklistEntry.reason}\n\n` +
                     `⚠️ Este usuario no puede estar en el grupo.`;

      await conn.sendMessage(remoteJid, {
        text: mensaje,
        mentions: [realJid, senderJid] // Mencionar ambos por si acaso
      }).catch(() => {});

      // Detener procesamiento de este mensaje
      return true;

    } catch (error) {
      console.error('❌ Error en blacklist-auto:', error.message);
      return false;
    }
  }
};
