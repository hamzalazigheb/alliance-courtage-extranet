import { testUsers } from '../config/test-data';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Réinitialise l'utilisateur de test pour les tests de première connexion
 * en définissant must_change_password = TRUE dans la base de données via l'API
 */
export async function resetNewUserPassword() {
  try {
    const response = await fetch(`${API_URL}/api/test/reset-user-first-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUsers.newUser.email
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
    
    console.log(`✅ Utilisateur de test '${testUsers.newUser.email}' réinitialisé avec must_change_password = TRUE.`);
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation de l\'utilisateur de test:', error);
    // Ne pas throw pour ne pas bloquer les tests si l'API n'est pas disponible
    // L'utilisateur devra être réinitialisé manuellement
  }
}

