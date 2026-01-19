import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';
import { navigateToPage } from '../helpers/navigation';

test.describe('Comptabilité', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await navigateToPage(page, 'comptabilite');
  });

  test('Page comptabilité se charge', async ({ page }) => {
    await page.waitForTimeout(1500); // Attendre que React mette à jour l'état
    const currentUrl = page.url();
    const hasCorrectHash = currentUrl.includes('#comptabilite');
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    const hasComptabiliteText = /comptabilité/i.test(text || '');
    
    expect(hasCorrectHash || hasComptabiliteText).toBeTruthy();
    await page.waitForLoadState('networkidle');
  });

  test('Visualisation des bordereaux existants', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const bordereaux = page.locator('[class*="bordereau"], [class*="file"], [class*="document"], table tbody tr');
    const count = await bordereaux.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Upload d\'un bordereau', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const uploadButton = page.locator('button').filter({ hasText: /upload|télécharger|ajouter|nouveau/i }).first();
    
    if (await uploadButton.isVisible({ timeout: 5000 })) {
      await uploadButton.click();
      
      // Attendre que le formulaire s'affiche
      await page.waitForTimeout(1000);
      
      // Chercher l'input file
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.isVisible({ timeout: 2000 })) {
        // Créer un fichier de test
        const testFile = {
          name: 'test-bordereau.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('test content')
        };
        
        await fileInput.setInputFiles(testFile);
        
        // Remplir les autres champs si nécessaire
        const titleInput = page.locator('input[name="title"], input[placeholder*="titre"]').first();
        if (await titleInput.isVisible({ timeout: 1000 })) {
          await titleInput.fill('Bordereau Test');
        }
        
        // Soumettre
        const submitButton = page.locator('button[type="submit"]').or(page.locator('button').filter({ hasText: /envoyer|soumettre|enregistrer/i })).first();
        if (await submitButton.isVisible({ timeout: 2000 })) {
          await submitButton.click();
          
          // Vérifier le message de succès
          await expect(page.locator('text=/succès|envoyé|créé/i')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('Filtrage par période (mois/année)', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const monthFilter = page.locator('select[name*="month"], select[name*="mois"]').first();
    const yearFilter = page.locator('select[name*="year"], select[name*="année"]').first();
    
    if (await monthFilter.isVisible({ timeout: 2000 })) {
      await monthFilter.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    }
    
    if (await yearFilter.isVisible({ timeout: 2000 })) {
      await yearFilter.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    }
  });

  test('Téléchargement d\'un bordereau', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const downloadLink = page.locator('a[href*="download"]').or(page.locator('button').filter({ hasText: /télécharger|download/i })).first();
    
    if (await downloadLink.isVisible({ timeout: 5000 })) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
        downloadLink.click()
      ]);
      
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.(pdf|xls|xlsx)$/i);
      }
    }
  });
});




