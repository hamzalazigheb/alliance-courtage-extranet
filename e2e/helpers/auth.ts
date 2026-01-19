import { Page } from '@playwright/test';
import { testUsers } from '../config/test-data';

export async function loginAsAdmin(page: Page) {
  await page.goto('/#manage');
  await page.fill('input[type="email"]', testUsers.admin.email);
  await page.fill('input[type="password"]', testUsers.admin.password);
  await page.click('button[type="submit"]');
  
  // Attendre la redirection
  await page.waitForURL(/.*#manage/, { timeout: 10000 });
  
  // Attendre que la page admin soit chargée - ManagePage a un header avec "Administration"
  await Promise.race([
    page.waitForSelector('header', { timeout: 10000 }),
    page.waitForSelector('text=Administration', { timeout: 10000 }),
    page.waitForSelector('text=Centre de gestion', { timeout: 10000 }),
    page.waitForSelector('[class*="AdminNavbar"]', { timeout: 10000 }),
    page.waitForLoadState('networkidle', { timeout: 10000 })
  ]);
}

export async function loginAsUser(page: Page, email?: string, password?: string) {
  const userEmail = email || testUsers.regularUser.email;
  const userPassword = password || testUsers.regularUser.password;
  
  await page.goto('/');
  await page.fill('input[type="email"]', userEmail);
  await page.fill('input[type="password"]', userPassword);
  await page.click('button[type="submit"]');
  
  // Attendre soit la connexion, soit le modal de changement de mot de passe
  await Promise.race([
    page.waitForURL(/.*#accueil/, { timeout: 10000 }),
    page.waitForSelector('text=Changement de mot de passe requis', { timeout: 10000 }).catch(() => null)
  ]);
}

export async function logout(page: Page) {
  // Le bouton de déconnexion est directement dans le header
  const logoutButton = page.locator('button').filter({ hasText: /déconnexion|déco/i }).first();
  
  if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await logoutButton.click();
    
    // Attendre un peu pour que le clic soit traité
    await page.waitForTimeout(500);
    
    // Supprimer le token manuellement car le bouton peut juste changer le hash
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      localStorage.removeItem('manageAuth');
    });
    
    // Attendre la redirection vers la page de login
    await Promise.race([
      page.waitForURL(/.*\/$/, { timeout: 5000 }),
      page.waitForURL(/.*#accueil/, { timeout: 5000 }),
      page.waitForSelector('input[type="email"]', { timeout: 5000 })
    ]);
  } else {
    // Si on ne trouve pas le bouton, supprimer le token et rediriger directement
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      localStorage.removeItem('manageAuth');
      window.location.href = '/';
    });
    await page.waitForURL(/.*\/$/, { timeout: 5000 });
  }
}

export async function changePasswordInModal(page: Page, currentPassword: string, newPassword: string) {
  // Attendre que le modal soit complètement chargé
  await page.waitForSelector('h2:has-text("Changement de mot de passe requis")', { timeout: 10000 });
  await page.waitForTimeout(500);
  
  // Remplir le mot de passe actuel - utiliser le placeholder exact
  await page.fill('input[placeholder="Entrez votre mot de passe temporaire"]', currentPassword);
  
  // Remplir le nouveau mot de passe
  await page.fill('input[placeholder="Minimum 8 caractères"]', newPassword);
  
  // Confirmer le nouveau mot de passe
  await page.fill('input[placeholder="Confirmez votre nouveau mot de passe"]', newPassword);
  
  // Cliquer sur le bouton de changement
  await page.click('button:has-text("Changer mon mot de passe")');
  
  // Attendre que le modal disparaisse ou que la page change
  await Promise.race([
    page.waitForSelector('h2:has-text("Changement de mot de passe requis")', { state: 'hidden', timeout: 10000 }),
    page.waitForURL(/.*#accueil/, { timeout: 10000 }),
    page.waitForSelector('nav, [class*="navbar"], [class*="header"]', { timeout: 10000 })
  ]);
}

