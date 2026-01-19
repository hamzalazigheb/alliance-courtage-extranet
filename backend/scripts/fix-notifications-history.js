#!/usr/bin/env node

/**
 * Script pour corriger le fichier notifications.js sur le serveur
 * Remplace la section corrompue de la route /history par la version correcte
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../routes/notifications.js');

console.log('🔧 Correction du fichier notifications.js...');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern à rechercher : la section corrompue avec du code JavaScript dans la string SQL
  const corruptedPattern = /(LEFT JOIN users u ON n\.user_id = u\.id)\s+const notifications = await query\(sql, \[limit, offset\]\);\s+LIMIT \? OFFSET \?\s+`;/s;
  
  // Version corrigée
  const fixedReplacement = `$1
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `;`;
  
  if (corruptedPattern.test(content)) {
    // Faire une sauvegarde
    const backupPath = filePath + '.backup_' + new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(backupPath, content, 'utf8');
    console.log(`✅ Sauvegarde créée: ${backupPath}`);
    
    // Corriger le fichier
    content = content.replace(corruptedPattern, fixedReplacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fichier corrigé avec succès!');
    
    // Vérifier qu'il n'y a plus de code JavaScript dans la string SQL
    const checkPattern = /`[\s\S]*?const notifications = await query[\s\S]*?`/;
    if (checkPattern.test(content)) {
      console.log('⚠️  Attention: Il reste encore du code JavaScript dans une string SQL');
      console.log('   Vérifiez manuellement le fichier.');
    } else {
      console.log('✅ Vérification: Aucun code JavaScript trouvé dans les strings SQL');
    }
  } else {
    console.log('ℹ️  Le fichier semble déjà correct ou le pattern n\'a pas été trouvé.');
    console.log('   Vérifiez manuellement si nécessaire.');
  }
} catch (error) {
  console.error('❌ Erreur lors de la correction:', error.message);
  process.exit(1);
}

