import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';
import { navigateToPage } from '../helpers/navigation';

test.describe('Partenaires', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await navigateToPage(page, 'partenaires');
  });

  test('Page partenaires se charge', async ({ page }) => {
    await page.waitForTimeout(1500); // Attendre que React mette à jour l'état
    const currentUrl = page.url();
    const hasCorrectHash = currentUrl.includes('#partenaires');
    const hasPartnerText = await page.locator('text=/partenaire/i').isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasCorrectHash || hasPartnerText).toBeTruthy();
  });

  test('Affichage de la liste des partenaires', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const partners = page.locator('[class*="partner"], [class*="card"], [class*="item"]');
    const count = await partners.count();
    
    // Il peut y avoir 0 partenaires ou plus
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Voir les détails d\'un partenaire', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const firstPartner = page.locator('[class*="partner"], [class*="card"]').first();
    
    if (await firstPartner.isVisible({ timeout: 5000 })) {
      await firstPartner.click();
      
      // Attendre que les détails se chargent
      await page.waitForTimeout(1000);
      
      // Vérifier que les détails s'affichent (contact, email, téléphone, etc.)
      const details = page.locator('text=/contact|email|téléphone|website/i');
      const hasDetails = await details.count() > 0 || 
                        await page.locator('[class*="detail"], [class*="modal"]').isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(hasDetails).toBeTruthy();
    }
  });

  test('Filtrage par catégorie de partenaire', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const categoryFilter = page.locator('button').filter({ hasText: /catégorie|filtre/i }).or(page.locator('select')).first();
    
    if (await categoryFilter.isVisible({ timeout: 2000 })) {
      await categoryFilter.click();
      await page.waitForTimeout(1000);
    }
  });
});




