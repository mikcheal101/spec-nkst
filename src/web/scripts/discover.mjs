import { chromium } from 'playwright'
import fs from 'node:fs'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const out = []

page.on('console', (m) => {
  if (m.type() === 'error') out.push({ type: 'console', text: m.text() })
})

await page.goto('http://localhost:3000/login')
await page.getByLabel('Username').fill('super-admin')
await page.getByLabel('Password').fill('super-admin')
await page.getByRole('button', { name: 'Sign In' }).click()
await page.waitForURL(/\/dashboard/, { timeout: 15000 })
await page.waitForTimeout(2500)
await page.waitForLoadState('networkidle').catch(() => {})

const routes = ['/dashboard', '/members', '/churches', '/pastors', '/elders', '/deacons', '/contributions', '/projects', '/announcements', '/notifications', '/settings', '/admins', '/profile']
const results = []
for (const route of routes) {
  await page.goto('http://localhost:3000' + route)
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(500)
  const heading = await page.locator('h1,h2,.page-title').first().textContent().catch(() => null)
  const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 3000)
  const buttons = await page.locator('button').allTextContents().catch(() => [])
  const links = await page.locator('a').evaluateAll((els) => els.map((e) => ({ text: e.textContent?.trim(), href: e.getAttribute('href') }))).catch(() => [])
  const inputs = await page.locator('input,select,textarea').evaluateAll((els) => els.map((e) => ({ tag: e.tagName, type: e.getAttribute('type'), id: e.id, name: e.getAttribute('name'), placeholder: e.getAttribute('placeholder'), label: e.labels?.[0]?.textContent?.trim() }))).catch(() => [])
  results.push({ route, url: page.url(), heading, buttons, links: links.slice(0, 30), inputs, body })
}
fs.writeFileSync('scripts/discover-out.json', JSON.stringify({ results, out }, null, 2))
console.log(JSON.stringify(results.map(r => ({ route: r.route, url: r.url, heading: r.heading, buttons: r.buttons, inputs: r.inputs.map(i => i.label || i.placeholder || i.name || i.id) })), null, 2))
await browser.close()
