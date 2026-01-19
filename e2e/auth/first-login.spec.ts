import { test, expect } from '@playwright/test';
import { changePasswordInModal } from '../helpers/auth';
import { testUsers } from '../config/test-data';
import { resetNewUserPassword } from '../helpers/test-setup';

test.describe('Première connexion - Changement mot de passe', () => {
  // Réinitialiser l'utilisateur de test avant chaque test
  test.beforeEach(async () => {
    await resetNewUserPassword();
  });
  test('Modal obligatoire s\'affiche à la première connexion', async ({ page }) => {
    await page.goto('/');
    
    // Se connecter avec un utilisateur qui doit changer son mot de passe
    await page.fill('input[type="email"]', testUsers.newUser.email);
    await page.fill('input[type="password"]', testUsers.newUser.password);
    await page.click('button[type="submit"]');
    
    // Attendre que le modal s'affiche - utiliser plusieurs sélecteurs
    // Le modal peut prendre un peu de temps à s'afficher après la connexion
    await Promise.race([
      page.waitForSelector('h2:has-text("Changement de mot de passe requis")', { timeout: 15000 }),
      page.waitForSelector('text=Changement de mot de passe requis', { timeout: 15000 }),
      page.waitForSelector('text=Pour votre sécurité', { timeout: 15000 }),
      page.waitForSelector('[class*="fixed"][class*="inset-0"]', { timeout: 15000 })
    ]);
    
    // Vérifier que le modal est visible
    await expect(page.locator('h2:has-text("Changement de mot de passe requis")').or(page.locator('text=Changement de mot de passe requis'))).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Pour votre sécurité')).toBeVisible({ timeout: 5000 });
    
    // Vérifier que le modal bloque l'accès (le modal doit être visible)
    await expect(page.locator('.fixed.inset-0')).toBeVisible();
  });

  test('Validation mot de passe - mot de passe trop court', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', testUsers.newUser.email);
    await page.fill('input[type="password"]', testUsers.newUser.password);
    await page.click('button[type="submit"]');
    
    // Attendre le modal
    await page.waitForSelector('h2:has-text("Changement de mot de passe requis")', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Remplir le mot de passe actuel
    await page.fill('input[placeholder="Entrez votre mot de passe temporaire"]', testUsers.newUser.password);
    
    // Tester avec un mot de passe trop court
    await page.fill('input[placeholder="Minimum 8 caractères"]', 'Court1!');
    await page.fill('input[placeholder="Confirmez votre nouveau mot de passe"]', 'Court1!');
    await page.click('button:has-text("Changer mon mot de passe")');
    
    // Attendre le message d'erreur dans la div d'erreur
    await expect(
      page.locator('.bg-red-50, .border-red-200').locator('text=/au moins 8 caractères|8 caractères/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('Validation mot de passe - sans majuscule', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', testUsers.newUser.email);
    await page.fill('input[type="password"]', testUsers.newUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('h2:has-text("Changement de mot de passe requis")', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    await page.fill('input[placeholder="Entrez votre mot de passe temporaire"]', testUsers.newUser.password);
    await page.fill('input[placeholder="Minimum 8 caractères"]', 'nouveaumotdepasse123!');
    await page.fill('input[placeholder="Confirmez votre nouveau mot de passe"]', 'nouveaumotdepasse123!');
    await page.click('button:has-text("Changer mon mot de passe")');
    
    await expect(
      page.locator('.bg-red-50, .border-red-200').locator('text=/majuscule/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('Validation mot de passe - sans minuscule', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', testUsers.newUser.email);
    await page.fill('input[type="password"]', testUsers.newUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('h2:has-text("Changement de mot de passe requis")', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    await page.fill('input[placeholder="Entrez votre mot de passe temporaire"]', testUsers.newUser.password);
    await page.fill('input[placeholder="Minimum 8 caractères"]', 'NOUVEAUMOTDEPASSE123!');
    await page.fill('input[placeholder="Confirmez votre nouveau mot de passe"]', 'NOUVEAUMOTDEPASSE123!');
    await page.click('button:has-text("Changer mon mot de passe")');
    
    await expect(
      page.locator('.bg-red-50, .border-red-200').locator('text=/minuscule/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('Validation mot de passe - sans chiffre', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', testUsers.newUser.email);
    await page.fill('input[type="password"]', testUsers.newUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('h2:has-text("Changement de mot de passe requis")', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    await page.fill('input[placeholder="Entrez votre mot de passe temporaire"]', testUsers.newUser.password);
    await page.fill('input[placeholder="Minimum 8 caractères"]', 'NouveauMotDePasse!');
    await page.fill('input[placeholder="Confirmez votre nouveau mot de passe"]', 'NouveauMotDePasse!');
    await page.click('button:has-text("Changer mon mot de passe")');
    
    await expect(
      page.locator('.bg-red-50, .border-red-200').locator('text=/chiffre/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('Validation mot de passe - sans caractère spécial', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', testUsers.newUser.email);
    await page.fill('input[type="password"]', testUsers.newUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('h2:has-text("Changement de mot de passe requis")', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    await page.fill('input[placeholder="Entrez votre mot de passe temporaire"]', testUsers.newUser.password);
    await page.fill('input[placeholder="Minimum 8 caractères"]', 'NouveauMotDePasse123');
    await page.fill('input[placeholder="Confirmez votre nouveau mot de passe"]', 'NouveauMotDePasse123');
    await page.click('button:has-text("Changer mon mot de passe")');
    
    await expect(
      page.locator('.bg-red-50, .border-red-200').locator('text=/caractère spécial/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('Mots de passe ne correspondent pas', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', testUsers.newUser.email);
    await page.fill('input[type="password"]', testUsers.newUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('h2:has-text("Changement de mot de passe requis")', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    await page.fill('input[placeholder="Entrez votre mot de passe temporaire"]', testUsers.newUser.password);
    await page.fill('input[placeholder="Minimum 8 caractères"]', 'NouveauMotDePasse123!');
    await page.fill('input[placeholder="Confirmez votre nouveau mot de passe"]', 'AutreMotDePasse123!');
    await page.click('button:has-text("Changer mon mot de passe")');
    
    await expect(
      page.locator('.bg-red-50, .border-red-200').locator('text=/ne correspondent pas|correspondent pas/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('Changement de mot de passe réussi', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', testUsers.newUser.email);
    await page.fill('input[type="password"]', testUsers.newUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('h2:has-text("Changement de mot de passe requis")', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Changer le mot de passe
    await changePasswordInModal(page, testUsers.newUser.password, 'NouveauMotDePasse123!');
    
    // Vérifier que le modal disparaît
    await expect(page.locator('h2:has-text("Changement de mot de passe requis")')).not.toBeVisible({ timeout: 10000 });
    
    // Vérifier l'accès à l'application
    await expect(page.locator('nav, [class*="navbar"], [class*="header"]')).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/.*#accueil/);
  });
});

