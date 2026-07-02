import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import * as schemas from './schemas';

export const POSTGRES_DB = 'POSTGRES_DB';

export const databaseProviders = [
  {
    provide: POSTGRES_DB,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      const connectionString = configService.getOrThrow<string>('APP_DATABASE_URI_VALUE');
      const pool = new Pool({ connectionString });
      return drizzle({ client: pool, schema: schemas });
    },
  },
];
