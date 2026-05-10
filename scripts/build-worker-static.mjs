#!/usr/bin/env node
/**
 * `output: "export"` is incompatible with App Router Route Handlers.
 * Temporarily move `src/app/api` aside so `next build` can emit `out/`,
 * then restore it for local `next dev` (which keeps `/api/chat`).
 */
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const frontend = path.join(root, "frontend")
const apiDir = path.join(frontend, "src", "app", "api")
const stash = path.join(frontend, "src", "app", "_api_worker_build_stash")

let stashed = false

try {
  if (fs.existsSync(apiDir)) {
    if (fs.existsSync(stash)) fs.rmSync(stash, { recursive: true, force: true })
    fs.renameSync(apiDir, stash)
    stashed = true
  }

  execSync("npm run build", {
    cwd: frontend,
    stdio: "inherit",
    env: { ...process.env },
  })
} finally {
  if (stashed && fs.existsSync(stash)) {
    if (fs.existsSync(apiDir)) fs.rmSync(apiDir, { recursive: true, force: true })
    fs.renameSync(stash, apiDir)
  }
}
