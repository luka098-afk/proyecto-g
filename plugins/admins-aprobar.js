export default {
  command: ["ap", "aprobar", "pendientes"],

  run: async ({ conn, m, remoteJid, isGroup, isAdmin }) => {
    try {
      // Validar que sea un grupo
      if (!isGroup) {
        return await conn.sendText(
          remoteJid,
          '❌ *Este comando solo funciona en grupos.*',
          m
        );
      }

      // Validar que el usuario sea admin
      if (!isAdmin) {
        return await conn.sendText(
          remoteJid,
          '❌ *Este comando es solo para administradores.*',
          m
        );
      }

      console.log('🔧 Comando de aprobación ejecutado');

      // Obtener comando usado
      const body = m.message?.conversation || 
                   m.message?.extendedTextMessage?.text || 
                   m.message?.imageMessage?.caption || '';
      
      const commandUsed = body.toLowerCase().trim().replace(/^\./, '').split(' ')[0];

      // Reaccionar con emoji de carga
      await conn.sendMessage(remoteJid, {
        react: {
          text: '⏳',
          key: m.key
        }
      });

      // Obtener lista de participantes pendientes
      const participants = await conn.groupRequestParticipantsList(remoteJid);

      if (!participants || participants.length === 0) {
        await conn.sendMessage(remoteJid, {
          react: {
            text: '',
            key: m.key
          }
        });
        return await conn.sendText(
          remoteJid,
          'ℹ️ *No hay participantes pendientes de aprobación.*',
          m
        );
      }

      console.log('📋 Participantes pendientes:', participants.length);

      // COMANDO: pendientes (solo listar)
      if (commandUsed === "pendientes") {
        let message = `📋 *Lista de Participantes Pendientes*\n\n`;
        message += `Total: ${participants.length}\n\n`;
        
        participants.forEach((participant, index) => {
          const phoneNumber = participant.jid.split("@")[0];
          message += `${index + 1}. @${phoneNumber}\n`;
          message += `   • Método: ${participant.request_method}\n\n`;
        });

        message += `\n💡 Usa *.aprobar* para aprobar a todos.`;

        // Crear array de menciones
        const mentions = participants.map(p => p.jid);

        await conn.sendMessage(remoteJid, {
          text: message,
          mentions: mentions
        }, { quoted: m });

        await conn.sendMessage(remoteJid, {
          react: {
            text: '✅',
            key: m.key
          }
        });
      }
      // COMANDO: ap o aprobar (aprobar todos)
      else if (commandUsed === "ap" || commandUsed === "aprobar") {
        console.log('✅ Aprobando participantes...');

        // Aprobar todos los participantes
        for (const participant of participants) {
          try {
            await conn.groupRequestParticipantsUpdate(
              remoteJid,
              [participant.jid],
              "approve"
            );
            console.log('✅ Aprobado:', participant.jid);
          } catch (err) {
            console.error('❌ Error aprobando:', participant.jid, err.message);
          }
        }

        await conn.sendText(
          remoteJid,
          `✅ *${participants.length} participante(s) aprobado(s) exitosamente.*`,
          m
        );

        await conn.sendMessage(remoteJid, {
          react: {
            text: '✅',
            key: m.key
          }
        });

        console.log('✅ Todos los participantes aprobados');
      }

    } catch (error) {
      console.error('❌ Error en comando aprobar:', error.message);

      await conn.sendText(
        remoteJid,
        '⚠️ *Hubo un error al procesar el comando de aprobación.*',
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
