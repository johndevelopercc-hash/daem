import {
  Controller, Get, Param, Query, UseGuards,
  HttpException, HttpStatus, Logger,
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
  private readonly logger = new Logger(EmpresasController.name);

  constructor(private empresasService: EmpresasService) {}

  @Get()
  async findAll() {
    try {
      return await this.empresasService.findAll();
    } catch (error: unknown) {
      this.logger.error('Error al obtener empresas', error instanceof Error ? error.stack : String(error));
      throw new HttpException('Error interno', HttpStatus.INTERNAL_SERVER_ERROR);
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

    try {
      return await this.empresasService.getResumen(id, ejercicio, mes);
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Error al obtener resumen', error instanceof Error ? error.stack : String(error));
      throw new HttpException('Error interno', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
