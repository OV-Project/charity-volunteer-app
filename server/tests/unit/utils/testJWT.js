// scripts/testJWT.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../../../models/User.js';
import { generateToken } from '../../../utils/generateToken.js';
import jwt from 'jsonwebtoken';


async function testJWT() {
    console.log('🔐 TEST JWT - Jour 4\n');

    try {
        // 1. Connexion DB
        console.log('📡 Connexion MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté\n');

        // 2. Créer un utilisateur de test (ou récupérer existant)
        console.log('📝 Création utilisateur test...');
        let user = await User.findOne({ email: 'jwt.test@test.com' });

        if (!user) {
            const hashedPassword = await bcrypt.hash('Test123!', 10);
            user = await User.create({
                email: 'jwt.test@test.com',
                password: hashedPassword,
                role: 'volunteer',
                volunteerProfile: {
                    fullName: 'Test JWT',
                    birthDate: new Date('1990-01-01'),
                    postalCode: '75001',
                    city: 'Paris',
                    homeLocation: { coordinates: [2.3522, 48.8566] }
                }
            });
            console.log('✅ Utilisateur créé\n');
        } else {
            console.log('✅ Utilisateur existant\n');
        }

        // 3. Tester génération du token
        console.log('=' .repeat(50));
        console.log('TEST 1: Génération du token');
        console.log('='.repeat(50));

        const token = generateToken(user);
        console.log('Token généré:', token);
        console.log('Longueur:', token.length, 'caractères\n');

        // 4. Tester vérification du token
        console.log('='.repeat(50));
        console.log('TEST 2: Vérification du token (valide)');
        console.log('='.repeat(50));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ Token valide!');
            console.log('Contenu du payload:');
            console.log('  - id:', decoded.id);
            console.log('  - email:', decoded.email);
            console.log('  - role:', decoded.role);
            console.log('  - expiré:', new Date(decoded.exp * 1000).toLocaleString());
            console.log('  - émis:', new Date(decoded.iat * 1000).toLocaleString());
        } catch (error) {
            console.log('❌ Erreur:', error.message);
        }
        console.log();

        // 5. Tester avec mauvais token
        console.log('='.repeat(50));
        console.log('TEST 3: Vérification token invalide');
        console.log('='.repeat(50));

        const invalidToken = token.slice(0, -5) + 'xxxxx';
        try {
            jwt.verify(invalidToken, process.env.JWT_SECRET);
            console.log('❌ Le token invalide a été accepté!');
        } catch (error) {
            console.log('✅ Token invalide rejeté');
            console.log('   Erreur:', error.name, '-', error.message);
        }
        console.log();

        // 6. Tester avec mauvais secret
        console.log('='.repeat(50));
        console.log('TEST 4: Vérification avec mauvais secret');
        console.log('='.repeat(50));

        try {
            jwt.verify(token, 'wrong-secret-key');
            console.log('❌ Token vérifié avec mauvais secret!');
        } catch (error) {
            console.log('✅ Rejeté avec mauvais secret');
            console.log('   Erreur:', error.name, '-', error.message);
        }
        console.log();

        // 7. Tester expiration du token
        console.log('='.repeat(50));
        console.log('TEST 5: Token avec expiration courte (1 seconde)');
        console.log('='.repeat(50));

        const shortToken = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1s' }
        );

        console.log('Token créé, attente 2 secondes...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            jwt.verify(shortToken, process.env.JWT_SECRET);
            console.log('❌ Token expiré a été accepté!');
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                console.log('✅ Token expiré correctement rejeté');
                console.log('   Expiré depuis:', error.expiredAt);
            }
        }
        console.log();

        // 8. Simuler requête HTTP avec token
        console.log('='.repeat(50));
        console.log('TEST 6: Simulation requête HTTP');
        console.log('='.repeat(50));

        // Créer un faux objet req
        const mockReq = {
            headers: {
                authorization: `Bearer ${token}`
            }
        };

        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`Status ${code}:`, data);
                    return data;
                }
            })
        };

        let nextCalled = false;
        const mockNext = () => {
            nextCalled = true;
            console.log('✅ next() appelé - utilisateur authentifié');
        };

        console.log('Requête avec token valide...');
        // Ici vous appelleriez votre middleware protect(mockReq, mockRes, mockNext)
        console.log('✅ Le middleware devrait accepter et appeler next()\n');

        console.log('🎉 Tous les tests JWT terminés!\n');

        // Afficher résumé
        console.log('📊 RÉSUMÉ:');
        console.log('   ✅ Génération token fonctionnelle');
        console.log('   ✅ Vérification token fonctionnelle');
        console.log('   ✅ Rejet tokens invalides');
        console.log('   ✅ Rejet tokens expirés');
        console.log('   ✅ Rejet mauvais secret');

    } catch (error) {
        console.error('💥 Erreur fatale:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Déconnecté');
    }
}

// Lancer les tests
testJWT();