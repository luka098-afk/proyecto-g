import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, watch } from "fs";
import { exec } from "child_process";

// YTDLP INSTALL
export async function installYtDlp() {
  const filePath = process.platform === "win32" ? "./node_modules/gs/ygs.exe" : "./node_modules/gs/ygs";
  if (existsSync(filePath)) return;

  if (!existsSync("./node_modules/gs")) {
    mkdirSync("./node_modules/gs");
  }

  const runCommand = (command) =>
    new Promise((resolve, reject) => {
      exec(command, (error, stdout) => {
        if (error) return reject(error);
        resolve(stdout.trim());
      });
    });

  try {
    if (process.platform === "win32") {
      await runCommand("powershell -Command \"Invoke-WebRequest -Uri 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' -OutFile './node_modules/gs/ygs.exe'\"");
    } else {
      await runCommand("curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ./node_modules/gs/ygs");
      await runCommand("chmod +x ./node_modules/gs/ygs");
    }
  } catch (e) {
    console.error("Error con instalacion de Youtube", e);
  }
}
