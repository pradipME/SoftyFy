// Dev-time utility: manage Google Drive file permissions via the Drive API,
// using the token already stored by rclone (rclone.conf). rclone's `link`
// does not set "anyone with the link" — this fills the gap so the app can
// play songs from another device.
//
// Usage:
//   node scripts/drive-api.mjs perms  <fileId>     # list permissions
//   node scripts/drive-api.mjs share  <fileId>     # add anyone:reader
//
// Output for `share`: prints the fileId again (for scripting).

import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))

const RCLONE_CONF = resolve(process.env.APPDATA || homedir(), 'rclone', 'rclone.conf')
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const FILES_URL = 'https://www.googleapis.com/drive/v3/files'
// rclone's well-known shared client (used when client_id is blank in config).
const SHARED_CLIENT_ID = '202264815644.apps.googleusercontent.com'
const SHARED_CLIENT_SECRET = 'X4Z3ca8xfWDb1Voo-F9a7Bgx'

async function readConfig() {
  const text = await readFile(RCLONE_CONF, 'utf8')
  const section = text.match(/\[drive\]([\s\S]*?)(?=\n\[|$)/)
  if (!section) throw new Error(`No [drive] section in ${RCLONE_CONF}`)
  const body = section[1]
  const kv = {}
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^([a-z_]+)\s*=\s*(.*)$/)
    if (m) kv[m[1]] = m[2]
  }
  if (!kv.token) throw new Error('No token in rclone [drive] config')
  return { clientId: kv.client_id, clientSecret: kv.client_secret, token: JSON.parse(kv.token) }
}

async function refreshAccessToken({ clientId, clientSecret, token }) {
  const cid = clientId || SHARED_CLIENT_ID
  const secret = clientSecret || SHARED_CLIENT_SECRET
  let accessToken = token.access_token
  const expiry = new Date(token.expiry)
  if (Date.now() + 5 * 60 * 1000 < expiry.getTime()) {
    return { accessToken, clientId: cid }
  }
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: token.refresh_token,
    client_id: cid,
    client_secret: secret,
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(`Token refresh failed: HTTP ${res.status} ${await res.text()}`)
  const data = await res.json()
  return { accessToken: data.access_token, clientId: cid }
}

async function api(path, { accessToken, method = 'GET', body } = {}) {
  const res = await fetch(`${FILES_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Drive API HTTP ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

async function perms(fileId, accessToken) {
  const data = await api(`/${fileId}/permissions?pageSize=100`, { accessToken })
  for (const p of data.permissions || []) {
    console.log(`PERM type=${p.type} role=${p.role} id=${p.id}`)
  }
}

async function share(fileId, accessToken) {
  await api(`/${fileId}/permissions?supportsAllDrives=true`, {
    accessToken,
    method: 'POST',
    body: { role: 'reader', type: 'anyone', allowFileDiscovery: false },
  })
  console.log(`SHARED\t${fileId}`)
}

async function main() {
  const argv = process.argv.slice(2)
  const command = argv[0]
  const fileId = argv[1]
  if (!fileId) {
    console.log(`Usage:
  node scripts/drive-api.mjs perms <fileId>
  node scripts/drive-api.mjs share <fileId>`)
    process.exit(1)
  }
  const { clientId, clientSecret, token } = await readConfig()
  const { accessToken } = await refreshAccessToken({ clientId, clientSecret, token })
  if (command === 'perms') await perms(fileId, accessToken)
  else if (command === 'share') await share(fileId, accessToken)
  else {
    console.error(`Unknown command: ${command}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(String(err?.message || err))
  process.exit(1)
})