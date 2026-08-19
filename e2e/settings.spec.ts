import { test, expect, type Page } from '@playwright/test'

const admin = { email: 'admin@school.example', password: 'Admin@123' }

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(admin.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/admin$/, { timeout: 30_000 })
}

test.describe('settings', () => {
  test('loads settings page with school profile form', async ({ page }) => {
    await login(page)
    await page.goto('/admin/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect(page.getByText('School Profile', { exact: true })).toBeVisible()
    await expect(page.getByText('Academic Years & Terms', { exact: true })).toBeVisible()
    await expect(page.getByText('Grade Scale', { exact: true })).toBeVisible()
  })

  test('updates school profile', async ({ page }) => {
    await login(page)
    await page.goto('/admin/settings')
    await page.locator('#name').fill('E2E Updated School')
    await page.getByRole('button', { name: 'Save school profile' }).click()
    await expect(page.getByText('School profile updated.')).toBeVisible({ timeout: 15_000 })
  })
})
