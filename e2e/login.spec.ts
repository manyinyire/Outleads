import { test, expect } from '@playwright/test';

test('should allow a user to log in and see the admin dashboard', async ({ page }) => {
  // Navigate to the login page
  await page.goto('/auth/login');

  // Fill in the username and password
  await page.fill('input[name="username"]', 'mabasat');
  await page.fill('input[name="password"]', 'Rocket@20');

  // Click the sign-in button
  await page.click('button[type="submit"]');

  // Wait for navigation to the admin dashboard
  await page.waitForURL('/admin');

  // Check that the dashboard title is visible
  await expect(page.locator('h2:has-text("User Management")')).toBeVisible();
});
