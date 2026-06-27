#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const netlifyToml = readFileSync(join(root, 'netlify.toml'), 'utf8')
const API_KEY = netlifyToml.match(/VITE_FIREBASE_API_KEY\s*=\s*"([^"]+)"/)?.[1]
const email = (process.argv[2] || 'giorgidiasamidze848@gmail.com').trim()

if (!API_KEY) process.exit(1)

const response = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
  },
)

const data = await response.json()
if (!response.ok) {
  console.error(data?.error?.message || 'Password reset failed')
  process.exit(1)
}

console.log(`Password reset email sent to ${email}`)
