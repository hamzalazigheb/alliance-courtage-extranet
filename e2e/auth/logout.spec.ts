import { test, expect } from '@playwright/test';
import { loginAsUser, logout } from '../helpers/auth';

test.describe('Déconnexion', () => {
  test('Déconnexion depuis le menu utilisateur', async ({ page }) => {
    await loginAsUser(page);
    
    // Vérifier qu'on est connecté
    await expect(page.locator('nav, [class*="navbar"]')).toBeVisible();
    
    // Se déconnecter
    await logout(page);
    
    // Attendre un peu pour que la redirection se fasse
    await page.waitForTimeout(1000);
    
    // Vérifier que le formulaire de login est visible (peu importe l'URL)
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('Session supprimée après déconnexion', async ({ page }) => {
    await loginAsUser(page);
    
    // Attendre que la connexion soit complète
    await page.waitForURL(/.*#accueil/, { timeout: 10000 });
    
    // Attendre un peu pour que le token soit stocké
    await page.waitForTimeout(500);
    
    // Vérifier que le token est dans localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    
    // Se déconnecter
    await logout(page);
    
    // Attendre que la redirection se fasse et que le token soit supprimé
    await page.waitForTimeout(1000);
    
    // Vérifier que le token est supprimé (peut nécessiter un rechargement de page)
    let tokenAfterLogout = await page.evaluate(() => localStorage.getItem('token'));
    
    // Si le token existe encore, c'est peut-être parce que la page n'a pas été rechargée
    // Dans ce cas, vérifier après un rechargement
    if (tokenAfterLogout) {
      await page.reload();
      await page.waitForTimeout(500);
      tokenAfterLogout = await page.evaluate(() => localStorage.getItem('token'));
    }
    
    expect(tokenAfterLogout).toBeNull();
  });
});

