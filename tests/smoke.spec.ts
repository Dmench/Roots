import { test, expect } from '@playwright/test'

// One smoke test exercising the public surface — does not require a test user.
// Asserts: homepage renders, public legal pages render, and the auth gate engages
// on a city route. If any of these fail the deployment is broken in an obvious way.

test('homepage renders with brand and CTA into Brussels', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Roots/)
  await expect(page.locator('body')).toContainText(/Brussels/i)
})

test('privacy page renders with GDPR-required sections', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page).toHaveTitle(/Privacy/)
  await expect(page.locator('body')).toContainText(/data controller/i)
  await expect(page.locator('body')).toContainText(/GDPR/i)
})

test('terms page renders', async ({ page }) => {
  await page.goto('/terms')
  await expect(page).toHaveTitle(/Terms/)
  await expect(page.locator('body')).toContainText(/governing law/i)
})

test('city route engages auth gate when unauthenticated', async ({ page }) => {
  await page.goto('/brussels')
  // Auth gate should render — either a sign-in modal/CTA or a redirect to a sign-in flow.
  // We allow either pattern by checking for Sign in / Sign up affordances in the body.
  await expect(page.locator('body')).toContainText(/Sign in|Sign up|Continue with email/i, { timeout: 15_000 })
})

test('about page links work', async ({ page }) => {
  await page.goto('/about')
  await expect(page.locator('body')).toContainText(/Brussels/i)
  await expect(page.locator('a[href="/brussels"]').first()).toBeVisible()
})
