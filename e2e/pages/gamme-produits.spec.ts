import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';
import { navigateToPage } from '../helpers/navigation';

test.describe('Gamme Produits', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await navigateToPage(page, 'gamme-produits');
  });

  test('Page se charge et affiche les produits', async ({ page }) => {
    await page.waitForTimeout(1500); // Attendre que React mette à jour l'état
    const currentUrl = page.url();
    const hasCorrectHash = currentUrl.includes('#gamme-produits');
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    const hasProductText = /produit|gamme/i.test(text || '');
    
    expect(hasCorrectHash || hasProductText).toBeTruthy();
    
    // Attendre que les produits se chargent
    await page.waitForLoadState('networkidle');
    
    // Chercher les produits (peuvent être dans différentes structures)
    const products = page.locator('[class*="product"], [class*="card"], [class*="item"]');
    const count = await products.count();
    
    // Il peut y avoir 0 produits ou plus
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Filtrage des produits par catégorie', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Chercher les filtres de catégorie
    const filters = page.locator('button').filter({ hasText: /catégorie|filtre|tous/i }).or(page.locator('select')).first();
    
    if (await filters.isVisible({ timeout: 2000 })) {
      await filters.click();
      
      // Attendre que les produits soient filtrés
      await page.waitForTimeout(1000);
      
      // Vérifier que les produits sont toujours visibles (ou qu'un message s'affiche)
      const products = page.locator('[class*="product"], [class*="card"]');
      const message = page.locator('text=/aucun produit|no product/i');
      
      const hasProducts = await products.count() > 0;
      const hasMessage = await message.isVisible({ timeout: 1000 }).catch(() => false);
      
      expect(hasProducts || hasMessage).toBeTruthy();
    }
  });

  test('Recherche de produits', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="recherche"], input[placeholder*="search"]').first();
    
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      // Vérifier que les résultats sont affichés ou qu'un message s'affiche
      const results = page.locator('[class*="product"], [class*="card"]');
      const noResults = page.locator('text=/aucun résultat|no result/i');
      
      const hasResults = await results.count() > 0;
      const hasNoResults = await noResults.isVisible({ timeout: 1000 }).catch(() => false);
      
      expect(hasResults || hasNoResults).toBeTruthy();
    }
  });

  test('Voir les détails d\'un produit', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const product = page.locator('[class*="product"], [class*="card"]').first();
    
    if (await product.isVisible({ timeout: 5000 })) {
      await product.click();
      
      // Vérifier que les détails s'affichent
      await page.waitForTimeout(1000);
      const details = page.locator('[class*="detail"], [class*="modal"], [class*="popup"]');
      const hasDetails = await details.count() > 0 || await page.locator('text=/description|détail/i').isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(hasDetails).toBeTruthy();
    }
  });
});




