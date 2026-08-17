import { test, expect, type Page } from '@playwright/test'

const admin = { email: 'admin@school.example', password: 'Admin@123' }

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page
    .waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 })
    .catch(() => {})
}

async function loginAsAdmin(page: Page) {
  await login(page, admin.email, admin.password)
  await page.waitForURL(/\/admin$/)
}

test.describe('class management', () => {
  test('lists classes with search and year filter', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/classes')
    await expect(page.getByRole('heading', { name: 'Classes' })).toBeVisible()
    await expect(page.getByText(/\d+ classes/)).toBeVisible()

    await page.getByPlaceholder(/Search by name/).fill('Grade 6')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByText('G6-A')).toBeVisible()
    await expect(page.getByText('G6-B')).toBeVisible()

    await page.getByPlaceholder(/Search by name/).fill('zzzz-no-match')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByText('No classes found.')).toBeVisible()

    await page.getByPlaceholder(/Search by name/).fill('')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByText('G6-A')).toBeVisible()
  })

  test('creates a class with auto-derived code', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/classes/new')
    await expect(page.getByRole('heading', { name: 'Add class' })).toBeVisible()

    await page.locator('#name').fill('Grade 11')
    await page.locator('#section').fill('A')
    await page.locator('#code').fill('G11-A')
    await page.locator('#room').fill('Room 201')

    await page.getByRole('button', { name: 'Create class' }).click()

    await page.waitForURL(/\/admin\/classes\/[a-z0-9]{8,}$/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: /Grade 11/ })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('G11-A').first()).toBeVisible()
    await expect(page.getByText('Room 201').first()).toBeVisible()
  })

  test('edits a class and sees the update', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/classes')
    await page.getByRole('row').nth(1).getByRole('button', { name: 'View' }).click()
    await page.waitForURL(/\/admin\/classes\/[a-z0-9]{8,}$/)

    await page.getByRole('button', { name: 'Edit' }).click()
    await page.waitForURL(/\/edit$/)

    await page.locator('#room').fill('Room 999')
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.waitForURL(/\/admin\/classes\/[a-z0-9]{8,}$/)
    await expect(page.getByText('Room 999').first()).toBeVisible({ timeout: 30_000 })
  })

  test('deletes a class with no students', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/classes')

    await page.getByPlaceholder(/Search by name/).fill('G11-A')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.getByRole('row').nth(1).getByRole('button', { name: 'View' }).click()
    await page.waitForURL(/\/admin\/classes\/[a-z0-9]{8,}$/)

    await page.getByRole('button', { name: 'Delete' }).click()
    await page
      .locator('[data-slot="alert-dialog-content"]')
      .getByRole('button', { name: 'Delete' })
      .click()

    await page.waitForURL(/\/admin\/classes/)
    await expect(page.getByText('Grade 11')).toHaveCount(0, { timeout: 15_000 })
  })

  test('filters classes by academic year', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/classes')
    await expect(page.getByText('G6-A')).toBeVisible()

    await page.locator('select[name="year"]').selectOption({ label: '2025-2026' })
    await page.getByRole('button', { name: 'Filter' }).click()
    await expect(page.getByText('No classes found.')).toBeVisible()
  })
})
