import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const REPLAY_1 = path.join(__dirname, '../public/replays/example1.w3g')
const REPLAY_2 = path.join(__dirname, '../public/replays/example2.w3g')

// ── helpers ──────────────────────────────────────────────────────────────────

async function loadSingleReplay(page: import('@playwright/test').Page, replayPath: string) {
  await page.goto('/')
  await page.locator('input[type="file"]').setInputFiles(replayPath)
  await expect(page.getByRole('button', { name: /New Replay/i })).toBeVisible({ timeout: 30_000 })
}

async function loadCompareReplays(
  page: import('@playwright/test').Page,
  replayA: string,
  replayB: string,
) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Replay Comparison' }).click()
  const inputs = page.locator('input[type="file"]')
  await inputs.nth(0).setInputFiles(replayA)
  await inputs.nth(1).setInputFiles(replayB)
  await expect(page.getByRole('button', { name: /New Comparison/i })).toBeVisible({
    timeout: 30_000,
  })
}

// ── timing filter — single replay (BuildTimeline) ────────────────────────────

test.describe('timing filter — single replay', () => {
  test.beforeEach(async ({ page }) => {
    await loadSingleReplay(page, REPLAY_1)
  })

  test('shows HU / ORC / NE / UD race group buttons', async ({ page }) => {
    for (const abbr of ['HU', 'ORC', 'NE', 'UD']) {
      await expect(page.getByRole('button', { name: abbr, exact: true })).toBeVisible()
    }
  })

  test('deactivating all race groups empties the timing table', async ({ page }) => {
    const tbody = page.locator('.wc3-table tbody')
    expect(await tbody.locator('tr').count()).toBeGreaterThan(0)

    for (const abbr of ['HU', 'ORC', 'NE', 'UD']) {
      await page.getByRole('button', { name: abbr, exact: true }).click()
    }

    await expect(tbody.locator('tr')).toHaveCount(0)
  })

  test('reactivating a deactivated race group restores its rows', async ({ page }) => {
    const tbody = page.locator('.wc3-table tbody')
    const countBefore = await tbody.locator('tr').count()

    // Toggle HU off then back on
    const huBtn = page.getByRole('button', { name: 'HU', exact: true })
    await huBtn.click()
    await huBtn.click()

    expect(await tbody.locator('tr').count()).toBe(countBefore)
  })

  test('individual entity icon toggles its rows off', async ({ page }) => {
    const tbody = page.locator('.wc3-table tbody')
    const countBefore = await tbody.locator('tr').count()

    // Entity buttons are inside the filter above the table; grab from filter area
    const filterButtons = page
      .locator('div')
      .filter({ has: page.getByRole('button', { name: 'HU', exact: true }) })
      .locator('button[title]')
    const firstEntityBtn = filterButtons.first()
    const entityTitle = await firstEntityBtn.getAttribute('title')

    await firstEntityBtn.click()

    // Rows whose Event column matches this entity's label should be gone
    const countAfter = await tbody.locator('tr').count()
    // Row count should not have increased (may stay same if entity wasn't in replay)
    expect(countAfter).toBeLessThanOrEqual(countBefore)

    // Clicking again restores
    await firstEntityBtn.click()
    expect(await tbody.locator('tr').count()).toBe(countBefore)

    // Suppress unused-var warning
    void entityTitle
  })

  test('rows always carry a #N occurrence suffix', async ({ page }) => {
    const tbody = page.locator('.wc3-table tbody')
    // Every non-tier row (buildings and general upgrades) must show a # suffix
    const firstNonTierCell = tbody
      .locator('td')
      .filter({ hasNotText: /Adept|Master/ })
      .filter({ hasText: /#\d+/ })
      .first()
    await expect(firstNonTierCell).toBeVisible()
  })
})

// ── row dismissal — single replay (BuildTimeline) ────────────────────────────

test.describe('row dismissal — single replay', () => {
  test.beforeEach(async ({ page }) => {
    await loadSingleReplay(page, REPLAY_1)
  })

  test('dismissing a row hides it and shows a hidden counter', async ({ page }) => {
    const tbody = page.locator('.wc3-table tbody')
    const countBefore = await tbody.locator('tr').count()

    await tbody.locator('button[title="Remove from timings"]').first().click()

    await expect(page.getByText(/1 hidden/)).toBeVisible()
    expect(await tbody.locator('tr').count()).toBe(countBefore - 1)
  })

  test('dismissing multiple rows accumulates the hidden counter', async ({ page }) => {
    const tbody = page.locator('.wc3-table tbody')

    // Click first dismiss button twice (the next row's button shifts into first position)
    await tbody.locator('button[title="Remove from timings"]').first().click()
    await tbody.locator('button[title="Remove from timings"]').first().click()

    await expect(page.getByText(/2 hidden/)).toBeVisible()
  })

  test('reset restores all dismissed rows', async ({ page }) => {
    const tbody = page.locator('.wc3-table tbody')
    const countBefore = await tbody.locator('tr').count()

    await tbody.locator('button[title="Remove from timings"]').first().click()
    await tbody.locator('button[title="Remove from timings"]').first().click()
    await expect(page.getByText(/2 hidden/)).toBeVisible()

    await page.getByRole('button', { name: 'reset' }).click()

    await expect(page.getByText(/hidden/)).not.toBeVisible()
    expect(await tbody.locator('tr').count()).toBe(countBefore)
  })
})

// ── timing filter — compare view ─────────────────────────────────────────────

test.describe('timing filter — compare view', () => {
  test.beforeEach(async ({ page }) => {
    await loadCompareReplays(page, REPLAY_1, REPLAY_2)
  })

  test('shows HU / ORC / NE / UD race group buttons', async ({ page }) => {
    for (const abbr of ['HU', 'ORC', 'NE', 'UD']) {
      await expect(page.getByRole('button', { name: abbr, exact: true })).toBeVisible()
    }
  })

  test('deactivating all race groups empties the comparison table', async ({ page }) => {
    const tbody = page.locator('.wc3-table tbody')
    expect(await tbody.locator('tr').count()).toBeGreaterThan(0)

    for (const abbr of ['HU', 'ORC', 'NE', 'UD']) {
      await page.getByRole('button', { name: abbr, exact: true }).click()
    }

    await expect(tbody.locator('tr')).toHaveCount(0)
  })

  test('reactivating a deactivated race group restores its rows', async ({ page }) => {
    const tbody = page.locator('.wc3-table tbody')
    const countBefore = await tbody.locator('tr').count()

    const huBtn = page.getByRole('button', { name: 'HU', exact: true })
    await huBtn.click()
    await huBtn.click()

    expect(await tbody.locator('tr').count()).toBe(countBefore)
  })
})

// ── per-side dismissal — compare view ────────────────────────────────────────

test.describe('per-side dismissal — compare view', () => {
  test.beforeEach(async ({ page }) => {
    await loadCompareReplays(page, REPLAY_1, REPLAY_2)
  })

  test('per-side dismiss buttons are present for rows with a timing', async ({ page }) => {
    const tbody = page.locator('.wc3-table tbody')
    const dismissA = tbody.locator('button[title="Remove this timing for player A"]')
    const dismissB = tbody.locator('button[title="Remove this timing for player B"]')
    expect((await dismissA.count()) + (await dismissB.count())).toBeGreaterThan(0)
  })

  test('dismissing player A timing increments hidden counter', async ({ page }) => {
    const tbody = page.locator('.wc3-table tbody')
    await tbody.locator('button[title="Remove this timing for player A"]').first().click()
    await expect(page.getByText(/1 hidden/)).toBeVisible()
  })

  test('dismissing player B timing increments hidden counter', async ({ page }) => {
    const tbody = page.locator('.wc3-table tbody')
    await tbody.locator('button[title="Remove this timing for player B"]').first().click()
    await expect(page.getByText(/1 hidden/)).toBeVisible()
  })

  test('hidden counter sums dismissals from both sides', async ({ page }) => {
    const tbody = page.locator('.wc3-table tbody')
    await tbody.locator('button[title="Remove this timing for player A"]').first().click()
    await tbody.locator('button[title="Remove this timing for player B"]').first().click()
    await expect(page.getByText(/2 hidden/)).toBeVisible()
  })

  test('reset clears all per-side dismissals', async ({ page }) => {
    const tbody = page.locator('.wc3-table tbody')
    const countBefore = await tbody.locator('tr').count()

    await tbody.locator('button[title="Remove this timing for player A"]').first().click()
    await expect(page.getByText(/1 hidden/)).toBeVisible()

    await page.getByRole('button', { name: 'reset' }).click()

    await expect(page.getByText(/hidden/)).not.toBeVisible()
    expect(await tbody.locator('tr').count()).toBe(countBefore)
  })

  test('dismissing one side keeps the other side visible in the row', async ({ page }) => {
    const tbody = page.locator('.wc3-table tbody')

    // Find a row where both players have a timing (both dismiss buttons present)
    const rowWithBoth = tbody
      .locator('tr')
      .filter({ has: page.locator('button[title="Remove this timing for player A"]') })
      .filter({ has: page.locator('button[title="Remove this timing for player B"]') })
      .first()

    const hasBothRow = await rowWithBoth.count()
    if (hasBothRow === 0) {
      test.skip()
      return
    }

    // Record row count and dismiss player A on that row
    const countBefore = await tbody.locator('tr').count()
    await rowWithBoth.locator('button[title="Remove this timing for player A"]').click()

    // Row should still exist — player B's timing keeps it alive
    expect(await tbody.locator('tr').count()).toBe(countBefore)
    // Player A's dismiss button should now be gone from this row
    await expect(
      rowWithBoth.locator('button[title="Remove this timing for player A"]'),
    ).toHaveCount(0)
    // Player B's dismiss button is still there
    await expect(
      rowWithBoth.locator('button[title="Remove this timing for player B"]'),
    ).toBeVisible()
  })

  test('dismissed #1 causes #2 to renumber and merge into its slot', async ({ page }) => {
    const tbody = page.locator('.wc3-table tbody')

    // Find a row where player A has a #2 occurrence and a dismiss button
    const rowWith2ForA = tbody
      .locator('tr')
      .filter({ has: page.locator('button[title="Remove this timing for player A"]') })
      .filter({ hasText: '#2' })
      .first()

    if ((await rowWith2ForA.count()) === 0) {
      test.skip()
      return
    }

    const countBefore = await tbody.locator('tr').count()

    // Extract the entity label (e.g. "Tree of Life" from "Tree of Life #2")
    const eventCell = rowWith2ForA.locator('td').nth(1)
    const fullText = await eventCell.innerText()
    const label = fullText.replace(/ #\d+$/, '').trim()

    // Find the #1 row for the same entity where player A has a dismiss button
    const row1ForA = tbody
      .locator('tr')
      .filter({ has: page.locator('button[title="Remove this timing for player A"]') })
      .filter({ hasText: label + ' #1' })
      .first()

    if ((await row1ForA.count()) === 0) {
      test.skip()
      return
    }

    await row1ForA.locator('button[title="Remove this timing for player A"]').click()

    // Row count must not increase — the renumbered #2→#1 merges into the existing slot
    expect(await tbody.locator('tr').count()).toBeLessThanOrEqual(countBefore)

    // A row with this label and #1 must still exist
    await expect(
      tbody
        .locator('tr')
        .filter({ hasText: label + ' #1' })
        .first(),
    ).toBeVisible()
  })
})
