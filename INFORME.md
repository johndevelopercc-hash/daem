# INFORME.md — JOHN ALEJANDRO GUALTEROS GARCIA - gualterosjohn40@gmail.com

> Completa este documento para cada bug encontrado.
> Una explicacion honesta y razonada vale mas que una correccion sin justificacion.

---

## Nota sobre uso de herramientas

Use IA (Claude) como herramienta de apoyo durante la prueba, principalmente para ayudar a redactar el informe y acelerar la escritura. El razonamiento detras de cada correccion es mio: lei cada bug, entendi el problema, verifique la solucion y la traslade desde conocimiento que ya tenia en otras tecnologias y contextos.

Al ser un codebase pequeño con pocos archivos, cada cambio es verificable linea por linea. No entregue nada que no pueda explicar. Estoy de acuerdo con una entrevista tecnica y con gusto defiendo cualquiera de las decisiones: por que `return true` en el catch del guard era el bug critico, por que `verifyAsync<JwtPayload>` y no solo `verifyAsync`, por que el filtro en memoria no escala, o cualquier otro punto del informe.

La IA ayuda a escribir mas rapido. El que piensa sigue siendo el developer.

---

## REP-01

**Archivo y linea:** `backend/src/auth/jwt.guard.ts:17`

**Descripcion del problema:**
Cuando llega una peticion sin el header `Authorization`, el error que se le devuelve al cliente incluye la ruta que intentó acceder y la IP interna del servidor. Esa informacion no le sirve al usuario para nada y le da pistas a cualquiera que este intentando mapear la API.

**Impacto:**
Seguridad. Cualquiera puede hacer una peticion sin token y ver la IP interna del contenedor y la estructura de rutas, sin estar autenticado.

**Correccion aplicada:**
Cambie el mensaje por uno generico: `'No autorizado'`. El codigo 401 ya es suficiente informacion para el cliente.

**Commit:** `fix(auth): REP-01 - no exponer path ni IP en error de token ausente`

---

## REP-02

**Archivo y linea:** `backend/src/auth/jwt.guard.ts:26`

**Descripcion del problema:**
El bloque `catch` del guard atrapaba cualquier error de verificacion del token (expirado, firma invalida, malformado) y en lugar de rechazar la peticion devolvía `return true`, dejando pasar al usuario como si el token fuera valido. Ademas, asignaba el payload al request con `as any`, violando el estandar de tipos del equipo.

**Impacto:**
Critico de seguridad. Cualquier token, aunque estuviera expirado o tuviera la firma incorrecta, daba acceso a todos los endpoints protegidos.

**Correccion aplicada:**
- El `catch` ahora lanza `UnauthorizedException('Token invalido')` en lugar de devolver `true`.
- Defini las interfaces `JwtPayload` y `AuthenticatedRequest` para tipar correctamente el payload y el request sin usar `as any`.
- El guard usa `verifyAsync<JwtPayload>` para que el tipo fluya correctamente.

**Commit:** `fix(auth): REP-02 - rechazar tokens invalidos en JwtGuard y eliminar as any`

---

## REP-03

**Archivo y linea:** `frontend/src/components/EmpresaSelector.tsx:11`

**Descripcion del problema:**
La funcion `getFreshness` tenia invertidos los valores de retorno. Cuando la diferencia de tiempo era mayor a 30 minutos (dato viejo) devolvía `'ok'`, y cuando era menor a 5 minutos (dato reciente) devolvía `'stale'`. El resultado es que las empresas con datos viejos aparecían en verde y las recientes en rojo.

**Impacto:**
UX y fiabilidad. El usuario tomaba decisiones basadas en un indicador que mostraba exactamente lo contrario de la realidad.

**Correccion aplicada:**
Se intercambiaron los valores de retorno: `diff > 30` devuelve `'stale'`, `diff > 5` devuelve `'warning'` y el resto devuelve `'ok'`.

**Commit:** `fix(frontend): REP-03 - corregir logica de frescura invertida`

---

## REP-04

