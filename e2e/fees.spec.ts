import { test, expect, type Page } from '@playwright/test'

const admin = { email: 'admin@school.example', password: 'Admin@123' }

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(admin.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/admin$/, { timeout: 30_000 })
}

test.describe('fee management', () => {
  test('loads invoice list page', async ({ page }) => {
    await login(page)
    await page.goto('/admin/fees')
    await expect(page.getByRole('heading', { name: 'Fee Management' })).toBeVisible()
    await expect(page.getByText(/\d+ invoice/)).toBeVisible()
  })

  test('creates a new invoice', async ({ page }) => {
    await login(page)
    await page.goto('/admin/fees/new')
    await expect(page.getByRole('heading', { name: 'New invoice' })).toBeVisible()

    // Get first enabled option value via evaluate
    const studentValue = await page.locator('#studentId').evaluate((el) => {
      const sel = el as HTMLSelectElement
      for (const opt of sel.options) {
        if (!opt.disabled && opt.value) return opt.value
      }
      return null
    })
    if (studentValue) await page.locator('#studentId').selectOption(studentValue)

    const termValue = await page.locator('#termId').evaluate((el) => {
      const sel = el as HTMLSelectElement
      for (const opt of sel.options) {
        if (!opt.disabled && opt.value) return opt.value
      }
      return null
    })
    if (termValue) await page.locator('#termId').selectOption(termValue)

    await page.getByRole('button', { name: 'Create invoice' }).click()
    await page.waitForURL(/\/admin\/fees\/[a-z0-9]{8,}$/, { timeout: 30_000 })
    await expect(page.getByText(/INV-/).first()).toBeVisible({ timeout: 30_000 })
  })

  test('views an existing invoice detail', async ({ page }) => {
    await login(page)
    await page.goto('/admin/fees')
    await page.getByRole('button', { name: 'View' }).first().click()
    await expect(page.getByText(/INV-/).first()).toBeVisible({ timeout: 15_000 })
  })
})
