import mongoose from 'mongoose';


const missionSchema = new mongoose.Schema({

    organizationId : {
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        required : true,
        index : true
    },

    title : {
        type : String,
        required : true,
        trim : true,
        maxlength : 50
    },

    category : {
        type : String,
        required : true,
        enum : ['Environment','Education','Health','Social','Animals','Culture','Sports']
    },

    description : {
        type : String,
        required : true,
        minlength : 50,
        maxlength : 5000
    },

    type : {
        type : String,
        required : true,
        enum : ['online','presential'],
        default : 'presential'
    },

    address: {
    street: String,
    postalCode: String,
    city: String,
    fullAddress: String
    },
    
    location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: function() { return this.type === 'presential'; },
      validate: {
        validator: function(coords) {
          return !coords || (coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 &&
                 coords[1] >= -90 && coords[1] <= 90);
            }
        }
    }
    },

    // Dates et horaires

    startDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'La date de début doit être dans le futur'
    }
    },

    endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        return date > this.startDate;
      },
      message: 'La date de fin doit être après la date de début'
    }
    },

      // Capacité
    slotsTotal: {
    type: Number,
    required: true,
    min: 1,
    max: 200
    },

      slotsFilled: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: function(value) {
        return value <= this.slotsTotal;
      },
      message: 'Les places remplies ne peuvent pas dépasser le total'
    }
    },

      // Compétences et prérequis
    requiredSkills: [{
        type: String,
        enum: ['teaching', 'first_aid', 'cooking', 'driving', 'administration', 'it', 'communication', 'translation']
    }],
    equipmentProvided: {
        type: Boolean,
        default: false
    },
    equipmentNeeded: [String],
    
    // Média
    images: [{
        url: String,
        caption: String
    }],
    
    // Options
    isUrgent: {
        type: Boolean,
        default: false
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringPattern: {
        type: String,
        enum: ['weekly', 'monthly'],
        required: function() { return this.isRecurring; }
    },
    
    // Contact spécifique
    contactPerson: {
        name: String,
        email: String,
        phone: String
    },

      // Statut
    status: {
        type: String,
        enum: ['draft', 'open', 'closed', 'cancelled', 'completed'],
        default: 'draft'
    },
    
    // QR Code pour check-in
    qrCode: {
        type: String,
        unique: true,
        sparse: true
    },
    
    // Métriques
    viewCount: {
        type: Number,
        default: 0
    },
    applicationCount: {
        type: Number,
        default: 0
    },
    
    // Audit
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cancelledAt: Date,
    cancelledReason: String
    }, {
    timestamps: true
    });



    // ========== INDEX ==========
missionSchema.index({ organizationId: 1, status: 1 });
missionSchema.index({ location: '2dsphere' });
missionSchema.index({ startDate: 1, status: 1 });
missionSchema.index({ category: 1, status: 1 });
missionSchema.index({ isUrgent: 1, status: 1 });
missionSchema.index({ title: 'text', description: 'text' });  // Recherche plein texte

// Index partiel pour les missions ouvertes
missionSchema.index(
    { startDate: 1, slotsFilled: 1, slotsTotal: 1 },
    { partialFilterExpression: {status: 'open'}, name: 'idx_open_missions'}

);

// Index partiel pour les missions urgentes
missionSchema.index(
  { startDate: 1, category: 1 },
  { partialFilterExpression: { isUrgent: true, status: 'open' }, name: 'idx_urgent_missions' }
);

// ========== MÉTHODES ==========

missionSchema.methods.hasAvailableSlots = function () {
    return this.slotsFilled < this.slotsTotal;
}

missionSchema.methods.getAvailableSlots = function() {
  return this.slotsTotal - this.slotsFilled;
};

missionSchema.methods.incrementApplications = async function() {
  this.applicationCount += 1;
  await this.save();
};


export default mongoose.model('Mission', missionSchema);