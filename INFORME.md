# INFORME.md — JOHN ALEJANDRO GUALTEROS GARCIA - gualterosjohn40@gmail.com

> Completa este documento para cada bug encontrado.
> Una explicacion honesta y razonada vale mas que una correccion sin justificacion.

---

## REP-01

**Archivo y linea:** <!-- ej: backend/src/auth/jwt.guard.ts:25 -->

**Descripcion del problema:**
<!-- Que ocurre exactamente y por que es un problema -->

**Impacto:**
<!-- Seguridad / rendimiento / experiencia de usuario / otro -->

**Correccion aplicada:**
<!-- Que cambiaste y por que -->

**Commit:**
<!-- Hash o nombre del commit con la correccion -->

---

## REP-02

**Archivo y linea:**

**Descripcion del problema:**

**Impacto:**

**Correccion aplicada:**

**Commit:**

---

## REP-03

**Archivo y linea:**

**Descripcion del problema:**

**Impacto:**

**Correccion aplicada:**

**Commit:**

---

## REP-04

**Archivo y linea:**

**Descripcion del problema:**

**Impacto:**

**Correccion aplicada:**

**Commit:**

---

## REP-05

**Archivo y linea:**

**Descripcion del problema:**

**Impacto:**

**Correccion aplicada:**

**Commit:**

---

## REP-06

**Archivo y linea:**

**Descripcion del problema:**

**Impacto:**

**Correccion aplicada:**

**Commit:**

---

## REP-07

**Archivo y linea:**

**Descripcion del problema:**

**Impacto:**

**Correccion aplicada:**

**Commit:**

---

## Hallazgos propios (opcional)

### Hallazgo 1 — Frontend sin boilerplate: el entorno no arrancaba

**Archivos afectados:** `frontend/` — archivos ausentes por completo

**Descripcion:**
El proyecto no arrancaba con `docker compose up --build` porque al frontend le faltaban todos los archivos de scaffolding que Vite necesita para iniciar. Los archivos de logica de la prueba estaban presentes (componentes, servicios, tipos), pero sin la estructura base el proceso de Vite fallaba antes de compilar nada.

Archivos que faltaban:
- `index.html` — entry point obligatorio de Vite
- `vite.config.ts` — configuracion del bundler y el plugin de React
- `tsconfig.json` + `tsconfig.node.json` — configuracion TypeScript del proyecto y de vite.config
- `tailwind.config.js` + `postcss.config.js` — requeridos porque los componentes ya usaban clases de Tailwind
- `src/index.css` — directivas `@tailwind base/components/utilities`
- `src/main.tsx` — punto de entrada React que monta `<App />`
- `src/App.tsx` — componente raiz con el flujo login → selector de empresa → vista de resumen

**Impacto:**
Bloqueante total. Sin estos archivos `docker compose up --build` falla en el contenedor `frontend` y el entorno no es evaluable.

**Correccion:**
Se crearon los 9 archivos con el contenido minimo necesario para que Vite arranque y el flujo de la aplicacion funcione (login, listado de empresas, consulta de resumen financiero por mes y ejercicio). No se añadio logica extra mas alla de lo que los componentes existentes ya requerían.

Adicionalmente, ambos Dockerfiles usaban `npm ci` que requiere un `package-lock.json` existente (no incluido en el repositorio). Se cambio por `npm install` en `backend/Dockerfile` y `frontend/Dockerfile`. Se elimino tambien el campo `version: '3.9'` del `docker-compose.yml`, obsoleto en versiones modernas de Docker Compose y que generaba un warning en cada arranque.

---

### Hallazgo 2 — Directorio `{backend` residual por expansion de shell fallida

**Archivos afectados:** `{backend/` (raiz del proyecto)

**Descripcion:**
En la raiz del proyecto existia un directorio llamado literalmente `{backend` con una estructura de subdirectorios vacios cuyo nombre completo era `{backend/src/{empresas,auth,common},frontend/src/{components,services,types},db}`. Es el resultado de una expansion de llaves de bash (`{}`) que se ejecuto sin comillas desde la raiz y creo los nombres literales en lugar de los directorios reales. El contenido estaba completamente vacio y no era referenciado por ningun archivo del proyecto.

**Impacto:**
Ruido en el arbol de directorios y posible confusion para herramientas que recorran el filesystem (linters, Docker build context, etc.). No afecta al funcionamiento, pero evidencia un error en la preparacion del entorno.

**Correccion:**
Se elimino el directorio con `rm -rf '{backend'` desde la raiz del proyecto.

---

## Reflexion final

**Que cambiarias si tuvieras mas tiempo:**

**Que regla del estandar de codigo fue mas dificil de cumplir y por que:**

**Alguna decision tecnica que tomaste y quieras explicar:**
