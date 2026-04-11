// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';



const userSchema = new mongoose.Schema({
    // ========== CHAMPS COMMUNS ==========
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Email invalide']
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    role: {
        type: String,
        enum: ['volunteer', 'organization', 'admin'],
        required: true,
        immutable: true
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended', 'rejected'],
        default: function() {
            return this.role === 'organization' ? 'pending' : 'active';
        }
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    refreshToken: {
        type: String,
        select: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        select: false
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    },

    // ========== PRÉFÉRENCES COMMUNES ==========
    notificationPreferences: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        frequency: {
            type: String,
            enum: ['instant', 'daily', 'weekly'],
            default: 'instant'
        },
        quietHours: {
            start: { type: String, default: '22:00' },
            end: { type: String, default: '08:00' }
        }
    },

    // ========== PROFIL BÉNÉVOLE ==========
    volunteerProfile: {
        fullName: { type: String, trim: true },
        birthDate: Date,
        postalCode: { type: String, match: [/^\d{5}$/, 'Code postal invalide'] },
        city: String,
        phone: { type: String, match: [/^(\+33|0)[1-9]\d{8}$/, 'Numéro de téléphone invalide'] },
        interests: [{
            type: String,
            enum: ['environment', 'education', 'health', 'social', 'animals', 'culture', 'sports', 'emergency']
        }],
        availability: [{
            type: String,
            enum: ['weekend', 'weekday_evening', 'weekday_day', 'holidays', 'full_time']
        }],
        skills: [{
            type: String,
            enum: ['teaching', 'first_aid', 'cooking', 'driving', 'administration', 'it', 'communication', 'translation']
        }],
        stats: {
            totalHours: { type: Number, default: 0, min: 0 },
            completedMissions: { type: Number, default: 0, min: 0 },
            averageRating: { type: Number, default: 0, min: 0, max: 5 }
        },
        badges: [{
            type: String,
            enum: ['first_mission', 'reliable', 'star_volunteer', '100_hours', 'emergency_hero']
        }],
        photoUrl: { type: String, match: [/^https?:\/\/.+/, 'URL invalide'] },
        bio: { type: String, maxlength: 500 },
        homeLocation: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: { type: [Number] }
        },
        interventionRadius: { type: Number, default: 20, min: 5, max: 100 }
    },

    // ========== PROFIL ORGANISATION ==========
    orgProfile: {
        name: { type: String, trim: true },
        type: { type: String, enum: ['Association', 'ONG', 'Fondation', 'Collectif'] },
        siret: { type: String, match: [/^\d{14}$/, 'SIRET invalide (14 chiffres)'] },
        rna: { type: String, match: [/^W\d{9}$/, 'RNA invalide (ex: W123456789)'] },
        legalDocs: [{
            name: String,
            url: String,
            uploadedAt: { type: Date, default: Date.now }
        }],
        description: { type: String, maxlength: 5000 },
        address: {
            street: String,
            postalCode: { type: String, match: /^\d{5}$/ },
            city: String,
            country: { type: String, default: 'France' }
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: { type: [Number] }
        },
        phone: { type: String, match: [/^(\+33|0)[1-9]\d{8}$/, 'Numéro de téléphone invalide'] },
        email: { type: String, lowercase: true },
        website: { type: String, match: [/^https?:\/\/.+/, 'URL invalide'] },
        socials: {
            facebook: String,
            instagram: String,
            linkedin: String,
            twitter: String
        },
        openingHours: {
            monday: String,
            tuesday: String,
            wednesday: String,
            thursday: String,
            friday: String,
            saturday: String,
            sunday: String
        },
        team: [{
            name: String,
            role: String,
            email: String,
            phone: String
        }],
        volunteerCharter: { name: String, url: String },
        gallery: [{
            url: String,
            caption: String,
            uploadedAt: { type: Date, default: Date.now }
        }],
        stats: {
            totalMissions: { type: Number, default: 0 },
            totalVolunteers: { type: Number, default: 0 },
            totalHours: { type: Number, default: 0 },
            averageRating: { type: Number, default: 0 }
        },
        isVerified: { type: Boolean, default: false },
        verifiedAt: Date,
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },

    // ========== PROFIL ADMIN ==========
    adminProfile: {
        fullName: String,
        permissions: [{
            type: String,
            enum: ['moderate_content', 'validate_organizations', 'manage_users', 'view_stats', 'manage_system']
        }],
        role: {
            type: String,
            enum: ['super_admin', 'moderator', 'analyst'],
            default: 'moderator'
        },
        lastAction: Date,
        actionLog: [{
            action: String,
            targetId: mongoose.Schema.Types.ObjectId,
            targetType: String,
            timestamp: { type: Date, default: Date.now }
        }]
    }
}, {
    timestamps: true,
    strict: true,
    minimize: false
});

