import Ajv from "ajv/dist/2020.js"
import addFormats from "ajv-formats"
import { readFileSync } from "node:fs"

const SCHEMA_TIMEOUT_MS = 10_000
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"))

async function validate(path) {
  const data = readJson(path)
  const response = await fetch(data.$schema, { signal: AbortSignal.timeout(SCHEMA_TIMEOUT_MS) })
  const ajv = new Ajv({ strict: false, allErrors: true })
  addFormats(ajv)
  const check = ajv.compile(await response.json())
  if (check(data)) {
    console.log(`${path}: valid`)
    return true
  }
  console.error(`${path}:`, JSON.stringify(check.errors, null, 2))
  return false
}

const results = await Promise.all(["plugin.json", "mcp.json"].map(validate))
process.exit(results.every(Boolean) ? 0 : 1)
