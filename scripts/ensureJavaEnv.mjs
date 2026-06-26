import { existsSync, readdirSync } from 'node:fs'
import { delimiter, join } from 'node:path'

const JAVA_BIN = process.platform === 'win32' ? 'java.exe' : 'java'

function hasJava(home) {
  return Boolean(home && existsSync(join(home, 'bin', JAVA_BIN)))
}

function collectCandidates() {
  const candidates = []

  if (process.platform === 'win32') {
    for (const base of ['C:\\Program Files\\Microsoft', 'C:\\Program Files\\Java', 'C:\\Program Files\\Eclipse Adoptium']) {
      if (!existsSync(base)) continue

      for (const name of readdirSync(base, { withFileTypes: true })) {
        if (!name.isDirectory()) continue
        if (base.includes('Microsoft') && !name.name.startsWith('jdk-')) continue
        candidates.push(join(base, name.name))
      }
    }
  }

  return candidates
}

function withJavaOnPath(env, javaHome) {
  const bin = join(javaHome, 'bin')
  const pathValue = env.PATH || ''
  if (pathValue.toLowerCase().includes(bin.toLowerCase())) return env

  return {
    ...env,
    JAVA_HOME: javaHome,
    PATH: `${bin}${delimiter}${pathValue}`,
  }
}

export function ensureJavaEnv(baseEnv = process.env) {
  if (hasJava(baseEnv.JAVA_HOME)) {
    return withJavaOnPath(baseEnv, baseEnv.JAVA_HOME)
  }

  for (const home of collectCandidates()) {
    if (hasJava(home)) return withJavaOnPath(baseEnv, home)
  }

  return null
}
