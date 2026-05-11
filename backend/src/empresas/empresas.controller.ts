import {
  Controller, Get, Param, Query, UseGuards,
  HttpException, HttpStatus,
} from '@nestjs/common';
import { IsNumberString, IsOptional } from 'class-validator';
import { JwtGuard } from '../auth/jwt.guard';
import { EmpresasService } from './empresas.service';

class ResumenQueryDto {
  @IsOptional()
  @IsNumberString()
  ejercicio?: string;

  @IsOptional()
  @IsNumberString()
  mes?: string;
}

@Controller('empresas')
@UseGuards(JwtGuard)
export class EmpresasController {
  constructor(private empresasService: EmpresasService) {}

  @Get()
  async findAll() {
    // BUG-06: El catch captura el error pero expone el stack trace completo
    // al cliente en produccion. El usuario ve rutas internas, versiones, etc.
    try {
      return await this.empresasService.findAll();
    } catch (error: unknown) {
      throw new HttpException(
        {
          message: 'Error al obtener empresas',
          // BUG-06: nunca exponer el error interno al cliente
          detail: error instanceof Error ? error.stack : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/resumen')
  async getResumen(
    @Param('id') id: string,
    @Query() query: ResumenQueryDto,
  ) {
    const now = new Date();
    const ejercicio = query.ejercicio
      ? parseInt(query.ejercicio, 10)
      : now.getFullYear();
    const mes = query.mes
      ? parseInt(query.mes, 10)
      : now.getMonth() + 1;

    // BUG-07: No hay validacion de rango para mes (1-12) ni ejercicio
    // Un mes=0 o mes=13 devuelve resultados vacios sin error — confunde al cliente
    // Deberia validar: if (mes < 1 || mes > 12) throw BadRequestException

    try {
      return await this.empresasService.getResumen(id, ejercicio, mes);
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Error interno',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
