import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';

export const PG_POOL = 'PG_POOL';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () => new Pool({
        connectionString: process.env.DATABASE_URL ??
          'postgresql://daem_user:daem_pass@localhost:5432/daem_prueba',
      }),
    },
  ],
  exports: [PG_POOL],
})
export class DbModule {}
