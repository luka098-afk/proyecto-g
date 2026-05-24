export default {
  command: ["menu", "help", "ayuda"],

  run: async (ctx) => {
    const { conn, m, remoteJid } = ctx;

    // ══════════════════════════════════════════════════════
    // 📷 IMÁGENES ALEATORIAS
    // ══════════════════════════════════════════════════════
    const images = [
      "http://imgfz.com/i/eTb73IC.png",
      "http://imgfz.com/i/eTb73IC.png",
      ""
    ];
    const randomImage = images[Math.floor(Math.random() * images.length)];

    // ══════════════════════════════════════════════════════
    // 📋 CONFIGURACIÓN DEL CANAL
    // ══════════════════════════════════════════════════════
    const channelJid = "120363386229166956@newsletter"; // Tu canal
    const channelName = "PUTO EL QUE LEA 🫩"; // Nombre de tu canal

    // ══════════════════════════════════════════════════════
    // 📝 TEXTO DEL MENÚ
    // ══════════════════════════════════════════════════════
    const more = String.fromCharCode(8206);
    const readMore = more.repeat(4001);

    const menu = `
──────────────
🔱 *ADMINS* 🔱
──────────────
• .*ht* — \`notificacion silenciosa\`
• .*ht2* — \`notificacion silenciosa 5 veces\`
• .*warn* - \`advierte un usuario\`
• .*unwarn* - \`quita advertencia\`
• .*warns* - \`ver lista advertencias\`
• .*mute* - \`mutea un usuario\`
• .*del* - \`borra un mensaje\`
• .*d* - \`quitar admin\`
• .*p* - \`dar admin\`
• .*gpu* - \`obtener foto de alguien\`
• .*k* - \`expulsar usuario\`
• .*link* - \`obtener link del grupo\`
• .*ap* - \`aprueba solicitudes pendientes\`
• .*llamar* - \`llama a la persona\`
• .*ruletaban* - \`ruleta rusa ban\`
• .*tagall* - \`menciona a todos\`
• .*tagall2* - \`menciona a todos 5 veces\`

──────────────
👑 *OWNERS* 👑
──────────────
• .*lid* — \`obtiene los lids\`
• .*bc* — \`apaga o prende el bot\`
• .*anticall* \`bloquea llamadas al bot\`
• .*banuser* — \`banea un usuario\`
• .*unbanuser* — \`desbanea un usuario\`
• .*listban* — \`mira los usuarios baneados\`
• .*autoadmin* — \`volverte admin automáticamente\`
• .*setppgrupo* — \`cambiar foto del grupo\`

──────────────
⚙️ *CONFIG GRUPO* ⚙️
──────────────
• .*config* - \`ver la config del grupo\`
• .*anticanal* - \`borra canales de whatsapp\`
• .*antilink* - \`borra links de whatsapp\`
• .*antiestado* - \`borra estados etiquetados al grupo\`
• .*antieliminar* - \`reenvia lo eliminado\`
• .*antitiktok* - \`borra links de tiktok\`
• .*antiInstagram* - \`borra links de ig\`
• .*antitelegram* - \`borra links de telegram\`
• .*detect* — \`detecta cambios\`
• .*modoadmin* - \`bot activo solo para admins\`
• .*g* — \`cerrar grupo y abrir\`
• .*juegos* — \`activar/desactivar juegos\`

──────────────
🎮 *JUEGOS* 🎮
──────────────
• .*besar* - \`besar a alguien\`
• .*gay* - \`detector gay\`
• .*doxxear* - \`doxxear (fake)\`
• .*formarpareja* - \`formar pareja random\`
• .*formarpareja5* - \`top 5 parejas\`
• .*pajeame* - \`animación paja\`
• .*sortear* <texto> - \`sortear algo\`
• .*top* <texto> - \`top 10 de algo\`
• .*chiste* - \`chiste de humor negro\`
• .*suicidarse* - \`descubrelo por ti mismo\`
• .*trivia* - \`preguntas al azar\`
──────────────
📥 *DESCARGAS* 📥
──────────────
• .*play* <canción> — \`descarga audio de YouTube\`
• .*video* <video> — \`descarga video de YouTube\`
• .*tiktok* <url> — \`descarga video de TikTok\`
• .*instagram* <url> — \`descarga video de Instagram\`

──────────────
📲 *IA* 📲
──────────────
• .*imagen* - \`busca una imagen en google\`
• .*gemini* - \`habla con gemini\`
• .*quitarfondo* - \`quita fondo a una imagen\`
• .*magicstudio* - \`genera una imagen\`

──────────────
✨ *STICKERS* ✨
──────────────
• .*s* - \`haz sticker a una imagen o video\`
• .*wm* - \`cambiar autor de sticker\`
• .*img* - \`sticker a imagen grande\`
• .*qc* - \`texto a sticker\`
• .*ttp* - \`texto a sticker\`
• .*ttp2* - \`texto a sticker rgb\`
• .*hd* - \`sube la calidad de la foto\`

──────────────
⚒️ *HERRAMIENTAS* ⚒️
──────────────
• .*reportar* - \`reporta algo indebido a los admins\`
• .*clima* - \`revisa el clima hoy\`
• .*ss* - \`screenshot a pagina\`
• .*tourl* - \`convierte una imagen a jpg (expirable)\`
• .*trad* - \`traduce cualquier texto a español\`
`.trim();

    // ══════════════════════════════════════════════════════
    // 📤 ENVIAR MENÚ CON IMAGEN Y CANAL
    // ══════════════════════════════════════════════════════
    try {
      const msgSent = await conn.sendMessage(remoteJid, {
        image: { url: randomImage },
        caption: menu,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: channelJid,
            newsletterName: channelName,
            serverMessageId: 100
          }
        }
      }, { quoted: m });

      // ══════════════════════════════════════════════════════
      // ✅ REACCIONAR AL MENSAJE
      // ══════════════════════════════════════════════════════
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: "☣️", key: msgSent.key }
        });
      } catch (err) {
        console.log("⚠️ No se pudo reaccionar");
      }

    } catch (error) {
      console.error("❌ Error enviando menú:", error);
      // Fallback: enviar solo texto si falla
      await conn.sendText(remoteJid, menu, m);
    }
  }
};
 
