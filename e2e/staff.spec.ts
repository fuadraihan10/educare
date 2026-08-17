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

async function openFirstStaff(page: Page) {
  await page.goto('/admin/staff')
  await page.getByRole('row').nth(1).getByRole('button', { name: 'View' }).click()
  await page.waitForURL(/\/admin\/staff\/[a-z0-9]{8,}$/)
}

test.describe('staff management', () => {
  test('lists teachers with search', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/staff')
    await expect(page.getByRole('heading', { name: 'Staff' })).toBeVisible()
    await expect(page.getByText(/\d+ teacher/)).toBeVisible()

    await page.getByPlaceholder(/Search by name/).fill('EMP-001')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByText('Mr. Teacher 1')).toBeVisible()

    await page.getByPlaceholder(/Search by name/).fill('zzzz-no-match')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByText('No teachers found.')).toBeVisible()
  })

  test('creates a teacher with an employee ID and login account', async ({ page }) => {
    await loginAsAdmin(page)
    const stamp = Date.now()
    const email = `staff${stamp}@example.com`

    await page.goto('/admin/staff/new')
    await page.locator('#name').fill(`E2E Teacher ${stamp}`)
    await page.locator('#email').fill(email)
    await page.locator('#phone').fill('+880 1700000000')
    await page.locator('#designation').fill('Senior Teacher')
    await page.locator('#specialization').fill('Mathematics')
    await page.locator('#password').fill('TempPass@123')

    await page.getByRole('button', { name: 'Create teacher' }).click()

    await page.waitForURL(/\/admin\/staff\/[a-z0-9]{8,}$/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: new RegExp(`^E2E Teacher ${stamp}$`) })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/EMP-\d{3}/).first()).toBeVisible()
    await expect(page.getByText('Login account')).toBeVisible()
    await expect(page.getByText(email).first()).toBeVisible()

    await page.goto('/admin/staff')
    await page.getByPlaceholder(/Search by name/).fill(email)
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByText(`E2E Teacher ${stamp}`)).toBeVisible()
  })

  test('edits a teacher and sees the update', async ({ page }) => {
    await loginAsAdmin(page)
    await openFirstStaff(page)

    await page.getByRole('button', { name: 'Edit' }).click()
    await page.waitForURL(/\/edit$/)

    const stamp = `Upd${Date.now()}`
    await page.locator('#name').fill(stamp)
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.waitForURL(/\/admin\/staff\/[a-z0-9]{8,}$/)
    await expect(page.getByRole('heading', { name: new RegExp(`^${stamp}$`) })).toBeVisible({ timeout: 30_000 })
  })

  test('teacher sees only their own profile and cannot enter the admin area', async ({ page }) => {
    await login(page, 'teacher1@school.example', 'Teacher@123')
    await page.waitForURL(/\/teacher$/)

    await page.goto('/teacher/profile')
    await expect(page.getByRole('heading', { name: 'Mr. Teacher 1' })).toBeVisible()
    await expect(page.getByText('EMP-001').first()).toBeVisible()

    await page.goto('/admin/staff')
    await page.waitForURL(/\/teacher$/)
  })

  test('deactivates and reactivates a teacher', async ({ page }) => {
    await loginAsAdmin(page)
    await openFirstStaff(page)

    await page.getByRole('button', { name: 'Deactivate' }).click()
    await page
      .locator('[data-slot="alert-dialog-content"]')
      .getByRole('button', { name: 'Deactivate' })
      .click()
    await expect(page.getByText('INACTIVE').first()).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: 'Reactivate' }).click()
    await expect(page.getByText('ACTIVE').first()).toBeVisible({ timeout: 15_000 })
  })
})
