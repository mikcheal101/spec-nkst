import { chromium } from 'playwright'
import fs from 'node:fs'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })
const log = (...a) => console.log(...a)

await page.goto('http://localhost:3000/login')
await page.getByLabel('Username').fill('super-admin')
await page.getByLabel('Password').fill('super-admin')
await page.getByRole('button', { name: 'Sign In' }).click()
await page.waitForTimeout(2500)

async function dumpDialog(after, fileSuffix) {
  const dialogs = page.locator('[role="dialog"], .mf-dialog, .modal, .modal-content, .swal2-popup')
  const n = await dialogs.count()
  log(`\n##### ${fileSuffix}: dialogs=${n}`)
  for (let i = 0; i < n; i++) {
    if (await dialogs.nth(i).isVisible()) {
      const text = await dialogs.nth(i).innerText().catch(() => '')
      const labels = await dialogs.nth(i).locator('label').allTextContents().catch(() => [])
      const buttons = await dialogs.nth(i).locator('button').allTextContents().catch(() => [])
      const inputs = await dialogs.nth(i).locator('input,select,textarea').evaluateAll(els => els.map(e => ({ tag: e.tagName, type: e.getAttribute('type'), id: e.id, name: e.getAttribute('name'), placeholder: e.getAttribute('placeholder'), label: e.labels?.[0]?.textContent?.trim(), value: e.value }))).catch(() => [])
      log('TEXT:', text.slice(0, 2500))
      log('LABELS:', JSON.stringify(labels))
      log('BUTTONS:', JSON.stringify(buttons))
      log('INPUTS:', JSON.stringify(inputs, null, 2))
      await page.screenshot({ path: `scripts/shot-${fileSuffix}.png`, fullPage: true })
      const html = await dialogs.nth(i).innerHTML()
      fs.writeFileSync(`scripts/dialog-${fileSuffix}.html`, html)
    }
  }
}

// Church create
await page.goto('http://localhost:3000/churches')
await page.waitForTimeout(1500)
log('\nCHURCHES BODY\n', (await page.locator('body').innerText()).slice(0, 2000))
await page.getByRole('button', { name: 'Create Church' }).click()
await page.waitForTimeout(800)
await dumpDialog('church', 'church-create')
await page.keyboard.press('Escape')
await page.waitForTimeout(500)

// member create
await page.goto('http://localhost:3000/members')
await page.waitForTimeout(1500)
await page.getByRole('button', { name: 'Add Member' }).click()
await page.waitForTimeout(800)
await dumpDialog('member', 'member-create')
// toggle baptized
const cb = page.locator('.mf-dialog .mf-toggle').first()
if (await cb.count()) { if (!(await page.locator('.mf-dialog input[type="checkbox"]').first().isChecked())) await cb.click(); await page.waitForTimeout(500); await dumpDialog('member', 'member-create-baptised') }
await page.keyboard.press('Escape')
await page.waitForTimeout(500)

// announcement create
await page.goto('http://localhost:3000/announcements')
await page.waitForTimeout(1500)
await page.getByRole('button', { name: 'New Announcement' }).click()
await page.waitForTimeout(800)
await dumpDialog('ann', 'ann-create')
await page.keyboard.press('Escape')
await page.waitForTimeout(500)

// settings role edit
await page.goto('http://localhost:3000/settings')
await page.waitForTimeout(2000)
log('\nSETTINGS initial body\n', (await page.locator('body').innerText()).slice(0, 3000))
const editBtns = page.locator('button').filter({ has: page.locator('svg') })
log('button count', await page.locator('button').count())
const btns = await page.locator('button').evaluateAll(els => els.map((e, i) => ({ i, text: e.innerText?.trim(), title: e.getAttribute('title'), tooltip: e.getAttribute('data-tooltip'), aria: e.getAttribute('aria-label'), cls: e.className })))
fs.writeFileSync('scripts/settings-buttons.json', JSON.stringify(btns, null, 2))
log('buttons', JSON.stringify(btns.slice(0, 60), null, 2))

// profile tabs
await page.goto('http://localhost:3000/profile')
await page.waitForTimeout(1500)
log('\nPROFILE BODY\n', (await page.locator('body').innerText()).slice(0, 2500))
const tabs = await page.locator('button').evaluateAll(els => els.map((e, i) => ({ i, text: e.innerText?.trim(), cls: e.className })))
log('profile buttons', JSON.stringify(tabs, null, 2))
await page.getByRole('button', { name: 'Security' }).click()
await page.waitForTimeout(500)
log('\nSECURITY TAB\n', (await page.locator('body').innerText()).slice(0, 2500))
await page.screenshot({ path: 'scripts/shot-profile-security.png', fullPage: true })

// church detail
await page.goto('http://localhost:3000/churches')
await page.waitForTimeout(1200)
await page.getByRole('button', { name: 'View' }).first().click()
await page.waitForTimeout(1500)
log('\nCHURCH DETAIL URL', page.url())
log((await page.locator('body').innerText()).slice(0, 3000))
await page.screenshot({ path: 'scripts/shot-church-detail.png', fullPage: true })

// member detail
await page.goto('http://localhost:3000/members')
await page.waitForTimeout(1500)
await page.locator('table tbody tr').first().click()
await page.waitForTimeout(1500)
log('\nMEMBER DETAIL URL', page.url())
log((await page.locator('body').innerText()).slice(0, 3000))
await page.screenshot({ path: 'scripts/shot-member-detail.png', fullPage: true })

await browser.close()
