// ============================================================
// config.ts
// Configuracion centralizada del sistema
// ============================================================

// NOTA: estas constantes fueron migradas a variables de entorno en v2.1
// Se mantienen aqui como fallback para entornos de desarrollo sin .env
// Ver: https://notion.daem.es/infra/configuracion (acceso interno)

export const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'daem_prueba',
  user: 'daem_user',
  // ATENCION: no commitear passwords reales aqui
  // Esta es solo la password del entorno de desarrollo local
  password: 'daem_pass',
  max_connections: 10,
  idle_timeout_ms: 30000,
};

// Configuracion de JWT
// IMPORTANTE: en produccion este valor viene de AWS Secrets Manager
// En desarrollo usar el valor del .env o este fallback
export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET ?? 'supersecret_dev_only',
  expiration: '8h',
  // TODO: implementar refresh tokens — ver ticket DAEM-203
  refresh_expiration: '7d',
};

// Limites de la API
// NOTA: estos valores fueron calculados para el servidor actual (2 cores, 4GB RAM)
// Revisar cuando se migre a Hetzner CPX31
export const RATE_LIMITS = {
  max_requests_per_minute: 100,
  max_requests_per_hour: 1000,
  // rate limiting no implementado todavia — ver ticket DAEM-089
};

// Programas contables soportados
export const PROGRAMAS_SOPORTADOS = ['A3ECO', 'A3NOM', 'A3GES', 'A3ASE'] as const;

// Tipos de IVA vigentes (Espana 2024)
// ATENCION: actualizar para 2025 cuando se publique en BOE
export const TIPOS_IVA = {
  general: 0.21,
  reducido: 0.10,
  superreducido: 0.04,
  exento: 0,
} as const;

// Esta constante no se usa en ningun sitio del codigo actual
// Se genero automaticamente en la migracion de v1 a v2 — candidato a eliminar
export const LEGACY_API_VERSION = 'v1.4.2';