// ========== MIDDLEWARE POUR NETTOYER LES PROFILS ==========
userSchema.pre('save', async function() {
    // Ne pas rehasher si le mot de passe n'est pas modifié
    if (!this.isModified('password')) return;

    try {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw new Error(`Erreur lors du hashage du mot de passe: ${error.message}`);
    }

});

userSchema.pre('save', function() {

    // Supprimer orgProfile si ce n'est pas une organisation
    if (this.role !== 'organization') {
        this.orgProfile = undefined;
    }
    // Supprimer adminProfile si ce n'est pas un admin
    if (this.role !== 'admin') {
        this.adminProfile = undefined;
    }
    // Supprimer volunteerProfile si ce n'est pas un bénévole
    if (this.role !== 'volunteer') {
        this.volunteerProfile = undefined;
    }
});

// ========== MÉTHODES ==========
userSchema.methods.addVolunteerHours = async function(hours) {
    if (this.role === 'volunteer' && this.volunteerProfile) {
        this.volunteerProfile.stats.totalHours += hours;
        this.volunteerProfile.stats.completedMissions += 1;

        if (this.volunteerProfile.stats.totalHours >= 100 &&
            !this.volunteerProfile.badges.includes('100_hours')) {
            this.volunteerProfile.badges.push('100_hours');
        }

        await this.save();
    }
};

// backend/src/models/User.js

// Méthode comparePassword plus robuste
userSchema.methods.comparePassword = async function(candidate) {
    // Vérifier que candidate est une string
    if (!candidate || typeof candidate !== 'string') {
        return false;
    }

    // Vérifier que this.password existe et est une string
    if (!this.password || typeof this.password !== 'string') {
        return false;
    }

    try {
        return await bcrypt.compare(candidate, this.password);
    } catch (error) {
        console.error('Error comparing passwords:', error);
        return false;
    }
}

userSchema.methods.isActive = function() {
    return this.status === 'active' && this.isEmailVerified;
};

// ========== STATIQUES ==========
userSchema.statics.findVolunteersNear = function(lng, lat, maxDistance = 20000) {
    return this.find({
        role: 'volunteer',
        status: 'active',
        'volunteerProfile.homeLocation': {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: maxDistance
            }
        }
    });
};

userSchema.statics.findOrganizationsNear = function(lng, lat, maxDistance = 20000) {
    return this.find({
        role: 'organization',
        status: 'active',
        'orgProfile.isVerified': true,
        'orgProfile.location': {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: maxDistance
            }
        }
    });
};

// ========== INDEX ==========
userSchema.index({ 'volunteerProfile.homeLocation': '2dsphere' });
userSchema.index({ 'orgProfile.location': '2dsphere' });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'volunteerProfile.postalCode': 1 });
userSchema.index({ 'orgProfile.name': 1 });
userSchema.index({ 'volunteerProfile.stats.totalHours': -1 });

// ========== EXPORT ==========
export default mongoose.model('User', userSchema);