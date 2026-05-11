import type { Empresa, ResumenFinanciero } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// Recupera el token del localStorage
function getToken(): string {
  return localStorage.getItem('token') ?? '';
}

// BUG-08: La funcion usa `as any` para tipar el response
// El candidato debe definir un tipo propio para el response de login
export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error('Login fallido');

  const data: any = await res.json(); // BUG-08: usar tipo propio { access_token: string }
  localStorage.setItem('token', data.access_token);
  return data.access_token;
}

export async function fetchEmpresas(): Promise<Empresa[]> {
  const res = await fetch(`${BASE_URL}/empresas`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  // BUG-09: No maneja el error HTTP — si el servidor devuelve 401 o 500
  // la funcion retorna un array vacio silenciosamente en lugar de lanzar error
  if (!res.ok) {
    return []; // BUG-09: deberia: throw new Error(`Error ${res.status}: ${res.statusText}`)
  }

  return res.json() as Promise<Empresa[]>;
}

export async function fetchResumen(
  empresaId: string,
  ejercicio: number,
  mes: number,
): Promise<ResumenFinanciero> {
  const params = new URLSearchParams({
    ejercicio: String(ejercicio),
    mes: String(mes),
  });

  const res = await fetch(
    `${BASE_URL}/empresas/${empresaId}/resumen?${params}`,
    { headers: { Authorization: `Bearer ${getToken()}` } },
  );

  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json() as Promise<ResumenFinanciero>;
}
