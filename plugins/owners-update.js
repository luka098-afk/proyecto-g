import { execSync } from 'child_process'
import fs from 'fs'

export default {
  command: ['update', 'actualizar'],
  owner: true,

  run: async ({ conn, m, remoteJid }) => {
    try {
      await conn.sendText(remoteJid, '🔄 *Verificando actualizaciones...*', m)

      // ─────────────────────────────────────
      // 📡 FETCH REMOTO
      // ─────────────────────────────────────
      try {
        execSync('git fetch origin main', { stdio: 'pipe' })
      } catch {
        execSync('git fetch origin master', { stdio: 'pipe' })
      }

      // ─────────────────────────────────────
      // 📋 VERIFICAR SI HAY CAMBIOS
      // ─────────────────────────────────────
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

      // ─────────────────────────────────────
      // 💾 STASH AUTOMÁTICO
      // ─────────────────────────────────────
      try {
        execSync(
          `git stash push -m "auto-update-${Date.now()}"`,
          { stdio: 'pipe' }
        )
      } catch {}

      // ─────────────────────────────────────
      // ⬇️ PULL SEGURO (MERGE)
      // ─────────────────────────────────────
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

      // ─────────────────────────────────────
      // 📦 DEPENDENCIAS
      // ─────────────────────────────────────
      if (files.includes('package.json')) {
        await conn.sendText(
          remoteJid,
          '📦 *package.json cambió*\nActualizando dependencias...',
          m
        )
        execSync('npm install', { stdio: 'pipe' })
      }

      // ─────────────────────────────────────
      // 🔄 MENSAJE FINAL
      // ─────────────────────────────────────
      await conn.sendText(
        remoteJid,
        `✅ *Bot actualizado correctamente*\n\n📝 Archivos: ${files.length}\n🔄 Reiniciando...`,
        m
      )

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
