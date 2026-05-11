import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../common/db.module';
import { Empresa, ResumenFinanciero } from './empresas.types';

@Injectable()
export class EmpresasService {
  constructor(@Inject(PG_POOL) private pool: Pool) {}

  async findAll(): Promise<Empresa[]> {
    const result = await this.pool.query<Empresa>(
      `SELECT id, nombre, nif, programa, activa, ultima_sync
       FROM empresas
       WHERE activa = true
       ORDER BY nombre`,
    );
    return result.rows;
  }

  async getResumen(
    empresaId: string,
    ejercicio: number,
    mes: number,
  ): Promise<ResumenFinanciero> {
    // Verificar que la empresa existe
    const empresaResult = await this.pool.query(
      'SELECT id FROM empresas WHERE id = $1',
      [empresaId],
    );

    if (empresaResult.rows.length === 0) {
      throw new NotFoundException(`Empresa ${empresaId} no encontrada`);
    }

    const result = await this.pool.query(
      `SELECT tipo, SUM(importe) as total
       FROM apuntes
       WHERE empresa_id = $1
         AND ejercicio = $2
         AND mes = $3
       GROUP BY tipo`,
      [empresaId, ejercicio, mes],
    );

    let total_ingresos = 0;
    let total_gastos = 0;

    for (const row of result.rows) {
      if (row.tipo === 'INGRESO') total_ingresos = parseFloat(row.total);
      if (row.tipo === 'GASTO') total_gastos = parseFloat(row.total);
    }

    return {
      empresa_id: empresaId,
      ejercicio,
      mes,
      total_ingresos,
      total_gastos,
      resultado: total_ingresos - total_gastos,
    };
  }
}
