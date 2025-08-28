/* eslint-disable import/no-default-export */
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config({ path: '.env' });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: false,
  },
  entities: ['src/entities/*{.ts,.js}'],
  // migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
});
