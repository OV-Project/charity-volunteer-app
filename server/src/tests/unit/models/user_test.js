// user_test.js - Version simplifiée
import User from '../../../models/User.js'
import database from '../../../config/database.js'
;

async function testuser() {
    try {
        await database.connect();
        console.log('✅ Base de données connectée\n');

        // 2. Supprimer les anciens tests (optionnel)
        await User.deleteMany({ email: /test@/ });
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
                    coordinates: [2.3522, 48.8566]
                }
            }
        });

        await volunteer.save();
        console.log('✅ Bénévole créé avec succès');
        console.log(`   ID: ${volunteer._id}`);
        console.log(`   Email: ${volunteer.email}`);
        console.log(`   Rôle: ${volunteer.role}`);
        console.log(`   Statut: ${volunteer.status}\n`);

        // ========== TEST 2: Lire le bénévole ==========
        console.log('📝 TEST 2: Lecture du bénévole');
        const foundVolunteer = await User.findById(volunteer._id);
        console.log(`✅ Bénévole trouvé: ${foundVolunteer.email}`);
        console.log(`   Nom: ${foundVolunteer.volunteerProfile.fullName}`);
        console.log(`   Code postal: ${foundVolunteer.volunteerProfile.postalCode}\n`);

        // ========== TEST 3: Créer une organisation ==========
        console.log('📝 TEST 3: Création d\'une organisation');
        const organization = new User({
            email: 'restos@coeur.fr',
            password: 'Organization123!',
            role: 'organization',
            orgProfile: {
                name: 'Restos du Coeur',
                type: 'Association',
                siret: '12345678901234',
                description: 'Aide alimentaire pour les personnes dans le besoin...'.repeat(20),
                address: {
                    street: '10 rue de Paris',
                    postalCode: '75001',
                    city: 'Paris'
                },
                location: {
                    coordinates: [2.3522, 48.8566]
                },
                phone: '0612345678',
                email: 'contact@restos.fr'
            }
        });

        await organization.save();
        console.log('✅ Organisation créée avec succès');
        console.log(`   Nom: ${organization.orgProfile.name}`);
        console.log(`   Statut: ${organization.status} (en attente de validation)\n`);

        // ========== TEST 4: Lister tous les utilisateurs ==========
        console.log('📝 TEST 4: Liste de tous les utilisateurs');
        const allUsers = await User.find({});
        console.log(`✅ Total: ${allUsers.length} utilisateur(s)`);
        allUsers.forEach(user => {
            console.log(`   - ${user.email} (${user.role})`);
        });
        console.log();

        // ========== TEST 5: Tester une erreur de validation ==========
        console.log('📝 TEST 5: Test d\'erreur (volontaire)');
        try {
            const invalidUser = new User({
                email: 'invalid-email',  // Email invalide
                password: '123',          // Trop court
                role: 'volunteer'
                // Pas de volunteerProfile alors que role=volunteer
            });
            await invalidUser.save();
        } catch (error) {
            console.log('❌ Erreur de validation (normale)');
            console.log(`   Message: ${error.message}`);
            console.log(`   Type: ${error.name}\n`);
        }

        console.log('🎉 Tous les tests terminés avec succès !');

    } catch (error) {
        console.error('💥 Erreur:', error.message);
    } finally {
        await database.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

testuser();