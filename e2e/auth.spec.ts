import { test, expect, type Page } from '@playwright/test'

const admin = { email: 'admin@school.example', password: 'Admin@123' }
const teacher = { email: 'teacher1@school.example', password: 'Teacher@123' }
const student = { email: 'student1@school.example', password: 'Student@123' }
const parent = { email: 'parent1@school.example', password: 'Parent@123' }

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page
    .waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 })
    .catch(() => {})
}

async function expectRoleUrl(page: Page, regex: RegExp) {
  await expect(page).toHaveURL(regex, { timeout: 30_000 })
}

test.describe('authentication', () => {
  test('admin signs in and lands on the admin dashboard', async ({ page }) => {
    await login(page, admin.email, admin.password)
    await expectRoleUrl(page, /\/admin$/)
    await expect(page.getByText('School overview at a glance.')).toBeVisible()
  })

  test('teacher signs in and lands on the teacher dashboard', async ({ page }) => {
    await login(page, teacher.email, teacher.password)
    await expectRoleUrl(page, /\/teacher$/)
    await expect(page.getByText('My classes')).toBeVisible()
  })

  test('student signs in and lands on the student dashboard', async ({ page }) => {
    await login(page, student.email, student.password)
    await expectRoleUrl(page, /\/student$/)
    await expect(page.getByText(/Roll \d/)).toBeVisible()
  })

  test('parent signs in and sees their linked child', async ({ page }) => {
    await login(page, parent.email, parent.password)
    await expectRoleUrl(page, /\/parent$/)
    await expect(page.getByRole('heading', { name: /Welcome,/ })).toBeVisible()
    await expect(page.getByText(/Roll \d/)).toBeVisible()
  })

  test('rejects a wrong password', async ({ page }) => {
    await login(page, admin.email, 'wrong-password')
    await expect(page.getByText(/Invalid email or password/)).toBeVisible()
    await expectRoleUrl(page, /\/login/)
  })

  test('redirects a logged-in teacher away from the admin area', async ({ page }) => {
    await login(page, teacher.email, teacher.password)
    await page.goto('/admin')
    await expectRoleUrl(page, /\/teacher$/)
  })

  test('signs out back to the login page', async ({ page }) => {
    await login(page, admin.email, admin.password)
    await expectRoleUrl(page, /\/admin$/)
    await page.getByText(admin.email).first().click()
    await page.getByRole('menuitem', { name: /Sign out/ }).click()
    await expectRoleUrl(page, /\/login/)
  })

  test('an unauthenticated user is sent to the login page', async ({ page }) => {
    await page.goto('/admin')
    await expectRoleUrl(page, /\/login\?callbackUrl=%2Fadmin/)
  })
})
