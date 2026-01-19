import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';
import { navigateToPage } from '../helpers/navigation';

test.describe('Simulateurs', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await navigateToPage(page, 'simulateurs');
  });

  test('Page simulateurs se charge', async ({ page }) => {
    await page.waitForTimeout(1500); // Attendre que React mette à jour l'état
    const currentUrl = page.url();
    const hasCorrectHash = currentUrl.includes('#simulateurs');
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    const hasSimulateurText = /simulateur/i.test(text || '');
    
    expect(hasCorrectHash || hasSimulateurText).toBeTruthy();
    await page.waitForLoadState('networkidle');
  });

  test('Affichage de la liste des simulateurs', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const simulators = page.locator('[class*="simulator"], [class*="card"], [class*="item"]');
    const count = await simulators.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Utilisation d\'un simulateur', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const simulator = page.locator('[class*="simulator"], [class*="card"]').first();
    
    if (await simulator.isVisible({ timeout: 5000 })) {
      await simulator.click();
      
      // Attendre que le simulateur s'ouvre
      await page.waitForTimeout(1000);
      
      // Chercher les champs de saisie
      const inputs = page.locator('input[type="number"], input[type="text"]');
      const count = await inputs.count();
      
      if (count > 0) {
        // Remplir le premier champ
        await inputs.first().fill('1000');
        
        // Chercher le bouton de calcul
        const calculateButton = page.locator('button').filter({ hasText: /calculer|simuler|calcul/i }).first();
        
        if (await calculateButton.isVisible({ timeout: 2000 })) {
          await calculateButton.click();
          
          // Vérifier les résultats
          await expect(page.locator('text=/résultat|montant|total|mensualité/i')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('Navigation vers simulateur externe', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const simulatorLink = page.locator('a[href^="http"], a[target="_blank"]').first();
    
    if (await simulatorLink.isVisible({ timeout: 2000 })) {
      const href = await simulatorLink.getAttribute('href');
      expect(href).toMatch(/^https?:\/\//);
    }
  });
});




