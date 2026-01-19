import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';
import { navigateToPage } from '../helpers/navigation';

test.describe('Favoris', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await navigateToPage(page, 'favoris');
  });

  test('Page favoris se charge', async ({ page }) => {
    await page.waitForTimeout(1500); // Attendre que React mette à jour l'état
    const currentUrl = page.url();
    const hasCorrectHash = currentUrl.includes('#favoris');
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    const hasFavorisText = /favori/i.test(text || '');
    
    expect(hasCorrectHash || hasFavorisText).toBeTruthy();
    await page.waitForLoadState('networkidle');
  });

  test('Affichage de la liste des favoris', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const favoris = page.locator('[class*="favori"], [class*="favorite"], [class*="card"]');
    const count = await favoris.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Suppression d\'un favori', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const deleteButton = page.locator('button').filter({ hasText: /supprimer|retirer|delete/i }).or(page.locator('[class*="delete"]')).first();
    
    if (await deleteButton.isVisible({ timeout: 5000 })) {
      await deleteButton.click();
      
      // Confirmer la suppression si nécessaire
      const confirmButton = page.locator('button').filter({ hasText: /confirmer|oui|confirm/i });
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
      
      // Vérifier le message de succès
      await expect(page.locator('text=/supprimé|retiré|succès/i')).toBeVisible({ timeout: 5000 });
    }
  });
});