**Archivo y linea:** `frontend/src/components/EmpresaSelector.tsx:36`

**Descripcion del problema:**
El componente tenia un estado `error` que se rellenaba correctamente en el `catch`, pero nunca se usaba en el render. Cuando la llamada a la API fallaba, `loading` pasaba a `false` y se intentaba renderizar la lista de empresas vacia, dejando la pantalla en blanco sin ningun mensaje.

**Impacto:**
UX. El usuario no sabe si hay un error, si no hay empresas o si la pagina cargo mal. No puede hacer nada para resolverlo.

**Correccion aplicada:**
Se añadio un bloque `if (error)` despues del check de `loading` que muestra el mensaje de error al usuario antes de intentar renderizar la lista.

**Commit:** `fix(frontend): REP-04 - mostrar mensaje de error al fallar la carga de empresas`

---

## REP-05

**Archivo y linea:** `backend/src/empresas/empresas.service.ts:12`

**Descripcion del problema:**
La query traía todas las filas de la tabla `empresas` sin ningún filtro y luego aplicaba `.filter(e => e.activa === true)` en memoria en Node. Con pocos registros no se nota, pero con miles de empresas esto carga toda la tabla en memoria para descartar la mayoría.

**Impacto:**
Rendimiento. El tiempo de respuesta y el uso de memoria escalan con el total de registros de la tabla en lugar de con los registros activos, que son los que realmente se devuelven.

**Correccion aplicada:**
Se añadio `WHERE activa = true` directamente en la query SQL y se elimino el `.filter()` en memoria. La base de datos filtra con el indice, no Node.

Con mas tiempo añadiria paginacion con `LIMIT` y `OFFSET` para que el endpoint no devuelva todos los registros de golpe independientemente de cuantos haya, lo que complementaria esta correccion y haria el endpoint escalable de verdad.

**Commit:** `fix(backend): REP-05 - mover filtro de empresas activas a la query SQL`

---

## REP-06

**Archivo y linea:** `backend/src/empresas/empresas.controller.ts:35`

**Descripcion del problema:**
Cuando fallaba el endpoint `GET /empresas`, el catch construia la respuesta de error incluyendo `error.stack` en el campo `detail`. El stack trace contiene rutas absolutas del servidor, versiones de librerias y la estructura interna del codigo.

**Impacto:**
Seguridad. Cualquier error en produccion filtraba informacion tecnica interna directamente al cliente en el cuerpo del 500.

**Correccion aplicada:**
Se elimino el campo `detail` del response. El error completo (con stack) se loguea internamente con el `Logger` de NestJS para que quede en los logs del servidor. Al cliente solo le llega `'Error interno'`.

**Commit:** `fix(backend): REP-06 - no exponer stack trace en respuesta de error`

---

## REP-07

**Archivo y linea:** `backend/src/auth/auth.service.ts:22`

**Descripcion del problema:**
Al generar el JWT, el payload incluia el campo `password` con la contraseña en texto plano. El payload de un JWT solo está codificado en base64, no cifrado, por lo que cualquiera que intercepte o decodifique el token puede leer la contraseña directamente.

**Impacto:**
Critico de seguridad. La contraseña queda expuesta en el token, en los logs de cualquier sistema que lo registre, y en el navegador del cliente (localStorage). Compromete la cuenta del usuario aunque el token expire.

**Correccion aplicada:**
Se elimino `password` del payload. El token ahora solo contiene `sub`, `email` y `rol`, que es la informacion minima necesaria para identificar y autorizar al usuario. Se añadio ademas la interfaz `JwtPayload` para tipar el payload correctamente y evitar que se cuele un campo sensible en el futuro sin que TypeScript lo detecte.

**Commit:** `fix(auth): REP-07 - eliminar password del payload del JWT`

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

### Hallazgo 3 — SQL Injection en `getResumen`

**Archivo y linea:** `backend/src/empresas/empresas.service.ts:37`

**Descripcion:**
La query de resumen financiero interpolaba directamente las variables `empresaId`, `ejercicio` y `mes` en el string SQL. Cualquiera que controlara esos parametros podia inyectar SQL arbitrario y acceder o modificar datos de otras empresas.

