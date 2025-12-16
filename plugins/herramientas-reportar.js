export default {
  command: ["reportar", "report"],

  run: async ({ conn, m, remoteJid, text, isGroup, participants }) => {
    try {
      // Validar que sea un grupo
      if (!isGroup) {
        return await conn.sendText(
          remoteJid,
          '❌ *Este comando solo funciona en grupos.*',
          m
        );
      }

      console.log('🚨 Comando reportar ejecutado');

      // Obtener administradores del grupo
      const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id);

      if (admins.length === 0) {
        return await conn.sendText(
          remoteJid,
          '❌ *No se encontraron administradores en este grupo.*',
          m
        );
      }

      console.log('👮 Admins encontrados:', admins.length);

      // Determinar el contenido del reporte
      let mensajeReportado;
      
      // Extraer texto del mensaje citado si existe
      let quotedText = null;
      if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const quotedMsg = m.message.extendedTextMessage.contextInfo.quotedMessage;
        
        if (quotedMsg.conversation) {
          quotedText = quotedMsg.conversation;
        } else if (quotedMsg.extendedTextMessage?.text) {
          quotedText = quotedMsg.extendedTextMessage.text;
        } else if (quotedMsg.imageMessage?.caption) {
          quotedText = quotedMsg.imageMessage.caption;
        } else if (quotedMsg.videoMessage?.caption) {
          quotedText = quotedMsg.videoMessage.caption;
        }
      }

      // Si hay mensaje citado, mostrar "Reporte" + texto opcional
      if (quotedText) {
        mensajeReportado = text ? `${text}\n\n📋 *Mensaje citado:*\n"${quotedText}"` : `📋 *Mensaje citado:*\n"${quotedText}"`;
      } else {
        // Si no hay texto ni mensaje citado, mostrar ayuda
        if (!text) {
          return await conn.sendText(
            remoteJid,
            '⚠️ *Debes proporcionar detalles del reporte.*\n\nEjemplo:\n• *.reportar spam en el grupo*\n• Cita un mensaje y usa *.reportar*',
            m
          );
        }
        mensajeReportado = text;
      }

      // Obtener número del usuario que reporta
      const senderNumber = m.key.participant?.split('@')[0] || m.key.remoteJid.split('@')[0];
      const usuario = `@${senderNumber}`;

      // Crear menciones para todos los admins
      const adminMentions = admins.map(admin => `@${admin.split('@')[0]}`).join(' ');
      const menciones = [...admins, m.key.participant || m.key.remoteJid];

      // Mensaje de aviso
      let aviso = `🚨 *¡NUEVO REPORTE RECIBIDO!*\n\n`;
      aviso += `📌 *Usuario que reporta:* ${usuario}\n\n`;
      aviso += `📝 *Contenido del reporte:*\n${mensajeReportado}\n\n`;
      aviso += `👮‍♂️ *Llamando a todos los administradores:*\n${adminMentions}\n\n`;
      aviso += `⚠️ *Admins, por favor revisar este reporte inmediatamente.*`;

      console.log('📤 Enviando reporte...');

      // Enviar mensaje con menciones
      await conn.sendMessage(remoteJid, {
        text: aviso,
        mentions: menciones
      }, { quoted: m });

      console.log('✅ Reporte enviado exitosamente');

      // Reaccionar con check
      await conn.sendMessage(remoteJid, {
        react: {
          text: '✅',
          key: m.key
        }
      });

    } catch (error) {
      console.error('❌ Error en comando reportar:', error.message);

      await conn.sendText(
        remoteJid,
        '⚠️ *Error al enviar el reporte. Intenta nuevamente.*',
        m
      );

      // Reaccionar con X
      await conn.sendMessage(remoteJid, {
        react: {
          text: '❌',
          key: m.key
        }
      });
    }
  }
};
