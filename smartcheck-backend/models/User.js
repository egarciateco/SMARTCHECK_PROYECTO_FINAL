const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  correo: { type: String, trim: true, lowercase: true },
  password: { type: String, default: null },
  nombre: { type: String, required: true, trim: true },
  apellido: { type: String, required: true, trim: true },
  sexo: { type: String, default: 'M' },
  fechaNacimiento: { type: String },
  localidad: { type: String },
  provincia: { type: String },
  facialDescriptor: { type: [Number], default: [] },
  faceData: { type: [Number], default: [] },
  foto: { type: String, default: null },
  image: { type: String, default: null },
  authMethod: { type: String, default: 'face' },
  createdAt: { type: Date, default: Date.now }
}, { 
  strict: false, // Permite guardar campos extras sin rechazar la operación
  collection: 'users' 
});

userSchema.pre('save', function(next) {
  if (this.email) {
    this.correo = this.email.toLowerCase().trim();
    this.email = this.email.toLowerCase().trim();
  }
  let fotoValida = this.foto || this.image;
  if (fotoValida && (typeof fotoValida !== 'string' || !fotoValida.startsWith('data:image'))) {
    fotoValida = null;
  }
  this.foto = fotoValida;
  this.image = fotoValida;
  if (this.facialDescriptor && this.facialDescriptor.length > 0) {
    this.faceData = this.facialDescriptor;
  } else if (this.faceData && this.faceData.length > 0) {
    this.facialDescriptor = this.faceData;
  }
  next();
});

// Mensaje de diagnóstico para confirmar la DB al cargar el modelo
mongoose.connection.on('open', () => {
    console.log("🔥 EL MODELO USER SE ESTÁ REGISTRANDO EN LA DB:", mongoose.connection.db ? mongoose.connection.db.databaseName : "desconocida");
});

// FORZAR uso de la conexión activa actual para evitar redirección a 'test'
module.exports = mongoose.connection.models.User || mongoose.model('User', userSchema, 'users');