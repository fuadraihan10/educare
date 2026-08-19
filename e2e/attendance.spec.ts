import { test, expect, type Page } from '@playwright/test'

const admin = { email: 'admin@school.example', password: 'Admin@123' }

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(admin.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/admin$/, { timeout: 30_000 })
}

test.describe('attendance management', () => {
  test('loads attendance page with class selector', async ({ page }) => {
    await login(page)
    await page.goto('/admin/attendance')
    await expect(page.getByRole('heading', { name: 'Attendance' })).toBeVisible()
    await expect(page.locator('#classId')).toBeVisible()
  })

  test('loads roster and marks attendance for a class', async ({ page }) => {
    await login(page)
    await page.goto('/admin/attendance')

    const classValue = await page.locator('#classId').evaluate((el) => {
      const sel = el as HTMLSelectElement
      for (const opt of sel.options) {
        if (!opt.disabled && opt.value) return opt.value
      }
      return null
    })
    if (classValue) await page.locator('#classId').selectOption(classValue)

    await page.locator('#date').fill(new Date().toISOString().slice(0, 10))
    await page.getByRole('button', { name: 'Load' }).click()
    await expect(page.getByRole('button', { name: 'Save attendance' })).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: 'Save attendance' }).click()
    await expect(page.getByText(/Attendance saved/)).toBeVisible({ timeout: 30_000 })
  })

  test('student attendance page shows history', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('student1@school.example')
    await page.getByLabel('Password').fill('Student@123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/student$/, { timeout: 30_000 })
    await page.goto('/student/attendance')
    await expect(page.getByRole('heading', { name: 'My Attendance' })).toBeVisible({ timeout: 30_000 })
  })
})
