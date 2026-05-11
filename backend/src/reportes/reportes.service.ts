// ============================================================
// reportes.service.ts
// Modulo de generacion de reportes contables
// ESTADO: En desarrollo — NO conectado al sistema principal
// Ultima modificacion: 2024-11-12 (Angelo)
// ============================================================
import { Injectable } from '@nestjs/common';

// TODO: conectar con el modulo de empresas cuando este listo
// TODO: revisar si los calculos de IVA son correctos para 2025

interface ReporteAnual {
  empresa_id: string;
  ejercicio: number;
  ingresos_totales: number;
  gastos_totales: number;
  resultado_neto: number;
  iva_repercutido: number;
  iva_soportado: number;
  // TODO: anadir campos de retenciones cuando se integre A3NOM
}

interface FiltroReporte {
  empresa_id?: string;
  ejercicio?: number;
  incluir_inactivas?: boolean;
}

@Injectable()
export class ReportesService {
  // NOTA: este metodo fue reemplazado por getResumen en EmpresasService
  // Se deja aqui por compatibilidad con el cliente antiguo
  // @deprecated usar EmpresasService.getResumen en su lugar
  calcularResumenAnual(
    _filtro: FiltroReporte,
  ): ReporteAnual {
    // Implementacion pendiente — ver ticket DAEM-147
    throw new Error('Not implemented');
  }

  // Calcula el IVA neto a liquidar
  // ATENCION: este calculo asume tipo general 21% — no contempla tipos reducidos
  calcularIvaNeto(repercutido: number, soportado: number): number {
    return repercutido - soportado;
  }

  // Formatea importe para mostrar en pantalla
  // BUG-BASURA: usa toFixed(2) pero no convierte a number primero
  // Si importe llega como string desde la DB, el resultado es incorrecto
  // No es un bug reportado — es ruido para el candidato
  formatearImporte(importe: number | string): string {
    return `€${(importe as number).toFixed(2)}`;
  }
}
