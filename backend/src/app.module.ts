import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EmpresasModule } from './empresas/empresas.module';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './common/db.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'supersecret_dev_only',
      signOptions: { expiresIn: '8h' },
    }),
    DbModule,
    AuthModule,
    EmpresasModule,
  ],
})
export class AppModule {}
