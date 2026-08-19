import { test, expect, type Page } from '@playwright/test'

const admin = { email: 'admin@school.example', password: 'Admin@123' }

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(admin.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/admin$/, { timeout: 30_000 })
}

test.describe('admission management', () => {
  test('lists applications with search and status filter', async ({ page }) => {
    await login(page)
    await page.goto('/admin/admissions')
    await expect(page.getByRole('heading', { name: 'Admissions' })).toBeVisible()
    await expect(page.getByText(/\d+ application/)).toBeVisible()

    await page.getByPlaceholder(/Search by name/).fill('zzzz-no-match')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByText('No applications found.')).toBeVisible()
  })

  test('submits a new admission application', async ({ page }) => {
    await login(page)
    await page.goto('/admin/admissions/new')
    await expect(page.getByRole('heading', { name: 'New admission application' })).toBeVisible()

    await page.locator('#applicantName').fill('E2E Test Student')
    await page.locator('#dob').fill('2015-03-15')
    await page.locator('#gender').selectOption('MALE')
    await page.locator('#phone').fill('+880 1712345678')
    await page.locator('#guardianName').fill('E2E Guardian')
    await page.locator('#guardianRelation').fill('Father')
    await page.locator('#guardianPhone').fill('+880 1812345678')
    await page.locator('#appliedClassId').selectOption({ index: 1 })
    await page.getByRole('button', { name: 'Submit application' }).click()

    await page.waitForURL(/\/admin\/admissions\/[a-z0-9]{8,}$/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: 'E2E Test Student' })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('PENDING')).toBeVisible()
  })

  test('approves an application and creates student + enrollment', async ({ page }) => {
    await login(page)
    await page.goto('/admin/admissions/new')

    const stamp = Date.now()
    await page.locator('#applicantName').fill(`Approve Test ${stamp}`)
    await page.locator('#dob').fill('2014-06-20')
    await page.locator('#gender').selectOption('FEMALE')
    await page.locator('#phone').fill('+880 1712345699')
    await page.locator('#guardianName').fill('Guardian Approve')
    await page.locator('#guardianRelation').fill('Mother')
    await page.locator('#guardianPhone').fill('+880 1812345699')
    await page.locator('#appliedClassId').selectOption({ index: 1 })
    await page.getByRole('button', { name: 'Submit application' }).click()

    await page.waitForURL(/\/admin\/admissions\/[a-z0-9]{8,}$/, { timeout: 30_000 })
    await expect(page.getByText('PENDING')).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: 'Approve' }).click()
    await page.waitForURL(/\/admin\/admissions\/[a-z0-9]{8,}$/, { timeout: 30_000 })
    await expect(page.getByText('APPROVED')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('View student record')).toBeVisible()
  })

  test('rejects an application with remarks', async ({ page }) => {
    await login(page)
    await page.goto('/admin/admissions/new')

    const stamp = Date.now()
    await page.locator('#applicantName').fill(`Reject Test ${stamp}`)
    await page.locator('#dob').fill('2016-01-10')
    await page.locator('#gender').selectOption('MALE')
    await page.locator('#phone').fill('+880 1712345688')
    await page.locator('#guardianName').fill('Guardian Reject')
    await page.locator('#guardianRelation').fill('Father')
    await page.locator('#guardianPhone').fill('+880 1812345688')
    await page.locator('#appliedClassId').selectOption({ index: 1 })
    await page.getByRole('button', { name: 'Submit application' }).click()

    await page.waitForURL(/\/admin\/admissions\/[a-z0-9]{8,}$/, { timeout: 30_000 })
    await expect(page.getByText('PENDING')).toBeVisible({ timeout: 30_000 })

    await page.locator('#remarks').fill('Incomplete documentation')
    await page.getByRole('button', { name: 'Reject' }).click()
    await page.waitForURL(/\/admin\/admissions\/[a-z0-9]{8,}$/, { timeout: 30_000 })
    await expect(page.getByText('REJECTED')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Incomplete documentation')).toBeVisible()
  })
})
