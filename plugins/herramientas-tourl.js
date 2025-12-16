import { existsSync, mkdirSync } from 'fs';
import { fileTypeFromBuffer } from '../lib/file-type-helper.js';
import fetch from 'node-fetch';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
  command: ["tourl", "upload"],

  run: async ({ conn, m, remoteJid }) => {
    try {
      console.log('🔧 Comando tourl ejecutado');

      // Reaccionar con emoji de carga
      await conn.sendMessage(remoteJid, {
        react: {
          text: '☁️',
          key: m.key
        }
      });

      // Crear directorio tmp si no existe
      if (!existsSync('./tmp')) {
        mkdirSync('./tmp', { recursive: true });
      }

      // Obtener mensaje con media
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
        } else if (quotedMsg.videoMessage) {
          console.log('✅ Video citado');
          mediaBuffer = await m.quoted.download();
          mediaType = "video";
        } else if (quotedMsg.documentMessage) {
          console.log('✅ Documento citado');
          mediaBuffer = await m.quoted.download();
          mediaType = "document";
        } else if (quotedMsg.audioMessage) {
          console.log('✅ Audio citado');
          mediaBuffer = await m.quoted.download();
          mediaType = "audio";
        }
      }
      // Si NO citó, buscar en el mensaje actual
      else {
        console.log('🔍 Buscando media en mensaje actual');
        const msg = m.message;

        if (msg.imageMessage) {
          const stream = await downloadContentFromMessage(msg.imageMessage, 'image');
          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }
          mediaBuffer = buffer;
          mediaType = "image";
        } else if (msg.videoMessage) {
          const stream = await downloadContentFromMessage(msg.videoMessage, 'video');
          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }
          mediaBuffer = buffer;
          mediaType = "video";
        } else if (msg.documentMessage) {
          const stream = await downloadContentFromMessage(msg.documentMessage, 'document');
          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }
          mediaBuffer = buffer;
          mediaType = "document";
        } else if (msg.extendedTextMessage?.contextInfo?.quotedMessage) {
          const quotedMsg = msg.extendedTextMessage.contextInfo.quotedMessage;
          
          if (quotedMsg.imageMessage) {
            const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
              buffer = Buffer.concat([buffer, chunk]);
            }
            mediaBuffer = buffer;
            mediaType = "image";
          } else if (quotedMsg.videoMessage) {
            const stream = await downloadContentFromMessage(quotedMsg.videoMessage, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
              buffer = Buffer.concat([buffer, chunk]);
            }
            mediaBuffer = buffer;
            mediaType = "video";
          }
        }
      }

      console.log('📊 mediaBuffer:', mediaBuffer ? `SI (${mediaBuffer.length} bytes)` : "NO");
      console.log('📊 mediaType:', mediaType);

      if (!mediaBuffer || !mediaType) {
        await conn.sendMessage(remoteJid, {
          react: {
            text: '',
            key: m.key
          }
        });
        return await conn.sendText(
          remoteJid,
          '🌧️ *Responde a una imagen/video/documento para subirlo.*\n\nEjemplo: Envía una imagen y responde *.tourl*',
          m
        );
      }

      console.log('📤 Archivo descargado, tamaño:', mediaBuffer.length, 'bytes');

      const uploads = [];

      // Intentar subir a los servidores
      try {
        const up1 = await uploaderCloudStack(mediaBuffer);
        if (up1) uploads.push({ name: '☁️ CloudStack', url: up1 });
      } catch (e) {
        console.log('CloudStack falló:', e.message);
      }

      try {
        const up2 = await uploaderCloudGuru(mediaBuffer);
        if (up2) uploads.push({ name: '🌀 CloudGuru', url: up2 });
      } catch (e) {
        console.log('CloudGuru falló:', e.message);
      }

      try {
        const up3 = await uploaderCloudCom(mediaBuffer);
        if (up3) uploads.push({ name: '🌐 CloudImages', url: up3 });
      } catch (e) {
        console.log('CloudCom falló:', e.message);
      }

      if (uploads.length === 0) {
        throw new Error('No se pudo subir a ningún servidor');
      }

      let texto = `☁️ *Archivo Subido Exitosamente*\n\n`;
      for (const up of uploads) {
        texto += `*${up.name}*\n🔗 ${up.url}\n\n`;
      }

      await conn.sendText(remoteJid, texto.trim(), m);

      // Reaccionar con check
      await conn.sendMessage(remoteJid, {
        react: {
          text: '✅',
          key: m.key
        }
      });

      console.log('✅ Archivo subido exitosamente');

    } catch (error) {
      console.error('❌ Error en comando tourl:', error.message);

      await conn.sendText(
        remoteJid,
        '⛈️ *Ocurrió un error durante la subida. Intenta de nuevo más tarde.*',
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

// ═══════════════════════════════════════════════════════════
// FUNCIONES DE UPLOAD
// ═══════════════════════════════════════════════════════════

async function uploadTo(url, buffer) {
  try {
    const fileType = await fileTypeFromBuffer(buffer);
    const ext = fileType?.ext || 'bin';
    const mime = fileType?.mime || 'application/octet-stream';

    console.log(`📄 Detectado: .${ext} (${mime})`);

    // Crear boundary para FormData manual
    const boundary = '----formdata-' + Math.random().toString(36);
    const filename = `upload_${Date.now()}.${ext}`;

    // Construir FormData manualmente
    let formData = '';
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
    formData += `Content-Type: ${mime}\r\n\r\n`;

    const formDataBuffer = Buffer.concat([
      Buffer.from(formData, 'utf8'),
      buffer,
      Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
    ]);

    console.log(`📡 Subiendo ${formDataBuffer.length} bytes a: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      body: formDataBuffer,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formDataBuffer.length
      },
      timeout: 30000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📨 Respuesta:', result);

    if (result.status === 'success' && result.data?.url) {
      return result.data.url;
    }

    throw new Error('Respuesta del servidor inválida');

  } catch (error) {
    console.error(`❌ Error en ${url}:`, error.message);
    throw error;
  }
}

// Servicios de upload
const uploaderCloudStack = async (buffer) => {
  return await uploadTo('https://phpstack-1487948-5667813.cloudwaysapps.com/upload.php', buffer);
};

const uploaderCloudGuru = async (buffer) => {
  return await uploadTo('https://cloudkuimages.guru/upload.php', buffer);
};

const uploaderCloudCom = async (buffer) => {
  return await uploadTo('https://cloudkuimages.com/upload.php', buffer);
};
