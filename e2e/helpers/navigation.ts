import { Page } from '@playwright/test';

export async function navigateToPage(page: Page, pageName: string) {
  // Utiliser evaluate pour changer le hash et déclencher l'événement hashchange
  // C'est plus fiable que page.goto() pour les applications React avec hash routing
  await page.evaluate((hash) => {
    window.location.hash = hash;
    // Déclencher l'événement hashchange pour que React réagisse
    window.dispatchEvent(new HashChangeEvent('hashchange', {
      oldURL: window.location.href,
      newURL: window.location.href.split('#')[0] + '#' + hash
    }));
  }, pageName);
  
  // Attendre que le hash soit dans l'URL
  await page.waitForFunction(
    (expectedHash) => {
      const currentHash = window.location.hash.slice(1);
      return currentHash === expectedHash;
    },
    pageName,
    { timeout: 5000 }
  );
  
  // Attendre que React mette à jour l'état
  await page.waitForTimeout(1000);
  await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
}

export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Vérifie que la page a bien changé, soit via l'URL, soit via le contenu
 */
export async function expectPageLoaded(page: Page, pageName: string, expectedText?: RegExp) {
  await page.waitForTimeout(1000); // Attendre que React mette à jour l'état
  
  // Vérifier l'URL
  const currentUrl = page.url();
  const hasCorrectHash = currentUrl.includes(`#${pageName}`);
  
  // Si on a un texte attendu, vérifier aussi le contenu
  if (expectedText) {
    const pageContent = page.locator('body');
    const text = await pageContent.textContent();
    const hasExpectedText = expectedText.test(text || '');
    
    // Accepter soit l'URL correcte, soit le contenu attendu
    if (!hasCorrectHash && !hasExpectedText) {
      throw new Error(`Page ${pageName} n'a pas été chargée. URL: ${currentUrl}, Contenu attendu: ${expectedText}`);
    }
  } else {
    // Si pas de texte attendu, vérifier juste l'URL
    if (!hasCorrectHash) {
      throw new Error(`Page ${pageName} n'a pas été chargée. URL actuelle: ${currentUrl}`);
    }
  }
}




