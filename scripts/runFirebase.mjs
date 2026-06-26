import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { ensureJavaEnv } from './ensureJavaEnv.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export function getProjectEnv() {
  const env = ensureJavaEnv()

  if (!env) {
    console.error(
      'Java არ მოიძებნა. Firebase Firestore ემულატორს Java სჭირდება.\n' +
        'Java-ის დასაყენებლად გაუშვი: winget install Microsoft.OpenJDK.17\n' +
        'შემდეგ გახსენი ახალი ტერმინალი.',
    )
    process.exit(1)
  }

  return env
}

export function runNodeScript(scriptPath, env = getProjectEnv()) {
  execSync(`node "${scriptPath}"`, { cwd: root, env, stdio: 'inherit' })
}

export function runFirebase(args, env = getProjectEnv()) {
  const firebaseJs = join(root, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js')

  if (!existsSync(firebaseJs)) {
    console.error('firebase-tools არ მოიძებნა. გაუშვი: npm install')
    process.exit(1)
  }

  const command = `node "${firebaseJs}" ${args}`
  execSync(command, { cwd: root, env, stdio: 'inherit' })
}
