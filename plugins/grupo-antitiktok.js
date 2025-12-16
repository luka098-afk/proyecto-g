const REGEX = /tiktok\.com/i;

export default {
  command: ["antitiktok"],
  
  run: async ({ conn, m, remoteJid, isGroup, isAdmin, isOwner }) => {
    // Solo en grupos
    if (!isGroup) {
      return await conn.sendText(remoteJid, "⚠️ Este comando solo funciona en grupos.", m);
    }

    // Solo admins y owner
    if (!isAdmin && !isOwner) {
      return await conn.sendText(remoteJid, "⚠️ Solo los administradores pueden usar este comando.", m);
    }

    // Obtener configuración del grupo
    const chat = global.db?.data?.chats?.[remoteJid] || {};
    
    // Toggle antiTiktok
    chat.antiTiktok = !chat.antiTiktok;

    // Guardar en DB
    if (!global.db.data.chats[remoteJid]) {
      global.db.data.chats[remoteJid] = {};
    }
    global.db.data.chats[remoteJid].antiTiktok = chat.antiTiktok;

    await conn.sendText(
      remoteJid,
      `✅ *Anti-TikTok ${chat.antiTiktok ? 'activado' : 'desactivado'}*\n\n${
        chat.antiTiktok 
          ? '🚫 Los links de TikTok serán eliminados automáticamente.' 
          : '✅ Los links de TikTok están permitidos.'
      }`,
      m
    );
  },

  before: async (ctx) => {
    const { m, conn, remoteJid, isGroup, isAdmin, isBotAdmin, isOwner, participants } = ctx;

    // Solo en grupos
    if (!isGroup) return;

    // Admins y owner están exentos
    if (isAdmin || isOwner) return;

    // No procesar si no hay texto
    if (!m.text) return;

    // Obtener configuración del grupo
    const chat = global.db?.data?.chats?.[remoteJid] || {};

    // Si antiTiktok no está activo, salir
    if (!chat.antiTiktok) return;

    // Detectar link de TikTok
    if (!REGEX.test(m.text)) return;

    // Obtener admins del grupo
    const groupAdmins = participants.filter(p => p.admin);
    const adminMentions = groupAdmins.map(v => v.id);

    // Si delete está activo, solo eliminar sin aviso
    if (chat.delete) {
      if (isBotAdmin) {
        await m.delete();
      }
      return await conn.sendText(
        remoteJid,
        `⚠️ *Link de TikTok detectado*\n\nEl mensaje fue eliminado automáticamente.`,
        m,
        { mentions: [m.sender, ...adminMentions] }
      );
    }

    // Eliminar con aviso
    if (isBotAdmin) {
      await conn.sendText(
        remoteJid,
        `⚠️ *Link de TikTok detectado*\n\n@${m.sender.split("@")[0]} envió un link prohibido.\n\nEl mensaje será eliminado.`,
        null,
        { mentions: [m.sender, ...adminMentions] }
      );
      await m.delete();
    } else {
      await conn.sendText(
        remoteJid,
        `⚠️ *Link de TikTok detectado*\n\n@${m.sender.split("@")[0]} envió un link prohibido.\n\n_El bot necesita ser admin para eliminar mensajes._`,
        null,
        { mentions: [m.sender, ...adminMentions] }
      );
    }
  }
};
