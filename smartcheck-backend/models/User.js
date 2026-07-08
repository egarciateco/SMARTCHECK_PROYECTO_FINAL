const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  correo: { type: String, trim: true, lowercase: true },
  password: { type: String, default: null },
  nombre: { type: String, required: true, trim: true },
  apellido: { type: String, required: true, trim: true },
  sexo: { type: String, default: 'M' },
  fechaNacimiento: { type: String },
  dia: { type: String },
  mes: { type: String },
  anio: { type: String },
  localidad: { type: String },
  provincia: { type: String },
  facialDescriptor: { type: [Number], default: [] },
  faceData: { type: [Number], default: [] },
  faceDescriptor: { type: [Number], default: [] },
  foto: { type: String, default: null },
  image: { type: String, default: null },
  rol: { type: String, default: 'user' },
  authMethod: { type: String, default: 'face' },
  createdAt: { type: Date, default: Date.now }
}, { 
  strict: false, 
  collection: 'users' 
});

userSchema.pre('save', function(next) {
  // Sincronización de correos
  const emailLimpio = this.email || this.correo;
  if (emailLimpio) {
    this.email = emailLimpio.toLowerCase().trim();
    this.correo = emailLimpio.toLowerCase().trim();
  }
  
  // Sincronización automática de componentes de fecha si falta alguno
  if (this.dia && this.mes && this.anio && !this.fechaNacimiento) {
    this.fechaNacimiento = `${String(this.dia).padStart(2, '0')}/${String(this.mes).padStart(2, '0')}/${this.anio}`;
  } else if (this.fechaNacimiento && (!this.dia || !this.mes || !this.anio)) {
    const partes = this.fechaNacimiento.split('/');
    if (partes.length === 3) {
      this.dia = partes[0];
      this.mes = partes[1];
      this.anio = partes[2];
    }
  }

  // Sincronización de fotos
  let fotoValida = this.foto || this.image;
  if (fotoValida && (typeof fotoValida !== 'string' || !fotoValida.startsWith('data:image'))) {
    fotoValida = null;
  }
  this.foto = fotoValida;
  this.image = fotoValida;

  // Sincronización de descriptores faciales
  if (this.facialDescriptor && this.facialDescriptor.length > 0) {
    this.faceData = this.facialDescriptor;
    this.faceDescriptor = this.facialDescriptor;
  } else if (this.faceData && this.faceData.length > 0) {
    this.facialDescriptor = this.faceData;
    this.faceDescriptor = this.faceData;
  }
  
  next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');
module.exports = User;