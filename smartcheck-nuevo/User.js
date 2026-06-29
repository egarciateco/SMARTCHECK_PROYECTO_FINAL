// smartcheck-backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  correo: { 
    type: String,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    default: null 
  },
  nombre: { 
    type: String, 
    required: true,
    trim: true
  },
  apellido: { 
    type: String, 
    required: true,
    trim: true
  },
  sexo: { 
    type: String, 
    default: 'M' 
  },
  facialDescriptor: { 
    type: [Number], // Almacena estrictamente los 128 números biométricos
    default: [] 
  },
  faceData: { 
    type: [Number], // Reflejo por compatibilidad con código móvil anterior
    default: [] 
  },
  foto: { 
    type: String,   // Almacena estrictamente el String Base64 largo
    default: null 
  },
  image: {  // Duplicado de seguridad para frontend
    type: String,
    default: null
  },
  authMethod: { 
    type: String, 
    default: 'face' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// 🔥 MIDDLEWARE ULTRA-SEGURO: Limpia y duplica los datos antes de guardar
userSchema.pre('save', function(next) {
  // 1. Forzar sincronización de emails
  if (this.email) {
    this.correo = this.email.toLowerCase().trim();
    this.email = this.email.toLowerCase().trim();
  }

  // 2. Control estricto de la foto (Evitar que se guarden arrays de números como String)
  let fotoValida = this.foto || this.image;
  
  if (fotoValida) {
    // Si por error del frontend llega un objeto o array en vez de un String Base64, lo anulamos
    if (typeof fotoValida !== 'string' || !fotoValida.startsWith('data:image')) {
      console.log('⚠️ [Mongoose Pre-Save] Se detectó un formato inválido de foto. Reestableciendo a null.');
      fotoValida = null;
    }
  }
  
  this.foto = fotoValida;
  this.image = fotoValida;

  // 3. Control y sincronización de vectores biométricos
  if (this.facialDescriptor && this.facialDescriptor.length > 0) {
    this.faceData = this.facialDescriptor;
  } else if (this.faceData && this.faceData.length > 0) {
    this.facialDescriptor = this.faceData;
  }

  next();
});

module.exports = mongoose.model('User', userSchema);