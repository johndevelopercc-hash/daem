// ============================================================
// logger.middleware.ts
// Middleware de logging de requests HTTP
// ESTADO: desactivado — ver comentario abajo
// ============================================================
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') ?? '';
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;

      // NOTA: se loggea el body completo por requisito del equipo de auditoria
      // PROBLEMA: si el body contiene passwords o tokens, se loggean tambien
      // Este middleware fue desactivado del AppModule en DAEM-156 por este motivo
      // Pendiente de refactorizar para filtrar campos sensibles antes de loggear
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${duration}ms — ${ip} — ${userAgent}`,
        // TODO: anadir req.body aqui cuando se resuelva el problema de datos sensibles
      );
    });

    next();
  }
}

// Este middleware NO esta registrado en AppModule
// Para activarlo: app.use(new LoggerMiddleware().use) en main.ts
// NO activar sin antes filtrar campos sensibles del body
