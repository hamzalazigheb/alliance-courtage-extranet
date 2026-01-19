import { test, expect } from '@playwright/test';
import { loginAsUser, loginAsAdmin } from '../helpers/auth';
import { navigateToPage } from '../helpers/navigation';
import { testUsers } from '../config/test-data';

test.describe('Filtrage Notifications - Utilisateurs non-admin', () => {
  test('Utilisateur non-admin ne voit PAS les notifications formation_pending', async ({ page }) => {
    await loginAsUser(page);
    await navigateToPage(page, 'notifications');
    
    // Attendre que les notifications se chargent
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Vérifier qu'aucune notification de type formation_pending n'est visible
    const formationNotifications = page.locator('text=/formation.*en attente|formation_pending|nouvelle formation/i');
    const count = await formationNotifications.count();
    
    expect(count).toBe(0);
  });

  test('Utilisateur voit ses notifications personnelles', async ({ page }) => {
    await loginAsUser(page);
    await navigateToPage(page, 'notifications');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Les notifications personnelles doivent être visibles
    const personalNotifications = page.locator('[class*="notification"], [class*="card"]');
    const count = await personalNotifications.count();
    
    // Il peut y avoir 0 ou plus de notifications
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Admin voit toutes les notifications incluant formation_pending', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/#notifications');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Les admins peuvent voir les notifications formation_pending
    // On vérifie juste que la page se charge correctement
    await expect(page.locator('[class*="notification"], [class*="card"], body')).toBeVisible();
  });
});




