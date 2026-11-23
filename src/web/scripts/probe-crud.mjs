import { chromium } from 'playwright'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })
const log = (...a) => console.log(...a)
const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message))

await page.goto('http://localhost:3000/login')
await page.getByLabel('Username').fill('super-admin')
await page.getByLabel('Password').fill('super-admin')
await page.getByRole('button', { name: 'Sign In' }).click()
await page.waitForTimeout(2500)

// churches buttons
await page.goto('http://localhost:3000/churches')
await page.waitForTimeout(1500)
log('CHURCH buttons:', JSON.stringify(await page.locator('button').evaluateAll(els => els.map(e => ({ text: e.innerText?.trim(), tip: e.getAttribute('data-tooltip'), title: e.getAttribute('title'), cls: e.className }))), null, 2))

// create church
await page.getByRole('button', { name: 'Create Church' }).click()
await page.waitForTimeout(500)
const dlg = page.locator('.mf-dialog')
const name = 'QA Church ' + Date.now().toString().slice(-6)
await dlg.locator('input.mf-input').first().fill(name)
await dlg.locator('textarea.mf-input').first().fill('12 QA Street')
await dlg.getByRole('button', { name: /Save/i }).click()
await page.waitForTimeout(2000)
log('AFTER CHURCH CREATE body has name:', (await page.locator('body').innerText()).includes(name))
log('toast:', await page.locator('.swal2-popup, [role=alert], .Toastify__toast').allTextContents().catch(() => []))
log('body churches:', (await page.locator('body').innerText()).slice(0, 2500))
log('URL', page.url())

// get church id by card, click view
const card = page.locator('.church-card, .settings-card, [class*=card]').filter({ hasText: name }).first()
log('card count', await page.locator('[class*=card]').filter({ hasText: name }).count())
const cardAll = page.locator('*').filter({ hasText: name })
log('any matching count', await cardAll.count())
// locate closest card
const textNode = page.getByText(name).first()
log('name visible', await textNode.isVisible().catch(() => false))
let cardHtml = ''
try {
  const box = await textNode.evaluateHandle(el => el.closest('[class*=card], .settings-card, .church-card'))
  cardHtml = await box.evaluate(el => el ? el.outerHTML : 'null')
} catch (e) { cardHtml = 'ERR ' + e.message }
log('CARD HTML:', cardHtml.slice(0, 1500))

// announcements
await page.goto('http://localhost:3000/announcements')
await page.waitForTimeout(1500)
log('ANN buttons:', JSON.stringify(await page.locator('button').evaluateAll(els => els.map(e => ({ text: e.innerText?.trim(), tip: e.getAttribute('data-tooltip'), title: e.getAttribute('title'), cls: e.className }))), null, 2))
await page.getByRole('button', { name: 'New Announcement' }).click()
await page.waitForTimeout(500)
const adlg = page.locator('.mf-dialog')
const title = 'QA Announcement ' + Date.now().toString().slice(-6)
await adlg.locator('#ann-title').fill(title)
await adlg.locator('#ann-content').fill('This is an automated QA announcement body.')
await adlg.getByRole('button', { name: /Save/i }).click()
await page.waitForTimeout(2500)
log('AFTER ANN CREATE has title:', (await page.locator('body').innerText()).includes(title))
log('ann body:', (await page.locator('body').innerText()).slice(0, 3000))
log('ANN buttons after:', JSON.stringify(await page.locator('button').evaluateAll(els => els.map(e => ({ text: e.innerText?.trim(), tip: e.getAttribute('data-tooltip'), title: e.getAttribute('title'), cls: e.className }))), null, 2))
await page.screenshot({ path: 'scripts/shot-ann-after.png', fullPage: true })
log('ERRORS', errors)
await browser.close()
