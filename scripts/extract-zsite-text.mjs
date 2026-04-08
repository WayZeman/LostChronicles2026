#!/usr/bin/env node
/**
 * Повний витяг усіх INSERT у текст (з логами, статистикою тощо).
 * Для переносу на новий сайт краще: node scripts/build-zsite-migration-text.mjs
 * Запуск: node scripts/extract-zsite-text.mjs
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const SQL_PATH = path.join(ROOT, "zsite.sql")
const OUT_PATH = path.join(ROOT, "zsite-vytiah-danykh.txt")

const MAX_ROWS_PER_TABLE = {
  server_stats: 80,
  action_logs: 150,
  action_log_entries: 200,
  notifications: 300,
  likes: 200,
  forum_likes: 200,
  attachments: 100,
  images: 200,
  default: 5000,
}

function unescapeMysqlString(raw) {
  return raw
    .replace(/\\r\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\")
}

function skipWhitespace(sql, i) {
  while (i < sql.length) {
    const ch = sql[i]
    if (ch === " " || ch === "\n" || ch === "\r" || ch === "\t") i++
    else break
  }
  return i
}

function parseSqlNumberOrToken(token) {
  const trimmed = token.trim()
  if (trimmed.length === 0) return ""
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed)
  return trimmed
}

function parseSqlStringLiteral(sql, i) {
  if (sql[i] !== "'") throw new Error(`Expected quote at ${i}`)
  i++
  let out = ""
  while (i < sql.length) {
    const ch = sql[i]
    if (ch === "'") {
      i++
      return [out, i]
    }
    if (ch === "\\" && i + 1 < sql.length) {
      out += "\\" + sql[i + 1]
      i += 2
      continue
    }
    out += ch
    i++
  }
  throw new Error("Unterminated SQL string literal")
}

function parseSqlValue(sql, i) {
  i = skipWhitespace(sql, i)
  if (sql.startsWith("NULL", i)) return [null, i + 4]
  const ch = sql[i]
  if (ch === "'") {
    const [raw, next] = parseSqlStringLiteral(sql, i)
    return [unescapeMysqlString(raw), next]
  }
  const start = i
  while (i < sql.length) {
    const c = sql[i]
    if (c === "," || c === ")" || c === "\n" || c === "\r" || c === "\t") break
    i++
  }
  return [parseSqlNumberOrToken(sql.slice(start, i)), i]
}

function parseTupleValues(sql, i) {
  if (sql[i] !== "(") throw new Error(`Expected '(' at ${i}`)
  i++
  const values = []
  while (i < sql.length) {
    i = skipWhitespace(sql, i)
    const [val, nextI] = parseSqlValue(sql, i)
    values.push(val)
    i = nextI
    i = skipWhitespace(sql, i)
    if (sql[i] === ",") {
      i++
      continue
    }
    if (sql[i] === ")") {
      i++
      return [values, i]
    }
    throw new Error(`Expected ',' or ')' at ${i}`)
  }
  throw new Error("Unterminated tuple")
}

/** Як у prisma/seed.ts — усі кортежі для таблиці з усіх INSERT. */
function extractInsertTuples(sql, table) {
  const tuples = []
  const marker = `INSERT INTO \`${table}\``
  let pos = 0
  while (true) {
    const start = sql.indexOf(marker, pos)
    if (start === -1) break

    const valuesIdx = sql.indexOf("VALUES", start)
    if (valuesIdx === -1) break

    let i = valuesIdx + "VALUES".length
    while (i < sql.length && sql[i] !== "(" && sql[i] !== ";") i++

    while (i < sql.length && sql[i] !== ";") {
      while (i < sql.length) {
        i = skipWhitespace(sql, i)
        if (sql[i] === ",") {
          i++
          continue
        }
        break
      }

      if (sql[i] === "(") {
        const [row, nextI] = parseTupleValues(sql, i)
        tuples.push(row)
        i = nextI
      } else {
        break
      }
    }

    pos = i + 1
  }
  return tuples
}

