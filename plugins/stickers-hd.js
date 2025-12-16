import fetch from 'node-fetch';
import FormData from 'form-data';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
  command: ["mejorar", "hd", "upscale"],

  run: async ({ conn, m, remoteJid }) => {
    try {
      console.log('🔧 Comando HD ejecutado');

      // Obtener mensaje con imagen
      let mediaBuffer = null;
      let mediaType = null;

      // Si citó un mensaje
      if (m.quoted) {
        console.log('📋 Detectado mensaje citado');
        const quotedMsg = m.quoted.message || m.quoted;

        if (quotedMsg.imageMessage) {
          console.log('✅ Imagen citada');
          mediaBuffer = await m.quoted.download();
          mediaType = "image";
        }
      }
      // Si NO citó, buscar en el mensaje actual
      else {
        console.log('🔍 Buscando imagen en mensaje actual');
        const msg = m.message;

        if (msg.imageMessage) {
          const stream = await downloadContentFromMessage(msg.imageMessage, 'image');
          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }
          mediaBuffer = buffer;
          mediaType = "image";
        } else if (msg.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
          const quotedMsg = msg.extendedTextMessage.contextInfo.quotedMessage;
          const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }
          mediaBuffer = buffer;
          mediaType = "image";
        }
      }

      if (!mediaBuffer || mediaType !== "image") {
        await conn.sendMessage(remoteJid, {
          react: {
            text: '❗',
            key: m.key
          }
        });
        return await conn.sendText(
          remoteJid,
          '⚠️ *Envía o responde a una imagen JPG/PNG.*\n\nEjemplo: Envía una imagen y usa *.hd*',
          m
        );
      }

      console.log('📤 Imagen detectada, tamaño:', mediaBuffer.length, 'bytes');

      // Reaccionar con emoji de carga
      await conn.sendMessage(remoteJid, {
        react: {
          text: '⏳',
          key: m.key
        }
      });

      // Preparar FormData
      const filename = `mejorada_${Date.now()}.jpg`;
      const form = new FormData();
      form.append('image', mediaBuffer, { filename, contentType: 'image/jpeg' });
      form.append('scale', '2');

      const headers = {
        ...form.getHeaders(),
        'accept': 'application/json',
        'x-client-version': 'web',
        'x-locale': 'es'
      };

      console.log('🚀 Enviando imagen a Pixelcut API...');

      // Enviar a la API
      const res = await fetch('https://api2.pixelcut.app/image/upscale/v1', {
        method: 'POST',
        headers,
        body: form
      });

      const json = await res.json();

      console.log('📨 Respuesta API:', json);

      if (!json?.result_url || !json.result_url.startsWith('http')) {
        throw new Error('No se pudo obtener la imagen mejorada desde Pixelcut.');
      }

      console.log('✅ Imagen mejorada, descargando resultado...');

      // Descargar imagen mejorada
      const resultBuffer = await (await fetch(json.result_url)).buffer();

      console.log('📤 Enviando imagen mejorada...');

      // Enviar imagen mejorada
      await conn.sendMessage(remoteJid, {
        image: resultBuffer,
        caption: `✨ *Imagen Mejorada*\n\n📈 Resolución aumentada al doble\n💎 Mayor nitidez y detalles\n\n_Usa .hd cuando necesites mejorar una imagen borrosa._`
      }, { quoted: m });

      // Reaccionar con check
      await conn.sendMessage(remoteJid, {
        react: {
          text: '✅',
          key: m.key
        }
      });

      console.log('✅ Imagen mejorada enviada exitosamente');

    } catch (error) {
      console.error('❌ Error en comando HD:', error.message);

      await conn.sendText(
        remoteJid,
        `❌ *No se pudo mejorar la imagen.*\n\n${error.message}`,
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
