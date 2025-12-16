import { removeFromBlacklist, isBlacklisted } from "../db.js";
import config from "../config.js";

export default {
  command: ["unln", "ln2"],
  owner: true,

  run: async ({ conn, m, remoteJid, text, isGroup }) => {
    try {
      let who;

      // ══════════════════════════════════════════════════════
      // LIMPIAR TEXTO
      // ══════════════════════════════════════════════════════
      
      let cleanText = text;
      if (cleanText.startsWith('.unln ') || cleanText.startsWith('.ln2 ')) {
        cleanText = cleanText.replace(/^\.(unln|ln2)\s+/, '').trim();
      }

      // ══════════════════════════════════════════════════════
      // DETECTAR USUARIO
      // ══════════════════════════════════════════════════════
      
      // Método 1: Número con +
      const phoneMatches = cleanText.match(/\+\d[\d\s]*/g);
      
      if (phoneMatches && phoneMatches.length > 0) {
        const cleanNumber = phoneMatches[0].replace(/\+|\s+/g, "");
        
        console.log(`📞 Número detectado: ${cleanNumber}`);
        
        // Intentar obtener el JID real
        try {
          if (isGroup) {
            console.log(`🔍 Buscando ${cleanNumber} en metadata del grupo...`);
            const groupMetadata = await conn.groupMetadata(remoteJid);
            const participant = groupMetadata.participants.find(p => {
              const pNumber = p.id.split('@')[0];
              return pNumber === cleanNumber;
            });
            
            if (participant) {
              who = participant.id;
              console.log(`✅ JID encontrado: ${who}`);
            }
          }
          
          // Si no se encontró, buscar en blacklist
          if (!who) {
            console.log(`🔍 Buscando en blacklist...`);
            
            const lidJid = cleanNumber + "@lid";
            const wasJid = cleanNumber + "@s.whatsapp.net";
            
            if (isBlacklisted(lidJid)) {
              who = lidJid;
              console.log(`✅ Encontrado en blacklist como @lid`);
            } else if (isBlacklisted(wasJid)) {
              who = wasJid;
              console.log(`✅ Encontrado en blacklist como @s.whatsapp.net`);
            } else {
              // Buscar por número base
              const allBlacklist = global.db.blacklist || {};
              for (const [jid, entry] of Object.entries(allBlacklist)) {
                if (jid.split('@')[0] === cleanNumber) {
                  who = jid;
                  console.log(`✅ Encontrado en blacklist: ${who}`);
                  break;
                }
              }
            }
            
            // Si aún no encuentra, usar por defecto
            if (!who) {
              who = wasJid;
              console.log(`📝 Usando formato por defecto: ${who}`);
            }
          }
        } catch (err) {
          console.error(`❌ Error obteniendo JID:`, err.message);
          who = cleanNumber + "@s.whatsapp.net";
        }
      } 
      // Método 2: Mención
      else {
        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        who = mentions[0] || null;

        // Método 3: Mensaje citado
        if (!who && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
          who = m.message.extendedTextMessage.contextInfo.participant;
        }
      }

      // ══════════════════════════════════════════════════════
      // VALIDACIONES
      // ══════════════════════════════════════════════════════
      
      if (!who) {
        return await conn.sendText(
          remoteJid,
          `⚠️ *Debes mencionar, citar o usar número.*\n\n*Ejemplos:*\n• .unln @usuario\n• .unln +598123456\n• Responder mensaje con .unln`,
          m
        );
      }

      // ══════════════════════════════════════════════════════
      // VERIFICAR SI ESTÁ EN BLACKLIST
      // ══════════════════════════════════════════════════════
      
      const whoNumber = who.split('@')[0];
      let exists = null;
      let correctJid = who;
      
      // Buscar en blacklist por número base O por phoneNumber guardado
      const allBlacklist = global.db.blacklist || {};
      
      for (const [jid, entry] of Object.entries(allBlacklist)) {
        const blacklistNumber = jid.split('@')[0];
        const savedPhoneNumber = entry.phoneNumber;
        
        // Comparar con el JID o con el número real guardado
        if (blacklistNumber === whoNumber || savedPhoneNumber === whoNumber) {
          exists = entry;
          correctJid = jid;
          console.log(`✅ Encontrado en blacklist: ${correctJid} (tel: ${savedPhoneNumber})`);
          break;
        }
      }

      if (!exists) {
        return await conn.sendText(
          remoteJid,
          "ℹ️ *Ese usuario no está en la lista negra.*",
          m
        );
      }

      // ══════════════════════════════════════════════════════
      // QUITAR DE LISTA NEGRA
      // ══════════════════════════════════════════════════════
      
      removeFromBlacklist(correctJid); // Usar el JID correcto
      
      console.log(`✅ Usuario ${whoNumber} removido de blacklist (JID: ${correctJid})`);

      await conn.sendMessage(remoteJid, {
        react: { text: '☑️', key: m.key }
      });
      
      // Usar el número real guardado para la mención
      const displayNumber = exists.phoneNumber || whoNumber;
      
      await conn.sendText(
        remoteJid,
        `✅ *Usuario removido de lista negra*\n\n👤 Usuario: +${displayNumber}`,
        m
      );

    } catch (error) {
      console.error('❌ Error en unln:', error.message);
      console.error(error.stack);
      await conn.sendText(
        remoteJid,
        '⚠️ *Error al quitar usuario de lista negra.*',
        m
      );
    }
  }
};
