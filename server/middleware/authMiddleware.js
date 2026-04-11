// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware pour protéger les routes
 * Vérifie que l'utilisateur est authentifié
 */
export const protect = async (req, res, next) => {
    let token;

    try {
        // 1. Récupérer le token du header Authorization
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer')) {
            // Format: "Bearer eyJhbGciOiJIUzI1NiIs..."
            token = authHeader.split(' ')[1];
        }

        // 2. Vérifier si le token existe
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Non authentifié. Veuillez vous connecter.'
            });
        }

        // 3. Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Récupérer l'utilisateur complet (sans le mot de passe)
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Utilisateur non trouvé. Token invalide.'
            });
        }

        // 5. Vérifier si le compte est actif
        if (user.status === 'suspended') {
            return res.status(401).json({
                success: false,
                error: 'Compte suspendu. Contactez l\'administrateur.'
            });
        }

        // 6. Attacher l'utilisateur à req.user
        req.user = user;
        next();

    } catch (error) {
        // Gérer les différents types d'erreurs JWT
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Token invalide.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expiré. Veuillez vous reconnecter.'
            });
        }

        // Autres erreurs
        console.error('Erreur auth middleware:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de l\'authentification.'
        });
    }
};

/**
 * Middleware optionnel : vérifie si token existe mais ne bloque pas
 * Utile pour les routes qui peuvent être publiques ou privées
 */
export const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (user && user.status === 'active') {
                req.user = user;
            }
        } catch (error) {
            // Ignorer les erreurs, l'utilisateur reste non authentifié
        }
    }
    next();
};