#!/usr/bin/env node
/**
 * Формує zsite-vytiah-danykh.txt — лише текст для переносу на новий сайт
 * (вікі, пости, FAQ, форум, сервер, ролі, ніки без email/паролів).
 * Запуск: node scripts/build-zsite-migration-text.mjs
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const SQL_PATH = path.join(ROOT, "zsite.sql")
const OUT_PATH = path.join(ROOT, "zsite-vytiah-danykh.txt")

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
      } else break
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

function tableObjects(sql, table) {
  const cols = parseColumnNames(sql, table)
  if (!cols.length) return []
  return extractInsertTuples(sql, table).map((row) =>
    Object.fromEntries(cols.map((c, i) => [c, row[i]]))
  )
}

function htmlToPlain(html) {
  if (html == null) return ""
  if (typeof html !== "string") return String(html)
  let t = html
  t = t.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  t = t.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  t = t.replace(/<br\s*\/?>/gi, "\n")
  t = t.replace(/<\/(p|div|h[1-6]|tr|li|table|section|article)>/gi, "\n")
  t = t.replace(/<[^>]+>/g, "")
  t = t.replace(/&nbsp;/g, " ")
  t = t.replace(/&amp;/g, "&")
  t = t.replace(/&lt;/g, "<")
  t = t.replace(/&gt;/g, ">")
  t = t.replace(/&quot;/g, '"')
  t = t.replace(/\n{3,}/g, "\n\n")
  return t.trim()
}

function asText(val) {
  if (val == null) return ""
  const s = String(val)
  if (s.includes("<") && s.includes(">")) return htmlToPlain(s)
  return s.trim()
}

function sep(title) {
  return ["", "═".repeat(76), title, "═".repeat(76), ""]
}

function main() {
  if (!fs.existsSync(SQL_PATH)) {
    console.error("Немає файлу:", SQL_PATH)
    process.exit(1)
  }
  const sql = fs.readFileSync(SQL_PATH, "utf8")
  const L = []

  L.push("=".repeat(76))
  L.push("LOST CHRONICLES — ТЕКСТ ДЛЯ ПЕРЕНОСУ НА НОВИЙ САЙТ")
  L.push("Зібрано з zsite.sql: лише зміст (без логів, статистики, ключів API).")
  L.push("Користувачі: тільки нікнейми та ігрові id — без email і паролів.")
  L.push("=".repeat(76))

  const roles = tableObjects(sql, "roles")
  const roleById = new Map(roles.map((r) => [r.id, r.name]))

  const wikiCats = tableObjects(sql, "wiki_categories")
  const wikiCatById = new Map(wikiCats.map((c) => [c.id, c.name]))

  const forums = tableObjects(sql, "forum_forums")
  const forumById = new Map(forums.map((f) => [f.id, f.name]))

  const posts = tableObjects(sql, "posts")
  const postById = new Map(posts.map((p) => [p.id, p.title]))

  const discussions = tableObjects(sql, "forum_discussions")
  const discussionById = new Map(discussions.map((d) => [d.id, d.title]))

  // --- Сервери ---
  L.push(...sep("СЕРВЕРИ (адреса, порт, опис для головної)"))
  for (const s of tableObjects(sql, "servers")) {
    L.push(`Назва: ${asText(s.name)}`)
    L.push(`Адреса: ${asText(s.address)}  Порт: ${s.port ?? ""}`)
    L.push(`Тип: ${asText(s.type)}`)
    if (s.join_url) L.push(`Посилання на вхід: ${asText(s.join_url)}`)
    if (s.home_display) L.push(`Текст на головній:\n${asText(s.home_display)}`)
    if (s.data) L.push(`Додаткові дані:\n${asText(s.data)}`)
    L.push("—".repeat(40))
  }

  // --- Меню ---
  L.push(...sep("МЕНЮ САЙТУ (пункти навігації)"))
  for (const n of tableObjects(sql, "navbar_elements").sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) {
    L.push(`${asText(n.name)}  [${asText(n.type)}] → ${asText(n.value)}`)
  }

  // --- Ролі ---
  L.push(...sep("РОЛІ КОРИСТУВАЧІВ (назви)"))
  for (const r of roles.sort((a, b) => (a.power ?? 0) - (b.power ?? 0))) {
    L.push(`• ${asText(r.name)}${r.is_admin ? " (адміністратор)" : ""}`)
  }

  // --- Користувачі: лише публічне ---
  L.push(...sep("ОБЛІКОВІ ЗАПИСИ — ЛИШЕ НІК ТА ІГРОВИЙ ID (без email/паролів)"))
  for (const u of tableObjects(sql, "users")) {
    const nick = asText(u.name)
    if (/^Deleted\s*#/i.test(nick)) continue
    const rn = roleById.get(u.role_id) ?? "?"
    L.push(`Нік: ${nick}  |  Роль: ${rn}  |  game_id: ${u.game_id ?? "—"}  |  баланс: ${u.money ?? "—"}`)
  }

  // --- FAQ ---
  L.push(...sep("ЧАСТІ ЗАПИТАННЯ (FAQ)"))
  for (const f of tableObjects(sql, "faq_questions").sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) {
    L.push(`Питання: ${asText(f.name)}`)
    L.push(asText(f.answer))
    L.push("—".repeat(40))
  }

  // --- Вікі ---
  L.push(...sep("ВІКІ — КАТЕГОРІЇ"))
  for (const c of wikiCats.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) {
    L.push(`• ${asText(c.name)} (slug: ${asText(c.slug)})`)
  }

  L.push(...sep("ВІКІ — СТОРІНКИ (міста, держави, лор тощо)"))
  for (const w of tableObjects(sql, "wiki_pages").sort((a, b) => {
    const ca = String(wikiCatById.get(a.category_id) ?? "")
    const cb = String(wikiCatById.get(b.category_id) ?? "")
    if (ca !== cb) return ca.localeCompare(cb, "uk")
    return String(a.title ?? "").localeCompare(String(b.title ?? ""), "uk")
  })) {
    const cat = wikiCatById.get(w.category_id) ?? "Без категорії"
    L.push(`Категорія: ${cat}`)
    L.push(`Заголовок: ${asText(w.title)}`)
    L.push(`Slug: ${asText(w.slug)}`)
    L.push(asText(w.content))
    L.push("—".repeat(40))
  }

  // --- Пости / новини ---
  L.push(...sep("НОВИНИ / ПОСТИ"))
  for (const p of posts.sort((a, b) => String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")))) {
    L.push(`Заголовок: ${asText(p.title)}`)
    L.push(`Slug: ${asText(p.slug)}`)
    if (p.description) L.push(`Короткий опис:\n${asText(p.description)}`)
    L.push(asText(p.content))
    L.push(`Дата публікації: ${p.published_at ?? "—"}`)
    L.push("—".repeat(40))
  }

  // --- Статичні сторінки ---
  L.push(...sep("СТАТИЧНІ СТОРІНКИ (pages)"))
  for (const p of tableObjects(sql, "pages")) {
    if (p.is_enabled === 0) continue
    L.push(`Заголовок: ${asText(p.title)}  |  slug: ${asText(p.slug)}`)
    if (p.description) L.push(`Опис: ${asText(p.description)}`)
    L.push(asText(p.content))
    L.push("—".repeat(40))
  }

  // --- Календар ---
  L.push(...sep("ПОДІЇ КАЛЕНДАРЯ"))
  for (const e of tableObjects(sql, "calendar_events")) {
    if (e.is_active === 0) continue
    L.push(`Подія: ${asText(e.title)}`)
    L.push(`${e.start_date ?? ""} — ${e.end_date ?? ""}`)
    L.push(asText(e.description))
    L.push("—".repeat(40))
  }

  // --- Форум: структура ---
  L.push(...sep("ФОРУМ — КАТЕГОРІЇ ТА РОЗДІЛИ"))
  const fCats = tableObjects(sql, "forum_categories").sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  for (const c of fCats) {
    L.push(`▸ ${asText(c.name)}`)
    if (c.description) L.push(`  ${asText(c.description)}`)
    const sub = forums.filter((f) => f.category_id === c.id).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    for (const f of sub) {
      L.push(`   — ${asText(f.name)} [/${asText(f.slug)}]`)
      if (f.description) L.push(`     ${asText(f.description)}`)
    }
  }

  L.push(...sep("ФОРУМ — ТЕМИ (обговорення)"))
  for (const d of discussions.sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))) {
    const fn = forumById.get(d.forum_id) ?? "?"
    L.push(`Розділ: ${fn}`)
    L.push(`Тема: ${asText(d.title)}`)
    L.push("—".repeat(20))
  }

  L.push(...sep("ФОРУМ — ПОВІДОМЛЕННЯ (текст)"))
  for (const fp of tableObjects(sql, "forum_posts").sort((a, b) => String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")))) {
    const title = discussionById.get(fp.discussion_id) ?? "тема #" + fp.discussion_id
    L.push(`У темі «${title}»:`)
    L.push(asText(fp.content))
    L.push("—".repeat(40))
  }

  // --- Коментарі до постів ---
  L.push(...sep("КОМЕНТАРІ ДО НОВИН"))
  for (const c of tableObjects(sql, "comments").sort((a, b) => String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")))) {
    const pt = postById.get(c.post_id) ?? "пост #" + c.post_id
    L.push(`До: «${pt}»`)
    L.push(asText(c.content))
    L.push("—".repeat(20))
  }

  // --- Магазин ---
  L.push(...sep("МАГАЗИН MINECRAFT — КАТЕГОРІЇ ПРЕДМЕТІВ"))
  for (const mc of tableObjects(sql, "minecraft_item_categories")) {
    L.push(`• ${asText(mc.name)}`)
  }
  L.push(...sep("МАГАЗИН — ПРЕДМЕТИ"))
  for (const it of tableObjects(sql, "minecraft_items")) {
    L.push(`${asText(it.name)}  |  ${it.price} ${asText(it.currency)}  |  магазин: ${asText(it.shop)}  |  id предмета: ${it.item_id}`)
  }

  // --- Зображення (назви) ---
  L.push(...sep("ФАЙЛИ ЗОБРАЖЕНЬ (назви для довідки)"))
  for (const im of tableObjects(sql, "images")) {
    L.push(`• ${asText(im.name)} → ${asText(im.file)}`)
  }

  L.push("", "=".repeat(76), "КІНЕЦЬ ФАЙЛУ", "=".repeat(76), "")

  fs.writeFileSync(OUT_PATH, L.join("\n"), "utf8")
  console.log("OK:", OUT_PATH, Math.round(fs.statSync(OUT_PATH).size / 1024), "КБ")
}

main()
