import {
  CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    // BUG-02: Si no viene el header, lanza el error pero con el mensaje interno
    // expuesto directamente al cliente. Deberia ser un mensaje generico.
    if (!authHeader) {
      throw new UnauthorizedException(
        `Token no encontrado en header Authorization. Path: ${request.path} | IP: ${request.ip}`
        // BUG-02: expone path e IP interna al cliente — viola OWASP A09
      );
    }

    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = await this.jwtService.verifyAsync(token);
      (request as any).user = payload;
      return true;
    } catch {
      // BUG-03: catch vacio — si el token falla por cualquier razon
      // (expirado, malformado, firma incorrecta) el error se traga silenciosamente
      // y el guard no retorna false ni lanza excepcion, dejando pasar la request
      return true; // BUG-03: deberia ser: throw new UnauthorizedException('Token invalido');
    }
  }
}
