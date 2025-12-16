import { getBlacklist } from "../db.js";

export default {
  command: ["vln"],
  owner: true,

  run: async ({ conn, m, remoteJid }) => {
    try {
      const entries = getBlacklist();

      if (entries.length === 0) {
        return await conn.sendText(remoteJid, "📋 *No hay usuarios en lista negra.*", m);
      }

      // Construir mensaje
      let msg = `🚫 *LISTA NEGRA* (${entries.length} usuario${entries.length > 1 ? 's' : ''})\n\n`;
      
      entries.forEach((entry, i) => {
        const num = entry.jid.split("@")[0];
        const fecha = new Date(entry.addedAt).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        msg += `${i + 1}. @${num}\n`;
        msg += `   📝 Razón: ${entry.reason}\n`;
        msg += `   📅 Desde: ${fecha}\n\n`;
      });

      // Obtener JIDs para menciones
      const jids = entries.map((e) => e.jid);

      // Enviar mensaje con menciones
      return await conn.sendMessage(remoteJid, { 
        text: msg, 
        mentions: jids 
      }, { quoted: m });

    } catch (error) {
      console.error('❌ Error en vln:', error.message);
      await conn.sendText(
        remoteJid,
        '⚠️ *Error al mostrar lista negra.*',
        m
      );
    }
  }
};
