import { test, expect, type Page } from '@playwright/test'

const admin = { email: 'admin@school.example', password: 'Admin@123' }

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(admin.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/admin$/, { timeout: 30_000 })
}

test.describe('analytics dashboard', () => {
  test('loads analytics page with stat cards', async ({ page }) => {
    await login(page)
    await page.goto('/admin/analytics')
    await expect(page.getByRole('heading', { name: 'Analytics Dashboard' })).toBeVisible()
    await expect(page.getByText('Active Students')).toBeVisible()
    await expect(page.getByText('Attendance Rate')).toBeVisible()
  })
})
