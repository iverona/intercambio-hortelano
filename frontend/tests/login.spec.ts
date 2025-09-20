import { test, expect } from '@playwright/test';

test('should allow a user to log in', async ({ page }) => {
  // Navigate to the login page
  await page.goto('/login');

  // Fill in the email and password
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);

  // Click the login button
  await page.getByRole('button', { name: 'Login' }).click();

  // Wait for navigation to complete before asserting the URL
  await page.waitForURL('/');
  await expect(page).toHaveURL('/');
});

test('should show an error for incorrect password', async ({ page }) => {
  // Navigate to the login page
  await page.goto('/login');

  // Fill in the email and an incorrect password
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Password').fill('wrongpassword');

  // Click the login button
  await page.getByRole('button', { name: 'Login' }).click();

  // Assert that the error message is visible
  const errorMessage = page.locator('p.text-red-500');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText(/invalid-credential/);
});

test('should show an error for an unregistered user', async ({ page }) => {
  // Navigate to the login page
  await page.goto('/login');

  // Fill in an unregistered email and a password
  await page.getByLabel('Email').fill('nouser@example.com');
  await page.getByLabel('Password').fill('password123');

  // Click the login button
  await page.getByRole('button', { name: 'Login' }).click();

  // Assert that the error message is visible
  const errorMessage = page.locator('p.text-red-500');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText(/invalid-credential/);
});
