const { Sequelize } = require('sequelize');
require('dotenv').config();

const usePostgres = process.env.USE_POSTGRES === 'true';

let sequelize;

if (usePostgres) {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'smartcheck',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || 'password',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres',
      logging: false
    }
  );
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
  });
}

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    return false;
  }
}

async function syncModels() {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados');
  } catch (error) {
    console.error('❌ Error sincronizando modelos:', error.message);
  }
}

module.exports = { sequelize, testConnection, syncModels };