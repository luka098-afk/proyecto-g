import { execSync } from 'child_process'

export default {
  command: ['update', 'actualizar'],
  owner: true,

  run: async ({ conn, m, remoteJid }) => {
    try {
      await conn.sendText(remoteJid, '🔍 *Verificando actualizaciones...*', m)

      // ══════════════════════════════════════════════════════
      // 📡 VERIFICAR SI HAY CAMBIOS EN GITHUB
      // ══════════════════════════════════════════════════════

      // Fetch desde GitHub sin descargar
      execSync('git fetch origin main', { encoding: 'utf8' })

      // Verificar diferencias
      const diffOutput = execSync(
        'git diff HEAD origin/main --name-only',
        { encoding: 'utf8' }
      ).trim()

      if (!diffOutput) {
        return await conn.sendText(
          remoteJid,
          '✅ *El bot ya está actualizado*\n\nNo hay cambios nuevos en GitHub.',
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 📋 MOSTRAR ARCHIVOS QUE SE ACTUALIZARÁN
      // ══════════════════════════════════════════════════════

      const changedFiles = diffOutput.split('\n').filter(f => f.trim())
      let filesList = changedFiles
        .slice(0, 10)
        .map(f => `  • ${f}`)
        .join('\n')

      if (changedFiles.length > 10) {
        filesList += `\n  • ... y ${changedFiles.length - 10} archivos más`
      }

      await conn.sendText(
        remoteJid,
        `📦 *Se encontraron ${changedFiles.length} archivo(s) nuevos*\n\n${filesList}\n\n⏳ Descargando cambios...`,
        m
      )

      // ══════════════════════════════════════════════════════
      // 🔄 ACTUALIZAR DESDE GITHUB (MERGE SEGURO)
      // ══════════════════════════════════════════════════════

      const pullOutput = execSync(
        'git pull origin main --no-rebase',
        { encoding: 'utf8' }
      )

      // Verificar conflictos
      if (pullOutput.toLowerCase().includes('conflict')) {
        return await conn.sendText(
          remoteJid,
          `⚠️ *Conflicto detectado*\n\nHay cambios locales que entran en conflicto con GitHub.\n\nContacta al desarrollador.`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 📊 RESUMEN DE ACTUALIZACIÓN
      // ══════════════════════════════════════════════════════

      let summary = `✅ *Bot actualizado exitosamente*\n\n`
      summary += `📝 *Archivos actualizados:* ${changedFiles.length}\n\n`

      const protectedFiles = [
        'lib/db.json',
        'lib/blacklist.json',
        'lib/cookies.txt',
        'auth/'
      ]

      const touchedProtected = changedFiles.filter(f =>
        protectedFiles.some(pf => f.includes(pf))
      )

      if (touchedProtected.length === 0) {
        summary += `🔒 *Datos protegidos:* Intactos\n`
        summary += `  ✓ Base de datos\n`
        summary += `  ✓ Lista negra\n`
        summary += `  ✓ Cookies\n`
        summary += `  ✓ Sesión\n\n`
      } else {
        summary += `⚠️ *Archivos protegidos afectados:*\n`
        touchedProtected.forEach(f => {
          summary += `  • ${f}\n`
        })
        summary += `\n`
      }

      summary += `🔄 *Reiniciando bot...*`

      await conn.sendText(remoteJid, summary, m)

      // ══════════════════════════════════════════════════════
      // 🔄 REINICIAR BOT
      // ══════════════════════════════════════════════════════

      setTimeout(() => {
        process.exit(0)
      }, 2000)

    } catch (error) {
      console.error('❌ Error en update:', error)

      let errorMsg = `❌ *Error al actualizar*\n\n`

      if (error.message.includes('not a git repository')) {
        errorMsg += `El bot no está conectado a un repositorio de GitHub.\n\n`
        errorMsg += `Para configurarlo:\n`
        errorMsg += `1. Crea un repo en GitHub\n`
        errorMsg += `2. Ejecuta:\n`
        errorMsg += `   git init\n`
        errorMsg += `   git remote add origin [URL]\n`
        errorMsg += `   git add .\n`
        errorMsg += `   git commit -m "Initial commit"\n`
        errorMsg += `   git push -u origin main`
      } else if (error.message.includes('fast-forward')) {
        errorMsg += `Hay cambios locales que entran en conflicto.\n\n`
        errorMsg += `Ejecuta manualmente:\n`
        errorMsg += `  git stash\n`
        errorMsg += `  git pull --no-rebase\n`
        errorMsg += `  git stash pop`
      } else {
        errorMsg += `\`\`\`${error.message}\`\`\``
      }

      await conn.sendText(remoteJid, errorMsg, m)
    }
  }
}
