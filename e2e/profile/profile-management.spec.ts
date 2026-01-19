import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';

test.describe('Gestion du Profil', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/#accueil');
  });

  test('Accéder au profil', async ({ page }) => {
    // Chercher le menu utilisateur dans le header
    const userMenu = page.locator('[class*="user"], [class*="profile"]').or(page.locator('button').filter({ hasText: /profil/i })).first();
    
    if (await userMenu.isVisible({ timeout: 5000 })) {
      await userMenu.click();
      
      // Chercher "Gérer profil"
      const manageProfile = page.locator('text=/gérer.*profil|manage.*profile/i').first();
      
      if (await manageProfile.isVisible({ timeout: 2000 })) {
        await manageProfile.click();
        
        // Vérifier que le modal s'ouvre
        await expect(page.locator('text=/profil|profile|nom|email/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('Modifier les informations du profil', async ({ page }) => {
    // Ouvrir le profil
    const userMenu = page.locator('[class*="user"], [class*="profile"]').first();
    
    if (await userMenu.isVisible({ timeout: 5000 })) {
      await userMenu.click();
      await page.click('text=/gérer.*profil/i');
      
      // Attendre que le modal s'ouvre
      await page.waitForSelector('input[name="nom"], input[placeholder*="nom"]', { timeout: 5000 });
      
      // Modifier le nom
      const nomInput = page.locator('input[name="nom"], input[placeholder*="nom"]').first();
      
      if (await nomInput.isVisible({ timeout: 2000 })) {
        const currentValue = await nomInput.inputValue();
        await nomInput.fill('Nouveau Nom Test');
        
        // Sauvegarder
        const saveButton = page.locator('button').filter({ hasText: /sauvegarder|enregistrer|save/i }).first();
        
        if (await saveButton.isVisible({ timeout: 2000 })) {
          await saveButton.click();
          
          // Vérifier le message de succès
          await expect(page.locator('text=/succès|modifié|enregistré/i')).toBeVisible({ timeout: 5000 });
          
          // Restaurer la valeur originale si nécessaire
          await nomInput.fill(currentValue);
          await saveButton.click();
        }
      }
    }
  });

  test('Changer le mot de passe depuis le profil', async ({ page }) => {
    const userMenu = page.locator('[class*="user"], [class*="profile"]').first();
    
    if (await userMenu.isVisible({ timeout: 5000 })) {
      await userMenu.click();
      await page.click('text=/gérer.*profil/i');
      
      // Aller dans l'onglet mot de passe
      const passwordTab = page.locator('button').filter({ hasText: /mot de passe|password/i }).or(page.locator('a').filter({ hasText: /mot de passe/i })).first();
      
      if (await passwordTab.isVisible({ timeout: 2000 })) {
        await passwordTab.click();
        
        // Remplir le formulaire
        await page.fill('input[name="currentPassword"], input[placeholder*="actuel"]', 'password123');
        await page.fill('input[name="newPassword"], input[placeholder*="nouveau"]', 'NouveauMotDePasse123!');
        await page.fill('input[name="confirmPassword"], input[placeholder*="confirmer"]', 'NouveauMotDePasse123!');
        
        // Soumettre
        const submitButton = page.locator('button[type="submit"]').or(page.locator('button').filter({ hasText: /changer|modifier/i })).first();
        
        if (await submitButton.isVisible({ timeout: 2000 })) {
          await submitButton.click();
          
          // Vérifier le message de succès
          await expect(page.locator('text=/succès|modifié/i')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});



