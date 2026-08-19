import { test, expect, type Page } from '@playwright/test'

const admin = { email: 'admin@school.example', password: 'Admin@123' }

async function login(page: Page, email: string = admin.email, password: string = admin.password) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 })
}

test.describe('authentication', () => {
  test('admin signs in and lands on the admin dashboard', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible()
  })

  test('teacher signs in and lands on the teacher dashboard', async ({ page }) => {
    await login(page, 'teacher1@school.example', 'Teacher@123')
    await expect(page).toHaveURL(/\/teacher$/, { timeout: 30_000 })
    await expect(page.getByText('My classes')).toBeVisible()
  })

  test('student signs in and lands on the student dashboard', async ({ page }) => {
    await login(page, 'student1@school.example', 'Student@123')
    await expect(page).toHaveURL(/\/student$/, { timeout: 30_000 })
  })

  test('parent signs in and sees their linked child', async ({ page }) => {
    await login(page, 'parent1@school.example', 'Parent@123')
    await expect(page).toHaveURL(/\/parent$/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: /Welcome,/ })).toBeVisible()
  })

  test('rejects a wrong password', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(admin.email)
    await page.getByLabel('Password').fill('wrong-password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText(/Invalid email or password/)).toBeVisible({ timeout: 30_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirects a logged-in teacher away from the admin area', async ({ page }) => {
    await login(page, 'teacher1@school.example', 'Teacher@123')
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/teacher$/, { timeout: 30_000 })
  })

  test('signs out back to the login page', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 })

    // Get CSRF token via API
    const csrfRes = await (await page.request.get('http://localhost:3000/api/auth/csrf')).json()

    // Inject a form and submit it — this is a real full-page navigation
    // that properly processes Set-Cookie headers (unlike fetch)
    await page.evaluate((token: string) => {
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = '/api/auth/signout'
      form.innerHTML = `
        <input type="hidden" name="csrfToken" value="${token}" />
        <input type="hidden" name="callbackUrl" value="/login" />
      `
      document.body.appendChild(form)
      form.submit()
    }, csrfRes.csrfToken)

    await page.waitForURL(/\/login/, { timeout: 30_000 })
    await expect(page.getByLabel('Email')).toBeVisible()
  })

  test('an unauthenticated user is sent to the login page', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
  })
})
