import { test, expect, type Page } from '@playwright/test'

const admin = { email: 'admin@school.example', password: 'Admin@123' }

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(admin.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/admin$/, { timeout: 30_000 })
}

test.describe('subject management', () => {
  test('lists subjects with search', async ({ page }) => {
    await login(page)
    await page.goto('/admin/subjects')
    await expect(page.getByRole('heading', { name: 'Subjects' })).toBeVisible()
    await expect(page.getByText(/\d+ subjects/)).toBeVisible()
    await expect(page.getByText('MATH').first()).toBeVisible()

    await page.getByPlaceholder(/Search by name/).fill('MATH')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByText('Mathematics')).toBeVisible()

    await page.getByPlaceholder(/Search by name/).fill('zzzz')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByText('No subjects found.')).toBeVisible()
  })

  test('creates, edits, and deletes a subject', async ({ page }) => {
    await login(page)
    const stamp = `S${Date.now()}`
    await page.goto('/admin/subjects/new')
    await page.locator('#name').fill(`E2E ${stamp}`)
    await page.locator('#code').fill(stamp)
    await page.locator('#description').fill('Created by e2e')
    await page.getByRole('button', { name: 'Create subject' }).click()

    await page.waitForURL(/\/admin\/subjects\/[a-z0-9]{8,}$/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: new RegExp(`E2E ${stamp}`) })).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: 'Edit' }).click()
    await page.waitForURL(/\/edit$/)
    await page.locator('#name').fill(`E2E ${stamp} Upd`)
    await page.getByRole('button', { name: 'Save changes' }).click()
    await page.waitForURL(/\/admin\/subjects\/[a-z0-9]{8,}$/)
    await expect(page.getByRole('heading', { name: new RegExp(`E2E ${stamp} Upd`) })).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: 'Delete' }).click()
    await page.locator('[data-slot="alert-dialog-content"]').getByRole('button', { name: 'Delete' }).click()
    await page.waitForURL(/\/admin\/subjects$/)
    await expect(page.getByText(`E2E ${stamp} Upd`).first()).toHaveCount(0, { timeout: 15_000 })
  })

  test('lists teaching assignments', async ({ page }) => {
    await login(page)
    await page.goto('/admin/subjects/assignments')
    await expect(page.getByRole('heading', { name: 'Teaching assignments' })).toBeVisible()
    await expect(page.getByText(/\d+ assignments/)).toBeVisible()
  })

  test('loads the assignment list and creation form', async ({ page }) => {
    await login(page)
    await page.goto('/admin/subjects/assignments')
    await expect(page.getByRole('heading', { name: 'Teaching assignments' })).toBeVisible()
    await expect(page.getByText(/\d+ assignments/)).toBeVisible()

    await page.goto('/admin/subjects/assignments/new')
    await expect(page.getByRole('heading', { name: 'Add teaching assignment' })).toBeVisible()
    await expect(page.locator('#classId')).toBeVisible()
    await expect(page.locator('#subjectId')).toBeVisible()
  })
})
