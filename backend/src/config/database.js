import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      // SSL is required for Supabase connections
      ssl: process.env.NODE_ENV === 'production' || process.env.DB_HOST?.includes('supabase.com')
        ? {
            require: true,
            rejectUnauthorized: false
          }
        : false
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database Connected successfully');
    console.log(`📍 Connected to: ${process.env.DB_HOST}`);
    
    // Sync all models
    // Use { alter: true } for development (modifies tables)
    // Use { force: false } for production (doesn't drop tables)
    const syncOptions = process.env.NODE_ENV === 'production' 
      ? { alter: false } 
      : { alter: true };
    
    await sequelize.sync(syncOptions);
    console.log('📊 Database synced');
  } catch (error) {
    console.error('❌ Database Connection Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

export { sequelize, connectDB };
export default connectDB;