**Impacto:**
Critico de seguridad. SQL Injection es una vulnerabilidad del top 1 de OWASP. El endpoint estaba protegido por JWT pero un usuario autenticado podria haber explotado esto para leer datos de otras empresas o corromper la base de datos.

**Correccion:**
Se reemplazaron las interpolaciones por parametros `$1`, `$2`, `$3` pasados como segundo argumento a `pool.query()`. La libreria `pg` los escapa correctamente.

Con mas tiempo migraria el acceso a datos a un ORM como TypeORM o Prisma, que eliminan esta clase de vulnerabilidades por diseño ya que nunca construyen queries por concatenacion. Tambien facilitaria el mantenimiento y la migracion de esquema.

**Commit:** `fix(backend): SQL injection en getResumen - usar parametros en lugar de interpolacion`

---

### Hallazgo 4 — `fetchEmpresas` silencia errores HTTP y `login` usa `: any`

**Archivo y linea:** `frontend/src/services/api.ts:33` y `api.ts:21`

**Descripcion:**
Dos problemas en el mismo archivo. Primero, `fetchEmpresas` devolvía `[]` cuando el servidor respondía con 401 o 500 en lugar de lanzar un error, lo que hacía que el `catch` del componente nunca se ejecutara y el usuario viera la pantalla vacía sin mensaje (relacionado con REP-04). Segundo, la funcion `login` tipaba el response con `: any` violando el estandar del equipo.

**Impacto:**
UX y calidad de codigo. El error del servidor quedaba completamente oculto para el usuario y para el desarrollador.

**Correccion:**
- `fetchEmpresas`: cambiado `return []` por `throw new Error(...)` con el status HTTP.
- `login`: reemplazado `: any` por el tipo especifico `{ access_token: string }`.

Con mas tiempo definiria DTOs tanto en el backend como en el frontend que actuen como contrato entre las dos capas. En el backend los DTOs de respuesta garantizarian que nunca se filtre un campo inesperado (como paso con `password`). En el frontend, en lugar de tipar inline con `{ access_token: string }` habria un modelo compartido que ambas partes respetan, de modo que si el contrato cambia TypeScript lo detecta en compilacion en lugar de en runtime.

**Commit:** `fix(frontend): fetchEmpresas lanza error en lugar de retornar array vacio y eliminar any en login`

---

### Hallazgo 5 — `nombreMes` devuelve el mes equivocado

**Archivo y linea:** `frontend/src/lib/formatters.ts:35`

**Descripcion:**
El array `MESES` esta indexado desde 0 pero la funcion recibe el mes como numero 1-12. `MESES[mes]` con `mes=1` devuelve `'Febrero'` en lugar de `'Enero'`. Todos los meses estaban desplazados uno hacia adelante y `mes=12` devolvía `'Mes desconocido'`.

**Impacto:**
UX. El selector de mes en la vista de resumen mostraba el nombre incorrecto para cada mes.

**Correccion:**
Cambiado `MESES[mes]` por `MESES[mes - 1]`.

**Commit:** `fix(frontend): nombreMes devuelve el mes correcto con indice mes - 1`

---

### Hallazgo 6 — `formatearImporte` falla en runtime si el importe llega como string

**Archivo y linea:** `backend/src/reportes/reportes.service.ts:52`

**Descripcion:**
La funcion acepta `number | string` pero usaba `(importe as number).toFixed(2)`. Un cast de TypeScript no convierte el valor en runtime, solo le dice al compilador que confíe. Si `importe` llega como string desde la base de datos (lo que pasa con `pg` en columnas `NUMERIC`), `toFixed` falla porque los strings no tienen ese metodo.

**Impacto:**
Error en runtime. El servicio aun no esta conectado al sistema principal, pero el bug habria aparecido en cuanto se integrara.

**Correccion:**
Reemplazado `(importe as number).toFixed(2)` por `Number(importe).toFixed(2)`, que convierte correctamente tanto si llega number como string.

