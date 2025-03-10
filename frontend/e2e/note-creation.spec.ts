import { test, expect } from '@playwright/test';

test.describe('Note Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/login');
    await page.fill('input[placeholder="Email address"]', 'test@example.com');
    await page.fill('input[placeholder="Password"]', 'testingtesting');
    await page.click('button:has-text("Login")');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    // Add a small delay to ensure the dashboard is fully loaded
    await page.waitForTimeout(1000);
  });

  test('creates a new note successfully', async ({ page }) => {
    // Click new note button
    await page.click('button:has-text("New Note")');
    
    // Wait for create note page
    await page.waitForURL('**/notes/new');
    
    // Select a category (if not already selected)
    // Check if a category is already selected, if not select the first one
    const hasCategorySelected = await page.locator('.w-60 select').evaluate(select => select.value !== '');
    if (!hasCategorySelected) {
      await page.locator('.w-60 select').selectOption({ index: 0 });
    }
    
    // Fill in note details
    await page.fill('input[placeholder="Note Title"]', 'Test Note Title');
    await page.fill('textarea[placeholder="Pour your heart out..."]', 'This is a test note content');
    
    // Save the note
    await page.click('button:has-text("Save")');
    
    // Wait for the request to complete and redirect
    await page.waitForURL('**/dashboard');
    
    // Verify the new note appears in the list
    await expect(page.locator('[data-testid="note-item"]').filter({ hasText: 'Test Note Title' }).first()).toBeVisible();
  });

  test('filters notes by category', async ({ page }) => {
    // Wait to ensure categories are loaded
    await page.waitForTimeout(500);
    
    // First check if we're on mobile view (dropdown) or desktop view
    const isMobileView = await page.locator('.md\\:hidden').isVisible();
    
    if (isMobileView) {
      // For mobile view - first click to open the dropdown
      await page.click('.md\\:hidden h2');
      await page.waitForTimeout(300); // Wait for dropdown to open
    }
    
    // Get all category items using the data-testid attribute
    const categoryItems = await page.locator('[data-testid="category-item"]').all();
    
    console.log(`Found ${categoryItems.length} category items`);
    
    // Skip if no categories found
    test.skip(categoryItems.length === 0, 'No categories available');
    
    if (categoryItems.length > 0) {
      // Use the first available category
      const categoryToTest = categoryItems[0];
      
      // Get category data from data attributes
      const categoryName = await categoryToTest.getAttribute('data-category-name');
      const categoryId = await categoryToTest.getAttribute('data-category-id');
      
      // Get the expected note count from the category item
      const categoryCountElem = await categoryToTest.locator('span.text-xs').first();
      const categoryCount = await categoryCountElem.textContent();
      const expectedCount = parseInt(categoryCount?.trim() || '0');
      
      console.log(`Testing category: ${categoryName} (ID: ${categoryId}), expected notes: ${expectedCount}`);
      
      // Click the category
      await categoryToTest.click();
      
      // Wait for the title to update with the category name
      await expect(page.locator(`h1:has-text("${categoryName}")`)).toBeVisible();
      
      // Wait for notes to refresh
      await page.waitForTimeout(500);
      
      // Count notes using the data-testid attribute
      const noteCount = await page.locator('[data-testid="note-item"]').count();
      
      console.log(`Actual note count: ${noteCount}`);
      
      // If expected count is greater than 0, verify the count matches
      if (expectedCount > 0) {
        expect(noteCount).toBe(expectedCount);
      }
    }
  });
});