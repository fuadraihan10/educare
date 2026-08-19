import { test, expect, type Page } from '@playwright/test'

const admin = { email: 'admin@school.example', password: 'Admin@123' }
const student = { email: 'student1@school.example', password: 'Student@123' }

async function loginAdmin(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password').fill(admin.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/admin$/, { timeout: 30_000 })
}

async function loginStudent(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(student.email)
  await page.getByLabel('Password').fill(student.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/student$/, { timeout: 30_000 })
}

test.describe('announcements', () => {
  test('loads announcements page', async ({ page }) => {
    await loginAdmin(page)
    await page.goto('/admin/announcements')
    await expect(page.getByRole('heading', { name: 'Announcements' })).toBeVisible()
  })

  test('creates a new announcement', async ({ page }) => {
    await loginAdmin(page)
    await page.goto('/admin/announcements/new')
    await expect(page.getByRole('heading', { name: 'New announcement' })).toBeVisible()

    await page.locator('#title').fill('E2E Test Announcement')
    await page.locator('#body').fill('This is an automated test announcement for all students.')
    await page.locator('#audience').selectOption('STUDENT')
    await page.getByRole('button', { name: 'Publish announcement' }).click()
    await page.waitForURL(/\/admin\/announcements$/, { timeout: 30_000 })
    await expect(page.getByText('E2E Test Announcement').first()).toBeVisible({ timeout: 30_000 })
  })

  test('student sees announcements', async ({ page }) => {
    await loginStudent(page)
    await page.goto('/student/announcements')
    await expect(page.getByRole('heading', { name: 'Announcements' })).toBeVisible({ timeout: 15_000 })
  })
})
