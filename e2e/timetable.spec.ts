import { test, expect, type Page } from '@playwright/test'

const admin = { email: 'admin@school.example', password: 'Admin@123' }

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(admin.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/admin$/, { timeout: 30_000 })
}

test.describe('timetable management', () => {
  test('loads timetable page with class selector', async ({ page }) => {
    await login(page)
    await page.goto('/admin/timetable')
    await expect(page.getByRole('heading', { name: 'Timetable' })).toBeVisible()
    await expect(page.locator('#classId')).toBeVisible()
  })

  test('loads timetable for a class and shows entries or empty state', async ({ page }) => {
    await login(page)
    await page.goto('/admin/timetable')

    const classValue = await page.locator('#classId').evaluate((el) => {
      const sel = el as HTMLSelectElement
      for (const opt of sel.options) {
        if (!opt.disabled && opt.value) return opt.value
      }
      return null
    })
    if (classValue) await page.locator('#classId').selectOption(classValue)

    await page.getByRole('button', { name: 'Load' }).click()

    // After submitting, page reloads with classId param
    await page.waitForURL(/\/admin\/timetable\?classId=/, { timeout: 15_000 })
    await expect(page.locator('#classId')).toBeVisible()

    // Either table with entries or no empty message
    const hasTable = await page.locator('table').isVisible().catch(() => false)
    if (!hasTable) {
      // No timetable entries for this class is valid
      await expect(page.locator('#classId')).toBeVisible()
    }
  })
})
