import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test('parses an example replay uploaded via file input', async ({ page }) => {
  await page.goto('/')

  // Upload the example replay file directly via the hidden file input
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(path.join(__dirname, '../public/replays/example1.w3g'))

  // Wait for parsing to finish — the results header appears
  await expect(page.getByRole('button', { name: /PARSE ANOTHER REPLAY/ })).toBeVisible({
    timeout: 30_000,
  })

  // No error should be shown
  await expect(page.locator('text=ERROR')).not.toBeVisible()

  // At least one player card with APM should be visible
  await expect(page.getByText('APM').first()).toBeVisible()

  // Section labels inside the results area (.fade-up) should be present
  await expect(page.locator('.fade-up .section-label').first()).toBeVisible()
})

test('finds a W3C player via autocomplete, downloads their replay, and parses it', async ({
  page,
}) => {
  await page.goto('/')

  // Switch to the W3Champions tab — this triggers the top players API fetch (3 leagues)
  await page.getByRole('button', { name: 'W3CHAMPIONS' }).click()

  // fetchTopPlayerTags uses Promise.all over leagues 0–2; wait for all three
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/ladder/0') && r.ok(), { timeout: 20_000 }),
    page.waitForResponse((r) => r.url().includes('/ladder/1') && r.ok(), { timeout: 20_000 }),
    page.waitForResponse((r) => r.url().includes('/ladder/2') && r.ok(), { timeout: 20_000 }),
  ])

  const searchInput = page.getByPlaceholder(/BattleTag/)
  await searchInput.fill('a')

  // Verify at least one suggestion discriminator (#digits) is visible in the dropdown
  await expect(page.getByText(/#\d+/).first()).toBeVisible({ timeout: 5_000 })

  // Select the first suggestion via keyboard
  await searchInput.press('ArrowDown')
  await searchInput.press('Enter')

  // Search for the selected player
  await page.getByRole('button', { name: 'SEARCH' }).click()

  // Wait for at least one match row (W or L badge) to appear
  const firstBadge = page.getByText(/^W$|^L$/).first()
  await expect(firstBadge).toBeVisible({ timeout: 30_000 })

  // Click the first match row to download and parse the replay
  await firstBadge.click()

  // Wait for parsing to finish
  await expect(page.getByRole('button', { name: /PARSE ANOTHER REPLAY/ })).toBeVisible({
    timeout: 30_000,
  })

  // No error should be shown
  await expect(page.locator('text=ERROR')).not.toBeVisible()

  // At least one player card with APM should be visible
  await expect(page.getByText('APM').first()).toBeVisible()
})
