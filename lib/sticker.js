import { dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import fluent_ffmpeg from "fluent-ffmpeg";
import { fileTypeFromBuffer } from "./file-type-helper.js";
import webp from "node-webpmux";
import fetch from "node-fetch";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tmpDir = path.join(__dirname, "../tmp");

// Crear carpeta temporal si no existe
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Limpiar archivo temporal
async function cleanup(file) {
  try {
    if (fs.existsSync(file)) await fs.promises.unlink(file);
  } catch {}
}

/**
 * Convertir imagen/video a sticker con ffmpeg
 * @param {Buffer} img
 * @param {String} url
 * @param {Boolean} compress Comprimir si es muy pesado
 */
function sticker6(img, url, compress = false) {
  return new Promise(async (resolve, reject) => {
    try {
      if (url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Error descargando: ${res.status}`);
        img = await res.buffer();
      }

      const type = await fileTypeFromBuffer(img) || {
        mime: "application/octet-stream",
        ext: "bin",
      };

      if (type.ext === "bin") {
        return reject(new Error("Tipo de archivo no soportado"));
      }

      const tmp = path.join(tmpDir, `${Date.now()}.${type.ext}`);
      const out = path.join(tmpDir, `${Date.now()}.webp`);

      await fs.promises.writeFile(tmp, img);

      const isVideo = /video|gif/i.test(type.mime);
      const size = compress ? 224 : 320;

      const ff = isVideo
        ? fluent_ffmpeg(tmp).inputFormat(type.ext)
        : fluent_ffmpeg(tmp).input(tmp);

      ff.on("error", async (err) => {
          console.error("❌ FFmpeg error:", err.message);
          await cleanup(tmp);
          await cleanup(out);
          reject(err);
        })
        .on("end", async () => {
          await cleanup(tmp);
          let resultSticker = await fs.promises.readFile(out);
          await cleanup(out);

          // Si el sticker pesa más de 1MB, comprimir
          if (resultSticker.length > 1000000 && !compress) {
            console.log("⚠️ Sticker muy pesado, comprimiendo...");
            resultSticker = await sticker6(img, null, true);
          }

          resolve(resultSticker);
        })
        .addOutputOptions([
          `-vcodec`, `libwebp`,
          `-vf`, `scale='min(${size},iw)':min'(${size},ih)':force_original_aspect_ratio=decrease,fps=15, pad=${size}:${size}:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`
        ])
        .toFormat("webp")
        .save(out);

    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Agregar metadata EXIF al sticker
 * @param {Buffer} webpSticker
 * @param {String} packname
 * @param {String} author
 * @param {Array} categories
 * @param {Object} extra
 */
async function addExif(webpSticker, packname = "", author = "", categories = [""], extra = {}) {
  const img = new webp.Image();
  const stickerPackId = crypto.randomBytes(32).toString("hex");

  const json = {
    "sticker-pack-id": stickerPackId,
    "sticker-pack-name": packname,
    "sticker-pack-publisher": author,
    emojis: categories,
    ...extra,
  };

  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ]);

  const jsonBuffer = Buffer.from(JSON.stringify(json), "utf8");
  const exif = Buffer.concat([exifAttr, jsonBuffer]);
  exif.writeUIntLE(jsonBuffer.length, 14, 4);

  await img.load(webpSticker);
  img.exif = exif;
  return await img.save(null);
}

/**
 * Función principal para convertir imagen/video a sticker
 * @param {Buffer} img Buffer de imagen/video
 * @param {String} url URL de imagen/video
 * @param {Object} options Opciones: { packname, author, categories, keepAspectRatio }
 */
async function sticker(img, url = null, options = {}) {
  try {
    let data = img;

    // Si viene por URL
    if (url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudo descargar la imagen/video");
      data = await res.buffer();
    }

    // Generar sticker con ffmpeg
    let stickerBuffer = await sticker6(data, null, false);

    // Si se incluyen packname/author, agregar metadata
    if (options.packname || options.author) {
      stickerBuffer = await addExif(
        stickerBuffer,
        options.packname || "",
        options.author || "",
        options.categories || [""],
        options.extra || {}
      );
    }

    return stickerBuffer;

  } catch (err) {
    console.error("❌ Error en sticker():", err.message);
    throw err;
  }
}

export { sticker, sticker6, addExif };
export default sticker;
