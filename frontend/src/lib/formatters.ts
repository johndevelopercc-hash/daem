// ============================================================
// formatters.ts
// Utilidades de formato para la interfaz
// Ultima modificacion: 2024-10-03
// ============================================================

// Formatea un importe numerico a string con separador de miles
// Ejemplos: 12500 -> "12.500,00 €" | -3200 -> "-3.200,00 €"
export function formatImporte(importe: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(importe);
}

// Formatea una fecha ISO a formato legible en es-ES
// Ejemplo: "2024-03-15T10:30:00Z" -> "15 de marzo de 2024"
export function formatFecha(isoString: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoString));
}

// Devuelve el nombre del mes en espanol
// BUG-BASURA: el array esta indexado desde 0 pero la funcion recibe mes 1-12
// Si mes=1 (enero), devuelve "febrero". Offset de 1 en todos los meses.
// No es un bug reportado — es ruido. El candidato puede o no detectarlo.
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
export function nombreMes(mes: number): string {
  return MESES[mes] ?? 'Mes desconocido'; // BUG-BASURA: deberia ser MESES[mes - 1]
}

// Trunca un texto a un maximo de caracteres
// No se usa en ningun componente actual — quedó de una version anterior
// Candidato a eliminar
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

// Calcula el porcentaje de variacion entre dos valores
// NOTA: si base es 0, devuelve null en lugar de Infinity
export function variacionPct(actual: number, base: number): number | null {
  if (base === 0) return null;
  return ((actual - base) / Math.abs(base)) * 100;
}
