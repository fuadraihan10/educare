import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const admin = { email: 'admin@school.example', password: 'Admin@123' }
const fixture = (name: string) => path.join(process.cwd(), 'tests', 'fixtures', name)

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(admin.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/admin$/, { timeout: 30_000 })
}

test.describe('student management', () => {
  test('lists students with search and pagination', async ({ page }) => {
    await login(page)
    await page.goto('/admin/students')
    await expect(page.getByRole('heading', { name: 'Students' })).toBeVisible()
    await expect(page.getByText(/\d+ students enrolled/)).toBeVisible()
    await expect(page.getByRole('row')).toHaveCount(21) // header + 20 rows

    await page.getByPlaceholder(/Search by name/).fill('zzzz-no-match')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByText('No students found.')).toBeVisible()

    await page.getByPlaceholder(/Search by name/).fill('ADM-2026-0001')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByText('ADM-2026-0001')).toBeVisible()
  })

  test('creates a student with an auto-generated admission number', async ({ page }) => {
    await login(page)
    const stamp = Date.now()
    const firstName = `E2E${stamp}`

    await page.goto('/admin/students/new')
    await page.locator('#firstName').fill(firstName)
    await page.locator('#lastName').fill('Test')
    await page.locator('#dob').fill('2010-05-12')
    await page.locator('#gender').selectOption('FEMALE')
    await page.locator('#bloodGroup').fill('O+')
    await page.locator('#classId').selectOption({ label: 'Grade 6 A' })
    await page.locator('#guardianName').fill('Guardian E2E')
    await page.locator('#guardianRelation').fill('Mother')
    await page.locator('#guardianPhone').fill('+880 1700000000')

    await page.getByRole('button', { name: 'Create student' }).click()

    await page.waitForURL(/\/admin\/students\/[a-z0-9]{8,}$/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: new RegExp(`^${firstName} Test$`) })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/ADM-2026-\d{4}/)).toBeVisible()
    await expect(page.locator('p').filter({ hasText: /Grade 6 A · Roll/ })).toBeVisible()
  })

  test('edits a student and sees the update', async ({ page }) => {
    await login(page)
    await page.goto('/admin/students')

    const firstRow = page.getByRole('row').nth(1)
    const view = firstRow.getByRole('button', { name: 'View' })
    await view.click()

    await page.waitForURL(/\/admin\/students\/[a-z0-9]{8,}$/)
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.waitForURL(/\/edit$/)

    const stamp = `Upd${Date.now()}`
    await page.locator('#firstName').fill(stamp)
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.waitForURL(/\/admin\/students\/[a-z0-9]{8,}$/)
    await expect(page.getByRole('heading', { name: new RegExp(`^${stamp}`) })).toBeVisible()
  })

  test('uploads and deletes a document', async ({ page }) => {
    await login(page)
    await page.goto('/admin/students')
    await page.getByRole('row').nth(1).getByRole('button', { name: 'View' }).click()
    await page.waitForURL(/\/admin\/students\/[a-z0-9]{8,}$/)

    await page.locator('#upload-file').setInputFiles(fixture('document.pdf'))
    await page.getByRole('button', { name: 'Upload' }).click()

    await expect(page.getByText('document.pdf')).toBeVisible({ timeout: 15_000 })

    const row = page.getByText('document.pdf').locator('..').locator('..')
    await row.getByRole('button', { name: 'Delete file' }).click({ force: true })
    await expect(page.getByText('document.pdf')).toHaveCount(0, { timeout: 15_000 })
  })

  test('renders a printable ID card', async ({ page }) => {
    await login(page)
    await page.goto('/admin/students')
    await page.getByRole('row').nth(1).getByRole('button', { name: 'View' }).click()
    await page.waitForURL(/\/admin\/students\/[a-z0-9]{8,}$/)

    await page.getByRole('button', { name: 'ID card' }).click()
    await expect(page.getByText('Student Identity Card')).toBeVisible()
    await expect(page.getByRole('paragraph').filter({ hasText: 'Sunrise International School' })).toBeVisible()
    await expect(page.getByText(/ADM-2026-\d{4}/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Print card' })).toBeVisible()
  })
})
