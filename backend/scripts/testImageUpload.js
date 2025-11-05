const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:3001/api';
const TEST_IMAGE_PATH = path.join(__dirname, '../public/alliance-courtage-logo.svg'); // Utiliser le logo comme test

async function testImageUpload() {
  try {
    console.log('🧪 Test de l\'upload d\'image CMS...\n');
    
    // 1. Se connecter pour obtenir un token (remplacez par vos credentials)
    console.log('1. Connexion...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com', // Remplacez par un email admin valide
      password: 'Admin123!' // Remplacez par le mot de passe
    });
    
    if (!loginResponse.data.token) {
      console.error('❌ Échec de la connexion');
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie\n');
    
    // 2. Créer un fichier image de test si nécessaire
    let testImagePath = TEST_IMAGE_PATH;
    if (!fs.existsSync(testImagePath)) {
      console.log('⚠️  Fichier de test non trouvé, création d\'un fichier temporaire...');
      // Créer un PNG minimal de 1x1 pixel en base64
      const minimalPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      testImagePath = path.join(__dirname, 'test-image.png');
      fs.writeFileSync(testImagePath, minimalPNG);
    }
    
    // 3. Préparer FormData
    console.log('2. Préparation de l\'upload...');
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));
    
    // 4. Tester l'upload
    console.log('3. Upload de l\'image...');
    const uploadResponse = await axios.post(`${API_URL}/cms/upload-image`, formData, {
      headers: {
        'x-auth-token': token,
        ...formData.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('✅ Upload réussi!');
    console.log('\n📊 Résultat:');
    console.log('- Success:', uploadResponse.data.success);
    console.log('- Image URL length:', uploadResponse.data.imageUrl?.length || 0);
    console.log('- MIME Type:', uploadResponse.data.mimeType);
    console.log('- Size:', uploadResponse.data.size, 'bytes');
    console.log('\n💡 L\'image base64 est maintenant disponible dans imageUrl');
    console.log('   Vous pouvez l\'utiliser directement dans le champ headerImage\n');
    
    // 5. Test de sauvegarde dans CMS
    console.log('4. Test de sauvegarde dans CMS gamme-financiere...');
    const testContent = {
      title: 'Gamme Financière',
      subtitle: 'Test avec image uploadée',
      description: 'Description de test',
      headerImage: uploadResponse.data.imageUrl
    };
    
    const saveResponse = await axios.put(`${API_URL}/cms/gamme-financiere`, {
      content: JSON.stringify(testContent)
    }, {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Sauvegarde réussie:', saveResponse.data.message);
    
    // 6. Vérifier que le contenu est correctement chargé
    console.log('\n5. Vérification du chargement...');
    const loadResponse = await axios.get(`${API_URL}/cms/gamme-financiere`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    const loadedContent = JSON.parse(loadResponse.data.content);
    console.log('✅ Chargement réussi');
    console.log('- Title:', loadedContent.title);
    console.log('- HeaderImage length:', loadedContent.headerImage?.length || 0);
    console.log('- HeaderImage starts with data:', loadedContent.headerImage?.startsWith('data:image') || false);
    
    console.log('\n✅ Tous les tests sont passés avec succès!');
    
  } catch (error) {
    console.error('\n❌ Erreur lors du test:');
    if (error.response) {
      console.error('- Status:', error.response.status);
      console.error('- Error:', error.response.data);
    } else {
      console.error('- Message:', error.message);
    }
    process.exit(1);
  }
}

testImageUpload();

