import { addToBlacklist, isBlacklisted } from "../db.js";
import config from "../config.js";

export default {
  command: ["ln"],
  owner: true,

  run: async ({ conn, m, remoteJid, text, isGroup }) => {
    try {
      let who, reason;

      // ══════════════════════════════════════════════════════
      // LIMPIAR TEXTO: Remover comando si viene incluido
      // ══════════════════════════════════════════════════════
      
      let cleanText = text;
      if (cleanText.startsWith('.ln ')) {
        cleanText = cleanText.replace(/^\.ln\s+/, '').trim();
      }

      // ══════════════════════════════════════════════════════
      // DETECTAR USUARIO Y RAZÓN
      // ══════════════════════════════════════════════════════
      
      // Método 1: Detectar número con + (ej: +598123456)
      const phoneMatches = cleanText.match(/\+\d[\d\s]*/g);
      
      if (phoneMatches && phoneMatches.length > 0) {
        // Usuario especificado por número
        const cleanNumber = phoneMatches[0].replace(/\+|\s+/g, "");
        reason = cleanText.replace(phoneMatches[0], "").trim();
        
        console.log(`📞 Número detectado: ${cleanNumber}`);
        
        // Intentar obtener el JID real del número
        try {
          // Método 1: Buscar en metadatos del grupo si estamos en uno
          if (isGroup) {
            console.log(`🔍 Buscando ${cleanNumber} en metadata del grupo...`);
            const groupMetadata = await conn.groupMetadata(remoteJid);
            const participant = groupMetadata.participants.find(p => {
              const pNumber = p.id.split('@')[0];
              return pNumber === cleanNumber;
            });
            
            if (participant) {
              who = participant.id; // Usar el JID real (puede ser @lid o @s.whatsapp.net)
              console.log(`✅ JID encontrado en grupo: ${who}`);
            }
          }
          
          // Método 2: Si no se encontró, usar ambos formatos posibles
          if (!who) {
            console.log(`⚠️ No encontrado en grupo, probando formatos...`);
            
            // Intentar primero con @lid (más común en nuevos usuarios)
            const lidJid = cleanNumber + "@lid";
            const wasJid = cleanNumber + "@s.whatsapp.net";
            
            // Verificar si existe en blacklist con alguno de estos formatos
            if (isBlacklisted(lidJid)) {
              who = lidJid;
              console.log(`✅ Usuario ya existe en blacklist como @lid: ${who}`);
            } else if (isBlacklisted(wasJid)) {
              who = wasJid;
              console.log(`✅ Usuario ya existe en blacklist como @s.whatsapp.net: ${who}`);
            } else {
              // Por defecto usar @s.whatsapp.net
              who = wasJid;
              console.log(`📝 Usando formato por defecto: ${who}`);
            }
          }
        } catch (err) {
          console.error(`❌ Error obteniendo JID real:`, err.message);
          // Fallback: usar @s.whatsapp.net
          who = cleanNumber + "@s.whatsapp.net";
          console.log(`⚠️ Fallback a @s.whatsapp.net: ${who}`);
        }
      } 
      // Método 2: Detectar mención (@usuario)
      else {
        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        who = mentions[0] || null;

        // Método 3: Mensaje citado/respondido
        if (!who && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
          who = m.message.extendedTextMessage.contextInfo.participant;
        }

        // Limpiar la razón: remover mención si existe
        reason = cleanText;
        
        if (who) {
          const whoNumber = who.split('@')[0];
          reason = cleanText.replace(`@${whoNumber}`, "").trim();
        }
      }

      // ══════════════════════════════════════════════════════
      // VALIDACIONES
      // ══════════════════════════════════════════════════════
      
      if (!who) {
        return await conn.sendText(
          remoteJid,
          `⚠️ *Debes mencionar, citar o usar número.*\n\n*Ejemplos:*\n• .ln @usuario razón\n• .ln +598123456 razón\n• Responder mensaje con .ln razón`,
          m
        );
      }

      // Validar razón
      if (!reason || reason.length === 0) {
        reason = "Sin razón especificada";
      }

      const whoNumber = who.split('@')[0];

      // Protección 1: No afectar al bot
      const botNumber = conn.user.jid.split('@')[0];
      if (whoNumber === botNumber) {
        console.log(`⚠️ Intento de agregar al bot a blacklist bloqueado`);
        return await conn.sendMessage(remoteJid, {
          react: { text: '❌', key: m.key }
        });
      }

      // Protección 2: No afectar al que ejecuta el comando
      const senderJid = m.key.participant || m.key.remoteJid;
      const senderNumber = senderJid.split('@')[0];
      if (whoNumber === senderNumber) {
        console.log(`⚠️ Intento de auto-agregarse a blacklist bloqueado`);
        return await conn.sendMessage(remoteJid, {
          react: { text: '❌', key: m.key }
        });
      }

      // Protección 3: No afectar a owners
      const ownerNumbers = (config.owner || []).map(o => String(o));
      if (ownerNumbers.includes(whoNumber)) {
        console.log(`⚠️ Intento de agregar owner a blacklist bloqueado`);
        return await conn.sendMessage(remoteJid, {
          react: { text: '❌', key: m.key }
        });
      }

      // ══════════════════════════════════════════════════════
      // AGREGAR A LISTA NEGRA
      // ══════════════════════════════════════════════════════

      const exists = isBlacklisted(who);

      // Obtener número real desde metadata
      let realPhoneNumber = whoNumber;
      if (isGroup) {
        try {
          const groupMetadata = await conn.groupMetadata(remoteJid);
          const participant = groupMetadata.participants.find(p => 
            p.id === who || p.id.split('@')[0] === whoNumber
          );
          if (participant?.phoneNumber) {
            realPhoneNumber = participant.phoneNumber.split('@')[0];
          }
        } catch (err) {
          console.log(`⚠️ No se pudo obtener número real`);
        }
      }

      // Si ya existe, actualizar razón
      if (exists) {
        addToBlacklist(who, reason, realPhoneNumber);
        console.log(`🔄 Usuario ${whoNumber} ya estaba en blacklist, razón actualizada`);
        await conn.sendText(
          remoteJid,
          `⚠️ *Usuario ya estaba en lista negra*\n\n✅ Razón actualizada a: ${reason}`,
          m
        );
      } 
      // Si no existe, agregar nuevo
      else {
        addToBlacklist(who, reason, realPhoneNumber);
        console.log(`🚫 Usuario ${whoNumber} agregado a blacklist - Razón: ${reason} - Tel: ${realPhoneNumber}`);
        
        await conn.sendMessage(remoteJid, {
          react: { text: '✅', key: m.key }
        });

        await conn.sendText(
          remoteJid,
          `🚫 *Usuario agregado a lista negra*\n\n👤 Usuario: @${whoNumber}\n📝 Razón: ${reason}`,
          m,
          { mentions: [who] }
        );
      }

      // ══════════════════════════════════════════════════════
      // EXPULSAR SI ESTÁ EN EL GRUPO
      // ══════════════════════════════════════════════════════

      if (isGroup) {
        try {
          await conn.groupParticipantsUpdate(remoteJid, [who], "remove");
          console.log(`✅ Usuario ${whoNumber} expulsado del grupo`);
        } catch (err) {
          console.log(`⚠️ No se pudo expulsar a ${whoNumber}: ${err.message}`);
        }
      }

    } catch (error) {
      console.error('❌ Error en ln:', error.message);
      console.error(error.stack);
      await conn.sendText(
        remoteJid,
        '⚠️ *Error al agregar usuario a lista negra.*',
        m
      );
    }
  }
};
