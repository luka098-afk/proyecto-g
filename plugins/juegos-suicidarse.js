const delay = (time) => new Promise((res) => setTimeout(res, time));

export default {
  command: ["suicidarse"],
  
  run: async ({ conn, m, remoteJid, isGroup, isOwner, senderJid }) => {
    try {
      // Solo en grupos
      if (!isGroup) {
        return await conn.sendText(remoteJid, "❌ Este comando solo funciona en grupos.", m);
      }

      // El owner no puede suicidarse
      if (isOwner) {
        return await conn.sendText(
          remoteJid,
          "🛡️ El owner no puede usar este comando. ¡Eres inmune! 😎",
          m
        );
      }

      // Obtener metadata del grupo
      const groupMetadata = await conn.groupMetadata(remoteJid);
      const participants = groupMetadata.participants;
      
      // Encontrar el JID real del usuario en el grupo (puede ser @lid o @s.whatsapp.net)
      const senderNumber = senderJid.split('@')[0];
      const realSenderJid = participants.find(p => p.id.split('@')[0] === senderNumber)?.id || senderJid;
      
      // Obtener el número base del bot
      const botNumber = conn.user.id.split(':')[0];
      
      // Buscar al bot en los participantes (puede tener @s.whatsapp.net o @lid)
      const botParticipant = participants.find(p => {
        const participantNumber = p.id.split('@')[0];
        return participantNumber === botNumber || p.id.includes(botNumber);
      });
      
      // Si no encontramos al bot por número, buscar por rol de admin
      if (!botParticipant) {
        const adminBot = participants.find(p => 
          (p.admin === 'admin' || p.admin === 'superadmin') && 
          p.id !== realSenderJid
        );
        
        if (adminBot) {
          // Bot encontrado por rol de admin, continuar con la expulsión
          const userNumber = realSenderJid.split('@')[0];

          await conn.sendMessage(remoteJid, {
            text: `*@${userNumber} ACABA DE EJECUTAR SU SUICIDIO 😐*\n\n_Adiós..._`,
            mentions: [realSenderJid]
          }, { quoted: m });

          await delay(1500);

          await conn.groupParticipantsUpdate(remoteJid, [realSenderJid], "remove");
          return;
        }
      }
      
      // Verificar si el bot es admin
      const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

      if (!isBotAdmin) {
        return await conn.sendText(
          remoteJid,
          "❌ Necesito ser administrador para poder expulsar usuarios.",
          m
        );
      }

      // Extraer el número limpio del JID para la mención usando el JID real
      const userNumber = realSenderJid.split('@')[0];

      // Mensaje de despedida con mención correcta
      await conn.sendMessage(remoteJid, {
        text: `*@${userNumber} ACABA DE EJECUTAR SU SUICIDIO 😐*\n\n_Adiós..._`,
        mentions: [realSenderJid]
      }, { quoted: m });

      // Esperar 1.5 segundos
      await delay(1500);

      // Expulsar al usuario usando el JID real
      await conn.groupParticipantsUpdate(remoteJid, [realSenderJid], "remove");

    } catch (err) {
      console.error(`❌ Error en suicidarse.js: ${err.message}`);

      await conn.sendText(
        remoteJid,
        `⚠️ Error al ejecutar el comando: ${err.message}`,
        m
      );
    }
  }
};
