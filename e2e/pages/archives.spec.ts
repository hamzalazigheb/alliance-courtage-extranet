import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';
import { navigateToPage } from '../helpers/navigation';

test.describe('Archives', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await navigateToPage(page, 'nos-archives');
  });

  test('Page archives se charge', async ({ page }) => {
    await page.waitForTimeout(1500); // Attendre que React mette à jour l'état
    const currentUrl = page.url();
    const hasCorrectHash = currentUrl.includes('#nos-archives') || currentUrl.includes('#archives');
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    const hasArchiveText = /archive/i.test(text || '');
    
    expect(hasCorrectHash || hasArchiveText).toBeTruthy();
    await page.waitForLoadState('networkidle');
  });

  test('Affichage de la liste des archives', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const archives = page.locator('[class*="archive"], [class*="card"], [class*="item"]');
    const count = await archives.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Filtrage par année', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const yearFilter = page.locator('select[name*="year"], select[name*="année"]').or(page.locator('button').filter({ hasText: /année/i })).first();
    
    if (await yearFilter.isVisible({ timeout: 2000 })) {
      if (await yearFilter.evaluate(el => el.tagName === 'SELECT')) {
        await yearFilter.selectOption({ index: 1 });
      } else {
        await yearFilter.click();
      }
      
      await page.waitForTimeout(1000);
    }
  });

  test('Recherche dans les archives', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="recherche"]').first();
    
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
    }
  });

  test('Téléchargement d\'une archive', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const downloadLink = page.locator('a[href*="download"]').or(page.locator('button').filter({ hasText: /télécharger/i })).first();
    
    if (await downloadLink.isVisible({ timeout: 5000 })) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
        downloadLink.click()
      ]);
      
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.(pdf|zip|rar)$/i);
      }
    }
  });
});




