import yts from "yt-search";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { existsSync, promises } from "fs";
import { getUser, updateUser } from "../db.js";
import config from "../config.js";

const execAsync = promisify(exec);
const ytDlpPath = path.resolve("node_modules", "gs", "ygs");

const WAIT_TIME = 210000;

export default {
  command: ["play", "audio", "video", "vídeo"],

  async run({ conn, m, text, args, remoteJid, senderJid, isOwner }) {
    const user = getUser(senderJid);

    const lastUsed = user.lastmining || 0;
    const timePassed = Date.now() - lastUsed;

    if (timePassed < WAIT_TIME && !isOwner) {
      const remaining = Math.ceil((WAIT_TIME - timePassed) / 1000);
      const attempts = (user.commandAttempts || 0) + 1;

      updateUser(senderJid, { commandAttempts: attempts });

      if (attempts > 4) {
        updateUser(senderJid, { banned: true });
        return conn.sendText(remoteJid, `🚫 *Fuiste baneado por spam.*`, m);
      }

      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      const formattedTime = minutes > 0 ? `${minutes} min ${seconds} segundos` : `${seconds} segundos`;

      return conn.sendText(remoteJid, `⏳ Espera *${formattedTime}* antes de volver a usar este comando.\n⚠️ Advertencia ${attempts}/4`, m);
    }

    if (!args.length) {
      return conn.sendText(remoteJid, `🔍 Escribe el título o URL del video.\n\nEjemplo: *.play shape of you*`, m);
    }

    const command = text.slice(config.prefix.length).trim().split(/\s+/)[0].toLowerCase();
    const isAudio = command === "play" || command === "audio";

    updateUser(senderJid, { lastmining: Date.now(), commandAttempts: 0 });

    try {
      await m.react("⌛");
    } catch {}

    try {
      const results = await searchYT(args.join(" "));
      if (!results.length) {
        return conn.sendText(remoteJid, `❌ No se encontraron resultados para: *${args.join(" ")}*`, m);
      }

      const video = results[0];

      await conn.sendMessage(remoteJid, {
        image: { url: video.thumbnail },
        caption: isAudio ? `🎵 Descargando audio...\n📌 *${video.title}*\n⏱ ${video.timestamp}` : `🎬 Descargando video...\n📌 *${video.title}*\n⏱ ${video.timestamp}`,
      });

      if (!existsSync("./tmp")) await promises.mkdir("./tmp", { recursive: true });

      const randomFileName = Math.random().toString(36).substring(2, 15);
      const format = isAudio ? "bestaudio[ext=m4a]" : "worst";
      const fileExt = isAudio ? ".m4a" : ".mp4";
      const outputPath = path.join("./tmp", `${randomFileName}${fileExt}`);

      const commandStr = `${ytDlpPath} -f "${format}" --no-warnings -o "${outputPath}" ${video.url}`;
      const { stderr } = await execAsync(commandStr).catch((error) => ({
        stdout: error.stdout || "",
        stderr: error.stderr || error.message || "",
      }));

      const lower = stderr.toLowerCase();
      const esWarning = lower.includes("warning:") || lower.includes("signature extraction failed") || lower.includes("sabr streaming") || lower.includes("some web_safari");

      if (!esWarning && stderr) {
        console.error(`Error en YouTube: ${stderr}`);
        return conn.sendText(remoteJid, `❌ Error al descargar: ${stderr.slice(0, 200)}`, m);
      }

      const tmpFiles = await promises.readdir("./tmp");
      const foundFile = tmpFiles.find((f) => f.startsWith(randomFileName));
      const finalPath = foundFile ? path.join("./tmp", foundFile) : outputPath;

      if (!existsSync(finalPath)) {
        console.error(`Archivo no encontrado: ${finalPath}`);
        return conn.sendText(remoteJid, `❌ No se pudo encontrar el archivo descargado.`, m);
      }

      const mediaBuffer = await promises.readFile(finalPath);

      if (isAudio) {
        await conn.sendMessage(
          remoteJid,
          {
            audio: mediaBuffer,
            mimetype: "audio/mp4",
            ptt: false,
          },
          { quoted: m },
        );
      } else {
        await conn.sendMessage(
          remoteJid,
          {
            video: mediaBuffer,
          },
          { quoted: m },
        );
      }

      await promises.unlink(finalPath).catch(() => {});
    } catch (error) {
      console.error("Error en plugin de YouTube:", error.message);
      await conn.sendText(remoteJid, `❌ Ocurrió un error: ${error.message}`, m).catch(() => {});
    }
  },
};

async function searchYT(query) {
  const result = await yts.search({ query, hl: "es", gl: "ES" });
  return result.videos;
}
