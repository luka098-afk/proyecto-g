import { execSync } from 'child_process'
import fs from 'fs'

export default {
  command: ['update', 'actualizar'],
  owner: true,

  run: async ({ conn, m, remoteJid }) => {
    try {
      await conn.sendText(remoteJid, '🔄 *Verificando actualizaciones...*', m)

      // ═══════════════════════════════════════════════════════
      // 💾 BACKUP DE CONFIG.JS LOCAL
      // ═══════════════════════════════════════════════════════
      let configBackup = null
      try {
        if (fs.existsSync('./config.js')) {
          configBackup = fs.readFileSync('./config.js', 'utf8')
          console.log('💾 Backup del config.js creado')
        }
      } catch (err) {
        console.log('⚠️ No se pudo hacer backup del config:', err.message)
      }

      // ═══════════════════════════════════════════════════════
      // 📡 FETCH REMOTO
      // ═══════════════════════════════════════════════════════
      try {
        execSync('git fetch origin main', { stdio: 'pipe' })
      } catch {
        execSync('git fetch origin master', { stdio: 'pipe' })
      }

      // ═══════════════════════════════════════════════════════
      // 📋 VERIFICAR SI HAY CAMBIOS
      // ═══════════════════════════════════════════════════════
      const diff = execSync(
        'git diff HEAD @{u} --name-only',
        { encoding: 'utf8' }
      ).trim()

      if (!diff) {
        return await conn.sendText(
          remoteJid,
          '✅ *El bot ya está actualizado*\n\nNo hay cambios nuevos en GitHub.',
          m
        )
      }

      const files = diff.split('\n').filter(Boolean)

      let list = files.slice(0, 10).map(f => `• ${f}`).join('\n')
      if (files.length > 10) {
        list += `\n• ... y ${files.length - 10} más`
      }

      await conn.sendText(
        remoteJid,
        `📦 *Actualizaciones disponibles*\n\n${list}\n\n⏳ Actualizando...`,
        m
      )

      // ═══════════════════════════════════════════════════════
      // 💾 STASH AUTOMÁTICO
      // ═══════════════════════════════════════════════════════
      try {
        execSync(
          `git stash push -m "auto-update-${Date.now()}"`,
          { stdio: 'pipe' }
        )
      } catch {}

      // ═══════════════════════════════════════════════════════
      // ⬇️ PULL SEGURO (MERGE)
      // ═══════════════════════════════════════════════════════
      try {
        execSync(
          'git pull origin main --no-rebase',
          { stdio: 'pipe' }
        )
      } catch {
        execSync(
          'git pull origin master --no-rebase',
          { stdio: 'pipe' }
        )
      }

      // ═══════════════════════════════════════════════════════
      // 🔒 RESTAURAR CONFIG.JS LOCAL
      // ═══════════════════════════════════════════════════════
      if (configBackup) {
        try {
          fs.writeFileSync('./config.js', configBackup, 'utf8')
          console.log('✅ Config.js local restaurado correctamente')
        } catch (err) {
          console.error('❌ Error al restaurar config.js:', err.message)
        }
      }

      // ═══════════════════════════════════════════════════════
      // 📦 DEPENDENCIAS
      // ═══════════════════════════════════════════════════════
      if (files.includes('package.json')) {
        await conn.sendText(
          remoteJid,
          '📦 *package.json cambió*\nActualizando dependencias...',
          m
        )
        execSync('npm install', { stdio: 'pipe' })
      }

      // ═══════════════════════════════════════════════════════
      // 📊 RESUMEN DE PROTECCIÓN
      // ═══════════════════════════════════════════════════════
      const protectedFiles = ['lib/db.json', 'lib/blacklist.json', 'lib/cookies.txt', 'auth/', 'config.js']
      const touchedProtected = files.filter(f => 
        protectedFiles.some(pf => f.includes(pf))
      )

      let summary = `✅ *Bot actualizado correctamente*\n\n`
      summary += `📝 *Archivos actualizados:* ${files.length}\n\n`

      if (touchedProtected.length === 0) {
        summary += `🔒 *Datos protegidos:* Intactos\n`
        summary += `  ✓ Config local\n`
        summary += `  ✓ Base de datos\n`
        summary += `  ✓ Lista negra\n`
        summary += `  ✓ Cookies\n`
        summary += `  ✓ Sesión\n\n`
      } else {
        summary += `🔒 *Archivos protegidos:*\n`
        touchedProtected.forEach(f => {
          if (f === 'config.js') {
            summary += `  • ${f} ✅ (restaurado desde backup)\n`
          } else {
            summary += `  • ${f}\n`
          }
        })
        summary += `\n`
      }

      summary += `🔄 *Reiniciando...*`

      // ═══════════════════════════════════════════════════════
      // 🔄 MENSAJE FINAL Y REINICIO
      // ═══════════════════════════════════════════════════════
      await conn.sendText(remoteJid, summary, m)

      setTimeout(() => process.exit(0), 2000)

    } catch (err) {
      console.error('[UPDATE ERROR]', err)

      let msg = '❌ *Error al actualizar*\n\n'

      if (String(err).includes('not a git repository')) {
        msg += 'Este bot no está vinculado a un repositorio Git.'
      } else if (String(err).includes('identity unknown')) {
        msg += 'Git no tiene configurado user.name / user.email.'
      } else {
        msg += '```' + err.message + '```'
      }

      await conn.sendText(remoteJid, msg, m)
    }
  }
}