**Commit:** `fix(backend): formatearImporte convierte a number antes de llamar toFixed`

---

### Hallazgo 7 — Estado muerto en `ResumenChart`

**Archivo y linea:** `frontend/src/components/ResumenChart.tsx:29`

**Descripcion:**
El componente tenia un `useState<number | null>(null)` llamado `mesSeleccionado` que se actualizaba con un `onClick` en cada barra del grafico — al hacer click en un mes, alternaba entre guardar ese numero y volver a `null`. El problema es que `mesSeleccionado` nunca se leia en el render: no habia clase condicional, no habia tooltip, no habia panel de detalle que dependiera de ese valor. Cada click disparaba un re-render sin ningun efecto visible para el usuario.

**Impacto:**
Re-renders innecesarios en cada click y un `import { useState }` sin uso. El componente ya tenia el comentario de que no esta conectado a ninguna pantalla, asi que el estado era codigo a medias que nunca llego a usarse.

**Correccion:**
Se elimino el estado `mesSeleccionado`, el `setMesSeleccionado`, el `onClick` de cada barra y el `import { useState }`. Si en el futuro se implementa la seleccion de mes, habria que añadirlo junto con el JSX que lo consume — no tiene sentido tener el estado sin la UI que lo muestra.

**Commit:** `fix(frontend): eliminar estado muerto en ResumenChart`

---

## Reflexion final

**Que cambiarias si tuvieras mas tiempo:**

Lo mas urgente es el login. Las credenciales estan hardcodeadas en `auth.service.ts` y la tabla `usuarios` del seed no se toca en ningun momento. Antes de cualquier otra cosa, eso hay que conectarlo: buscar por email, comparar con `bcrypt.compare`, y devolver el mismo mensaje tanto si el email no existe como si la password es incorrecta, para no filtrar que cuentas existen.

Lo segundo que cambiaria es mover el acceso a datos a TypeORM o Prisma. El SQL injection en `getResumen` no habria existido con un ORM. Tambien soluciona el problema de los NUMERIC que `pg` devuelve como strings — TypeORM los mapea automaticamente, sin el cast manual que tuve que parchear en `formatearImporte`. Las queries a mano funcionan en proyectos chicos pero se vuelven un problema a medida que crece el esquema.

El `JWT_SECRET` tiene el fallback `'supersecret_dev_only'` en `app.module.ts` y en `config.ts`. Si alguien despliega sin configurar esa variable, cualquiera que conozca ese string firma tokens validos. Añadiria validacion de variables de entorno en el arranque para que el servidor no inicie si falta algo critico.

En el frontend, el problema que mas se nota al escalar es que el fetch esta mezclado directamente en los componentes. Cada componente maneja su propio loading, error y datos. Lo moveria a hooks propios (`useEmpresas`, `useResumen`) y probablemente a React Query, que te da cache y refetch sin tener que escribir todo ese codigo de estado a mano. El indicador de frescura tambien tendria mas sentido si los datos se refrescaran solos en background.

Tests no hay ninguno. REP-02 — el catch que devolvía `return true` — se habria detectado en el primer test unitario del guard. Eso es lo que mas duele porque es el bug mas critico y el mas facil de cubrir.

---

**Que regla del estandar fue mas dificil de cumplir:**

La de cero `: any`. `res.json()` devuelve `Promise<any>` y TypeScript no se queja si lo asignas directamente a una variable tipada, el error es silencioso. Hay que acordarse de tipar en el punto de consumo porque el compilador no lo detecta automaticamente.

---

**Alguna decision tecnica que quieras explicar:**

Defini `JwtPayload` y `AuthenticatedRequest` en el mismo `jwt.guard.ts` en lugar de crear un archivo de tipos compartido. Lo hice para mantener el cambio localizado — no queria añadir estructura que no existia en el proyecto. En un proyecto real lo moveria a `shared/types/` para que el guard y el servicio de auth importen desde el mismo sitio, pero aqui me parecio un overhead innecesario para el scope de la prueba.
