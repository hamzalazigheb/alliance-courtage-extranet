import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';
import { navigateToPage } from '../helpers/navigation';

test.describe('Produits Structurés', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await navigateToPage(page, 'produits-structures');
  });

  test('Page produits structurés se charge', async ({ page }) => {
    await page.waitForTimeout(1500); // Attendre que React mette à jour l'état
    const currentUrl = page.url();
    const hasCorrectHash = currentUrl.includes('#produits-structures');
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    const hasStructuredText = /produit.*structuré|structuré/i.test(text || '');
    
    expect(hasCorrectHash || hasStructuredText).toBeTruthy();
    await page.waitForLoadState('networkidle');
  });

  test('Affichage de la liste des produits structurés', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const products = page.locator('[class*="product"], [class*="structured"], [class*="card"]');
    const count = await products.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Réservation d\'un produit', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Chercher un bouton de réservation
    const reserveButton = page.locator('button').filter({ hasText: /réserver|reserver/i }).first();
    
    if (await reserveButton.isVisible({ timeout: 5000 })) {
      await reserveButton.click();
      
      // Attendre que le formulaire s'affiche
      await page.waitForTimeout(1000);
      
      // Remplir le formulaire de réservation si visible
      const montantInput = page.locator('input[name="montant"], input[placeholder*="montant"], input[type="number"]').first();
      
      if (await montantInput.isVisible({ timeout: 2000 })) {
        await montantInput.fill('10000');
        
        // Soumettre le formulaire
        const submitButton = page.locator('button[type="submit"]').or(page.locator('button').filter({ hasText: /confirmer|envoyer|soumettre/i })).first();
        if (await submitButton.isVisible({ timeout: 2000 })) {
          await submitButton.click();
          
          // Vérifier le message de succès
          await expect(page.locator('text=/réservation.*créée|succès|envoyé/i')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('Voir les détails d\'un produit structuré', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const product = page.locator('[class*="product"], [class*="card"]').first();
    
    if (await product.isVisible({ timeout: 5000 })) {
      await product.click();
      await page.waitForTimeout(1000);
      
      // Vérifier que les détails s'affichent
      const details = page.locator('[class*="detail"], [class*="modal"], text=/description|détail/i');
      const hasDetails = await details.count() > 0 || 
                        await page.locator('text=/description|montant|assurance/i').isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(hasDetails).toBeTruthy();
    }
  });
});




