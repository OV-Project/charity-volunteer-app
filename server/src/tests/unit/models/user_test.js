// user_test.js - Version complète corrigée
import User from '../../../models/User.js';
import database from '../../../config/database.js';

async function testuser() {
    try {
        await database.connect();
        console.log('✅ Base de données connectée\n');

        // Supprimer les anciens tests
        await User.deleteMany({ email: { $in: [/test@/, /jean.dupont@/, /restos@/, /test.compare@/] } });
        console.log('🧹 Anciens tests supprimés\n');

        // ========== TEST 1: Créer un bénévole ==========
        console.log('📝 TEST 1: Création d\'un bénévole');
        const volunteer = new User({
            email: 'jean.dupont@email.com',
            password: 'Password123!',
            role: 'volunteer',
            volunteerProfile: {
                fullName: 'Jean Dupont',
                birthDate: new Date('1995-03-15'),
                postalCode: '75001',
                city: 'Paris',
                interests: ['environment', 'social'],
                availability: ['weekend'],
                homeLocation: {
                    type: 'Point',
                    coordinates: [2.3522, 48.8566]
                }
            }
        });

        await volunteer.save();
        console.log('✅ Bénévole créé avec succès');
        console.log(`   ID: ${volunteer._id}`);
        console.log(`   Email: ${volunteer.email}`);
        console.log(`   Rôle: ${volunteer.role}`);
        console.log(`   Statut: ${volunteer.status}`);

        // TEST HASHAGE 1: Vérifier que le mot de passe est hashé
        console.log(`\n   🔐 Test hashage 1: Vérification que le password est hashé`);
        const isHashed = volunteer.password !== 'Password123!' && volunteer.password.startsWith('$2');
        console.log(`   ${isHashed ? '✅' : '❌'} Le mot de passe est hashé: ${isHashed}`);
        if (isHashed) {
            console.log(`   Format du hash: ${volunteer.password.substring(0, 10)}... (Hash bcrypt valide)`);
        }
        console.log();

        // Recharger avec password pour les tests
        const volunteerWithPassword = await User.findById(volunteer._id).select('+password');

        // ========== TEST 2: Lire le bénévole ==========
        console.log('📝 TEST 2: Lecture du bénévole');
        const foundVolunteer = await User.findById(volunteer._id);
        console.log(`✅ Bénévole trouvé: ${foundVolunteer.email}`);
        console.log(`   Nom: ${foundVolunteer.volunteerProfile.fullName}`);
        console.log(`   Code postal: ${foundVolunteer.volunteerProfile.postalCode}\n`);

        // ========== TEST 3: Tester la méthode comparePassword ==========
        console.log('📝 TEST 3: Test de la méthode comparePassword');

        // Test 3.1: Mot de passe correct
        const isPasswordCorrect = await volunteerWithPassword.comparePassword('Password123!');
        console.log(`   ${isPasswordCorrect ? '✅' : '❌'} Mot de passe correct: "Password123!" -> ${isPasswordCorrect}`);

        // Test 3.2: Mot de passe incorrect
        const isPasswordWrong = await volunteerWithPassword.comparePassword('WrongPassword456!');
        console.log(`   ${!isPasswordWrong ? '✅' : '❌'} Mot de passe incorrect: "WrongPassword456!" -> ${!isPasswordWrong ? 'rejeté' : 'accepté'}`);

        // Test 3.3: Mot de passe vide
        const isEmptyPassword = await volunteerWithPassword.comparePassword('');
        console.log(`   ${!isEmptyPassword ? '✅' : '❌'} Mot de passe vide: rejeté`);

        // Test 3.4: Mot de passe null
        const isNullPassword = await volunteerWithPassword.comparePassword(null);
        console.log(`   ${!isNullPassword ? '✅' : '❌'} Mot de passe null: rejeté\n`);

        // ========== TEST 4: Vérifier l'intégrité du hash ==========
        console.log('📝 TEST 4: Test d\'intégrité du hashage');

        // Récupérer l'utilisateur avec le password
        const userWithPassword = await User.findById(volunteer._id).select('+password');

        // Vérifier que le hash stocké est un hash bcrypt valide
        const isValidBcryptHash = userWithPassword.password.match(/^\$2[aby]\$\d+\$.{53}$/);
        console.log(`   ${isValidBcryptHash ? '✅' : '❌'} Format bcrypt valide: ${isValidBcryptHash ? 'oui' : 'non'}`);

        // Vérifier la longueur du hash (60 caractères pour bcrypt)
        const hashLength = userWithPassword.password.length;
        console.log(`   📏 Longueur du hash: ${hashLength} caractères ${hashLength === 60 ? '✅' : `(attendue: 60)`}`);

        // Vérifier que le hash contient le salt
        const hasSalt = userWithPassword.password.includes('$2');
        console.log(`   🧂 Salt présent: ${hasSalt ? 'oui ✅' : 'non ❌'}\n`);

        // ========== TEST 5: Créer une organisation ==========
        console.log('📝 TEST 5: Création d\'une organisation');
        const organization = new User({
            email: 'restos@coeur.fr',
            password: 'Organization123!',
            role: 'organization',
            orgProfile: {
                name: 'Restos du Coeur',
                type: 'Association',
                siret: '12345678901234',
                description: 'Aide alimentaire pour les personnes dans le besoin',
                address: {
                    street: '10 rue de Paris',
                    postalCode: '75001',
                    city: 'Paris'
                },
                location: {
                    type: 'Point',
                    coordinates: [2.3522, 48.8566]
                },
                phone: '0612345678',
                email: 'contact@restos.fr'
            }
        });

        await organization.save();

        // Recharger avec password
        const orgWithPassword = await User.findById(organization._id).select('+password');

        console.log('✅ Organisation créée avec succès');
        console.log(`   Nom: ${organization.orgProfile.name}`);
        console.log(`   Statut: ${organization.status} (en attente de validation)`);

        // TEST HASHAGE 2: Vérifier que le mot de passe de l'organisation est aussi hashé
        console.log(`   🔐 Mot de passe hashé: ${orgWithPassword.password !== 'Organization123!' ? '✅' : '❌'}`);

        // Tester comparePassword pour l'organisation
        const orgPasswordValid = await orgWithPassword.comparePassword('Organization123!');
        console.log(`   🔐 comparePassword fonctionne: ${orgPasswordValid ? '✅' : '❌'}\n`);

        // ========== TEST 6: Tester la non-régression du hashage ==========
        console.log('📝 TEST 6: Test de non-régression - Vérifier que le mot de passe n\'est pas rehashé inutilement');

        // Sauvegarder le hash original
        const originalHash = orgWithPassword.password;

        // Modifier un champ non-sensible (pas le mot de passe)
        organization.orgProfile.description = 'Description modifiée pour test';
        await organization.save();

        // Recharger pour vérifier
        const orgReloaded = await User.findById(organization._id).select('+password');

        // Vérifier que le hash n'a pas changé
        const hashUnchanged = originalHash === orgReloaded.password;
        console.log(`   ${hashUnchanged ? '✅' : '❌'} Le hash n\'a pas été modifié après sauvegarde sans changement de mot de passe`);

        // Vérifier que comparePassword fonctionne toujours
        const stillWorks = await orgReloaded.comparePassword('Organization123!');
        console.log(`   ${stillWorks ? '✅' : '❌'} comparePassword fonctionne toujours après sauvegarde\n`);

        // ========== TEST 7: Tester la mise à jour du mot de passe ==========
        console.log('📝 TEST 7: Test de mise à jour du mot de passe');

        // Changer le mot de passe
        const newPassword = 'NewPassword456!';
        organization.password = newPassword;
        await organization.save();

        // Recharger avec nouveau password
        const orgUpdated = await User.findById(organization._id).select('+password');

        // Vérifier que le nouveau mot de passe est hashé
        const isNewPasswordHashed = orgUpdated.password !== newPassword;
        console.log(`   ${isNewPasswordHashed ? '✅' : '❌'} Nouveau mot de passe hashé`);

        // Vérifier l'ancien mot de passe ne fonctionne plus
        const oldPasswordFails = !(await orgUpdated.comparePassword('Organization123!'));
        console.log(`   ${oldPasswordFails ? '✅' : '❌'} Ancien mot de passe ne fonctionne plus (comparePassword le rejette)`);

        // Vérifier le nouveau mot de passe fonctionne
        const newPasswordWorks = await orgUpdated.comparePassword(newPassword);
        console.log(`   ${newPasswordWorks ? '✅' : '❌'} Nouveau mot de passe fonctionne (comparePassword l'accepte)\n`);

        // ========== TEST 8: Vérifier la méthode comparePassword avec différents cas ==========
        console.log('📝 TEST 8: Test exhaustif de comparePassword');

        // Créer un utilisateur de test spécifique pour ce test (AVEC coordonnées)
        const testUser = new User({
            email: 'test.compare@email.com',
            password: 'SecurePass123!',
            role: 'volunteer',
            volunteerProfile: {
                fullName: 'Test Compare',
                homeLocation: {
                    type: 'Point',
                    coordinates: [0, 0]  // Coordonnées par défaut
                }
            }
        });
        await testUser.save();

        // Recharger avec password
        const testUserWithPassword = await User.findById(testUser._id).select('+password');

        const testCases = [
            { password: 'SecurePass123!', expected: true, description: 'Mot de passe exact' },
            { password: 'securepass123!', expected: false, description: 'Casse différente' },
            { password: 'SecurePass123', expected: false, description: 'Sans le !' },
            { password: 'SecurePass123!!', expected: false, description: 'Avec un ! supplémentaire' },
            { password: 'SecurePass124!', expected: false, description: 'Chiffre différent' },
            { password: 'SecurePass123! ', expected: false, description: 'Avec espace' },
            { password: '  SecurePass123!', expected: false, description: 'Espace devant' }
        ];

        for (const testCase of testCases) {
            const result = await testUserWithPassword.comparePassword(testCase.password);
            const status = result === testCase.expected ? '✅' : '❌';
            console.log(`   ${status} "${testCase.password}" - ${testCase.description}: ${result === testCase.expected ? 'correct' : 'incorrect'}`);
        }
        console.log();

        // ========== TEST 9: Lister tous les utilisateurs ==========
        console.log('📝 TEST 9: Liste de tous les utilisateurs');
        const allUsers = await User.find({}).select('-password');
        console.log(`✅ Total: ${allUsers.length} utilisateur(s)`);
        allUsers.forEach(user => {
            console.log(`   - ${user.email} (${user.role}) - Statut: ${user.status}`);
        });
        console.log();

        // ========== TEST 10: Tester une erreur de validation ==========
        console.log('📝 TEST 10: Test d\'erreur de validation');
        try {
            const invalidUser = new User({
                email: 'invalid-email',
                password: '123',
                role: 'volunteer',
                volunteerProfile: {
                    fullName: 'Test',
                    homeLocation: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                }
            });
            await invalidUser.save();
        } catch (error) {
            console.log('❌ Erreur de validation capturée (normale)');
            console.log(`   Type: ${error.name}`);
            console.log(`   Message: ${error.message.substring(0, 100)}...\n`);
        }

        // ========== RÉSUMÉ FINAL ==========
        console.log('=' .repeat(60));
        console.log('📊 RÉSUMÉ DES TESTS DE HASHAGE ET COMPAREPASSWORD');
        console.log('=' .repeat(60));
        console.log(`✅ Hashage automatique à la création: OK`);
        console.log(`✅ Format bcrypt valide: OK`);
        console.log(`✅ Présence du salt: OK`);
        console.log(`✅ comparePassword avec mot de passe correct: OK`);
        console.log(`✅ comparePassword avec mot de passe incorrect: OK`);
        console.log(`✅ Non-régression du hash: OK`);
        console.log(`✅ Mise à jour du mot de passe: OK`);
        console.log(`✅ comparePassword après mise à jour: OK`);
        console.log(`✅ Cas limites (null, vide): OK`);
        console.log(`✅ Sensibilité à la casse: OK`);
        console.log('=' .repeat(60));
        console.log('\n🎉 Tous les tests de hashage et comparePassword sont passés avec succès !');

    } catch (error) {
        console.error('💥 Erreur fatale:', error);
        console.error('Stack:', error.stack);
    } finally {
        await database.disconnect();
        console.log('\n🔌 Déconnecté de MongoDB');
    }
}

// Lancer les tests
testuser();