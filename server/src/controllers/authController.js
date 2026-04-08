import User from "../models/User.js";
import { generateToken, generateRefreshToken } from "../utils/generateToken.js";
import crypto from 'crypto';

const registerVolunteer = async (req, res) => {
    try {
        const { email, password, fullName, ...otherData } = req.body;

        // 1. Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email déjà utilisé'
            });
        }

        // 2. Générer token de vérification
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // 3. Créer l'utilisateur (status 'pending' pour bénévole aussi)
        const user = new User({
            email,
            password,
            role: 'volunteer',
            status: 'pending',  // ← Changé: 'pending' au lieu de 'active'
            isEmailVerified: false,
            emailVerificationToken: verificationToken,  // ← Token stocké
            volunteerProfile: {
                fullName,
                ...otherData
            }
        });

        // 4. Sauvegarder en base
        await user.save();

        // 5. TODO: Envoyer email de vérification
        // const verificationLink = `http://localhost:3000/api/auth/verify-email/${verificationToken}`;
        // await sendEmail(user.email, verificationLink);

        // 6. Réponse (pas de token car email non vérifié)
        res.status(201).json({
            success: true,
            message: 'Compte créé avec succès. Veuillez vérifier votre email pour activer votre compte.',
            data: {
                userId: user._id,
                email: user.email,
                role: user.role,
                status: user.status,
                isEmailVerified: false
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const registerOrganization = async (req, res) => {
    try {
        const { email, password, orgName, siret, description, address, phone, ...otherData } = req.body;

        // 1. Vérifier email unique
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email déjà utilisé'
            });
        }

        // 2. Générer token de vérification
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // 3. Créer l'organisation
        const user = new User({
            email,
            password,
            role: 'organization',
            status: 'pending',  // En attente de vérification email + validation admin
            isEmailVerified: false,
            emailVerificationToken: verificationToken,
            orgProfile: {
                name: orgName,
                siret,
                description,
                address: address || {},
                phone,
                ...otherData
            }
        });

        // 4. Sauvegarder
        await user.save();

        // 5. TODO: Envoyer email de vérification
        // const verificationLink = `http://localhost:3000/api/auth/verify-email/${verificationToken}`;
        // await sendEmail(user.email, verificationLink);

        res.status(201).json({
            success: true,
            message: 'Organisation créée avec succès. Veuillez vérifier votre email. Un administrateur validera votre compte.',
            data: {
                userId: user._id,
                email: user.email,
                role: user.role,
                status: user.status,
                isEmailVerified: false
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ✅ Fonction de vérification d'email
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // Chercher l'utilisateur avec ce token
        const user = await User.findOne({
            emailVerificationToken: token,
            isEmailVerified: false
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token invalide ou déjà utilisé'
            });
        }

        // Activer le compte
        user.isEmailVerified = true;
        user.status = 'active';  // ← Passer à 'active'
        user.emailVerificationToken = undefined;  // Supprimer le token

        await user.save();

        // Générer les tokens pour connexion automatique
        const accessToken = generateToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        res.json({
            success: true,
            message: 'Email vérifié avec succès !',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    status: user.status
                },
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ✅ Modifier la connexion pour vérifier l'email
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        // ✅ VÉRIFIER SI EMAIL EST CONFIRMÉ
        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Veuillez vérifier votre email avant de vous connecter'
            });
        }

        // Vérifier le statut
        if (user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'Votre compte a été suspendu'
            });
        }

        if (user.status === 'pending' && user.role === 'organization') {
            return res.status(403).json({
                success: false,
                message: 'Votre compte est en attente de validation par un administrateur'
            });
        }

        // Mettre à jour lastLogin
        user.lastLogin = new Date();

        // Générer les tokens
        const accessToken = generateToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        // Préparer la réponse
        let userResponse = {
            id: user._id,
            email: user.email,
            role: user.role,
            status: user.status
        };

        if (user.role === 'volunteer' && user.volunteerProfile) {
            userResponse.fullName = user.volunteerProfile.fullName;
        } else if (user.role === 'organization' && user.orgProfile) {
            userResponse.orgName = user.orgProfile.name;
        }

        res.json({
            success: true,
            message: 'Connexion réussie',
            user: userResponse,
            accessToken,
            refreshToken
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export {
    registerVolunteer,
    registerOrganization,
    verifyEmail,
    login
};