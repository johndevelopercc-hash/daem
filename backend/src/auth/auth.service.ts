// ============================================================
// auth.service.ts
// ============================================================
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  // BUG-01: El token incluye la password en el payload (leak de dato sensible)
  // El candidato debe identificar que el payload jamas debe incluir credenciales
  login(email: string, password: string): { access_token: string } {
    // Validacion simulada — en produccion seria contra la DB
    if (email !== 'admin@daem.es' || password !== 'test1234') {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = {
      sub: 1,
      email,
      password,          // BUG-01: nunca incluir password en el payload del JWT
      rol: 'admin',
    };

    return { access_token: this.jwtService.sign(payload) };
  }
}
