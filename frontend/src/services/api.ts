import type { Empresa, ResumenFinanciero } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function getToken(): string {
  return localStorage.getItem('token') ?? '';
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error('Login fallido');

  const data = await res.json() as { access_token: string };
  localStorage.setItem('token', data.access_token);
  return data.access_token;
}

export async function fetchEmpresas(): Promise<Empresa[]> {
  const res = await fetch(`${BASE_URL}/empresas`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
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
