import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface JwtPayload {
  sub: number;
  email: string;
  rol: string;
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  login(email: string, password: string): { access_token: string } {
    if (email !== 'admin@daem.es' || password !== 'test1234') {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload: JwtPayload = {
      sub: 1,
      email,
      rol: 'admin',
    };

    return { access_token: this.jwtService.sign(payload) };
  }
}