function parseColumnNames(sql, table) {
  const marker = `INSERT INTO \`${table}\``
  const start = sql.indexOf(marker)
  if (start === -1) return []
  const open = sql.indexOf("(", start + marker.length)
  const close = sql.indexOf(")", open)
  if (open === -1 || close === -1) return []
  return sql
    .slice(open + 1, close)
    .split(",")
    .map((s) => s.trim().replace(/^`|`$/g, "").replaceAll("`", ""))
}

function listTablesInOrder(sql) {
  const re = /INSERT INTO `([^`]+)`/g
  const seen = new Set()
  const order = []
  let m
  while ((m = re.exec(sql)) !== null) {
    const t = m[1]
    if (!seen.has(t)) {
      seen.add(t)
      order.push(t)
    }
  }
  return order
}

function htmlToPlain(html) {
  if (typeof html !== "string") return String(html)
  let t = html
  t = t.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  t = t.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  t = t.replace(/<br\s*\/?>/gi, "\n")
  t = t.replace(/<\/(p|div|h[1-6]|tr|li|table|section)>/gi, "\n")
  t = t.replace(/<[^>]+>/g, "")
  t = t.replace(/&nbsp;/g, " ")
  t = t.replace(/&amp;/g, "&")
  t = t.replace(/&lt;/g, "<")
  t = t.replace(/&gt;/g, ">")
  t = t.replace(/&quot;/g, '"')
  t = t.replace(/\n{3,}/g, "\n\n")
  return t.trim()
}

function formatValue(col, val) {
  if (val === null) return "(немає)"
  if (typeof val === "number") return String(val)
  const s = String(val)
  const lc = col.toLowerCase()
  if (
    lc.includes("content") ||
    lc.includes("answer") ||
    lc.includes("description") ||
    lc.includes("body") ||
    lc === "data" ||
    lc.includes("html") ||
    lc.includes("signature") ||
    lc.includes("about")
  ) {
    if (s.includes("<") && s.includes(">")) return htmlToPlain(s)
  }
  if (s.length > 12000 && !lc.includes("content") && !lc.includes("answer")) {
    return s.slice(0, 12000) + "\n… [скорочено, " + s.length + " символів]"
  }
  return s
}

function main() {
  if (!fs.existsSync(SQL_PATH)) {
    console.error("Не знайдено:", SQL_PATH)
    process.exit(1)
  }
  const sql = fs.readFileSync(SQL_PATH, "utf8")
  const tables = listTablesInOrder(sql)

  const lines = []
  lines.push("=".repeat(80))
  lines.push("ВИТЯГ З zsite.sql — лише значення полів із INSERT (без SQL-команд)")
  lines.push("HTML у полях спрощено до тексту. Великі таблиці частково скорочено.")
  lines.push("=".repeat(80))

  for (const table of tables) {
    let columns
    let rows
    try {
      columns = parseColumnNames(sql, table)
      rows = extractInsertTuples(sql, table)
    } catch (e) {
      lines.push("\n[Помилка таблиці " + table + ": " + e.message + "]\n")
      continue
    }

    if (!columns.length || !rows.length) continue

    const maxRows = MAX_ROWS_PER_TABLE[table] ?? MAX_ROWS_PER_TABLE.default
    const slice = rows.length > maxRows ? rows.slice(0, maxRows) : rows
    const truncated = rows.length > maxRows

    lines.push("")
    lines.push("=".repeat(80))
    lines.push(`ТАБЛИЦЯ: ${table}`)
    lines.push(`Записів: ${rows.length}${truncated ? ` (показано перші ${maxRows})` : ""}`)
    lines.push("=".repeat(80))

    slice.forEach((row, ri) => {
      lines.push("")
      lines.push(`--- Запис ${ri + 1} ---`)
      columns.forEach((col, ci) => {
        const val = row[ci]
        const text = formatValue(col, val)
        const indented = text.split("\n").join("\n    ")
        lines.push(`${col}: ${indented}`)
      })
    })

    if (truncated) {
      lines.push("")
      lines.push(`[… ще ${rows.length - maxRows} записів не виведено]`)
    }
  }

  fs.writeFileSync(OUT_PATH, lines.join("\n"), "utf8")
  const st = fs.statSync(OUT_PATH)
  console.log("Записано:", OUT_PATH)
  console.log("Розмір:", Math.round(st.size / 1024), "КБ")
}

main()
