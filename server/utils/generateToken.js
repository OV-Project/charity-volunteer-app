// utils/generateToken.js
import jwt from 'jsonwebtoken';

/**
 * Génère un token JWT pour un utilisateur
 * @param {Object} user - L'utilisateur MongoDB
 * @returns {string} Le token JWT
 */
export const generateToken = (user) => {
    try {
        // Vérifier que la clé secrète existe
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET non défini dans .env');
        }

        // Créer le payload (ce qu'on veut stocker dans le token)
        const payload = {
            id: user._id.toString(),  // Convertir ObjectId en string
            email: user.email,
            role: user.role
        };

        // Options du token
        const options = {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'  // '7d' = 7 jours
        };

        // Générer le token (version synchrone)
        const token = jwt.sign(payload, process.env.JWT_SECRET, options);

        return token;
    } catch (error) {
        console.error('Erreur génération token:', error.message);
        throw new Error('Impossible de générer le token');
    }
};
export const generateRefreshToken = (user) => {
    try{
        if (!process.env.JWT_REFRESH_SECRET) {
            throw new Error('JWT_REFRESH_SECRET non défini dans .env');
        }

        const payload = { id: user._id.toString() , email : user.email}; // Minimal payload for refresh
        const options = { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' };
        return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, options);
    }catch(error){
        console.error('Erreur génération token:', error.message);
        throw new Error('Impossible de générer le token');
    }
}

export const verifyToken = (token, isRefresh = false) => {
    const secret = isRefresh ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
    return jwt.verify(token, secret);
};