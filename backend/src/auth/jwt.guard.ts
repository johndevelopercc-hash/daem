import {
  CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface JwtPayload {
  sub: number;
  email: string;
  rol: string;
}

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Injectable()
export class JwtGuard implements CanActivate {
  private readonly logger = new Logger(JwtGuard.name);

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('No autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = payload;
      return true;
    } catch (err: unknown) {
      this.logger.warn(`Token invalido: ${err instanceof Error ? err.message : String(err)}`);
      throw new UnauthorizedException('Token invalido');
    }
  }
}
