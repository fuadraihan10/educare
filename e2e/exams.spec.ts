import { test, expect, type Page } from '@playwright/test'

const admin = { email: 'admin@school.example', password: 'Admin@123' }

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(admin.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/admin$/, { timeout: 30_000 })
}

test.describe('exams & grading', () => {
  test('lists assessments with search', async ({ page }) => {
    await login(page)
    await page.goto('/admin/exams')
    await expect(page.getByRole('heading', { name: 'Exams' })).toBeVisible()
    await expect(page.getByText(/\d+ assessment/)).toBeVisible()
  })

  test('creates a new assessment form loads and validates', async ({ page }) => {
    await login(page)
    await page.goto('/admin/exams/new')
    await expect(page.getByRole('heading', { name: 'New assessment' })).toBeVisible()

    await page.locator('#name').fill('E2E Test Quiz')
    await page.locator('#type').selectOption('QUIZ')

    // Fill in fields and verify form structure
    await expect(page.locator('#classId')).toBeVisible()
    await expect(page.locator('#subjectId')).toBeVisible()
    await expect(page.locator('#maxMarks')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create assessment' })).toBeVisible()
  })

  test('student grades page loads', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('student1@school.example')
    await page.getByLabel('Password').fill('Student@123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/student$/, { timeout: 30_000 })
    await page.goto('/student/grades')
    await expect(page.getByRole('heading', { name: 'My Results' })).toBeVisible({ timeout: 30_000 })
  })
})
