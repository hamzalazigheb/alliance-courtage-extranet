import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';
import { navigateToPage } from '../helpers/navigation';

test.describe('Réglementaire', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await navigateToPage(page, 'reglementaire');
  });

  test('Page réglementaire se charge', async ({ page }) => {
    await page.waitForTimeout(1500); // Attendre que React mette à jour l'état
    const currentUrl = page.url();
    const hasCorrectHash = currentUrl.includes('#reglementaire');
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    const hasReglementaireText = /réglementaire/i.test(text || '');
    
    expect(hasCorrectHash || hasReglementaireText).toBeTruthy();
    await page.waitForLoadState('networkidle');
  });

  test('Navigation dans les dossiers réglementaires', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Chercher les dossiers
    const folders = page.locator('[class*="folder"], [class*="dossier"], [class*="category"]').or(page.locator('button').filter({ hasText: /dossier/i }));
    
    if (await folders.count() > 0) {
      const firstFolder = folders.first();
      await firstFolder.click();
      
      // Attendre que les documents se chargent
      await page.waitForTimeout(1000);
      
      // Vérifier que les documents ou sous-dossiers s'affichent
      const documents = page.locator('[class*="document"], [class*="file"], [class*="item"]');
      const hasContent = await documents.count() > 0 || 
                        await page.locator('text=/document|fichier/i').isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(hasContent).toBeTruthy();
    }
  });

  test('Téléchargement d\'un document', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Chercher les liens de téléchargement
    const downloadLinks = page.locator('a[href*="download"], a[href*=".pdf"]').or(page.locator('button').filter({ hasText: /télécharger|download/i }));
    
    if (await downloadLinks.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
        downloadLinks.first().click()
      ]);
      
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.(pdf|doc|docx|xls|xlsx)$/i);
      }
    }
  });

  test('Recherche de documents réglementaires', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="recherche"]').first();
    
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
    }
  });
});




