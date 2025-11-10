# Script pour déplacer les fichiers vers archive

# Déplacer les scripts JS
$scripts = @(
    'addAllUserColumns.js', 'addAssuranceColumn.js', 'addAssurancesTable.js',
    'addBase64ColumnToBordereaux.js', 'addBordereauxTable.js', 'addDenominationSocialeToUsers.js',
    'addFavorisTable.js', 'addFileContentToArchives.js', 'addFileContentToArchivesForStructuredProducts.js',
    'addFileContentToBordereaux.js', 'addFileContentToFinancialDocuments.js', 'addFileContentToFormations.js',
    'addFinancialDocumentsTable.js', 'addFormationsTable.js', 'addLinkToNotifications.js',
    'addLogoContentToPartners.js', 'addMissingColumnsToPasswordReset.js', 'addNotificationsTable.js',
    'addPasswordResetRequestsTable.js', 'addProductReservationsTable.js', 'addProfilePhotoToUsers.js',
    'addReglementaireTables.js', 'addTelephoneCodePostalToUsers.js', 'addUserEmailColumn.js',
    'checkProductReservationsTable.js', 'createBordereauxTable.js', 'createCMSTable.js',
    'exportLocalDatabase.js', 'fixBordereauxFilePath.js', 'fixCMSContentToLongText.js',
    'fixCompletedAtColumn.js', 'fixCorruptedCMS.js', 'fixProductReservationsTable.js',
    'fixRoleEnumWithDataMigration.js', 'fixUserRoles.js', 'fixUsersRoleEnum.js',
    'freshDatabase.js', 'listArchivesFiles.js', 'listBordereauxFiles.js',
    'migrateBordereauxTable.js', 'migrateData.js', 'recreatePasswordResetTable.js',
    'runAllMigrations.js', 'runAllTests.js', 'testAllAPI.js',
    'testDatabase.js', 'testImageUpload.js', 'testPerformance.js',
    'testSecurity.js', 'testUserColumns.js', 'verifyBordereauxTable.js',
    'viewUsers.js', 'checkSessions.js'
)

foreach ($script in $scripts) {
    $src = "backend\scripts\$script"
    if (Test-Path $src) {
        Move-Item $src "archive\scripts\$script" -Force
        Write-Host "Deplace: $script"
    }
}

# Déplacer les fichiers SQL dans backend/scripts
$sqlFiles = @(
    'checkCMSContentColumn.sql', 'fixContentColumn.sql', 'fixCorruptedCMSJSON.sql',
    'addLinkToNotifications.sql', 'fixProductReservationsTable.sql', 'installDatabase.sql'
)

foreach ($file in $sqlFiles) {
    $src = "backend\scripts\$file"
    if (Test-Path $src) {
        Move-Item $src "archive\sql\$file" -Force
        Write-Host "Deplace SQL: $file"
    }
}

# Déplacer les fichiers SQL à la racine
$rootSql = @(
    'CREATE_REGLEMENTAIRE_TABLES.sql', 'FIX_ALL_TABLES.sql',
    'RECREATE_BORDEREAUX_FINAL.sql', 'RESET_DATABASE_FIXED.sql'
)

foreach ($file in $rootSql) {
    if (Test-Path $file) {
        Move-Item $file "archive\sql\$file" -Force
        Write-Host "Deplace SQL root: $file"
    }
}

Write-Host "`nDeplacement termine!"

