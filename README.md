# Dashboard de Adquisición de Equipos Médicos

Panel de gestión para Ingeniería Clínica: seguimiento de solicitudes, presupuesto,
KPIs y tablas dinámicas. Incluye pestaña de Configuración (Áreas / Responsables) y
sincronización opcional con Firebase para que todo el equipo vea los mismos datos
en tiempo real.

---

## Paso 1 · Crear el proyecto en Firebase (gratis)

1. Ve a https://console.firebase.google.com → **"Agregar proyecto"** → dale un nombre
   (ej. `clinica-equipos`) → puedes desactivar Google Analytics, no se necesita.
2. Dentro del proyecto, en el menú lateral: **Compilación → Firestore Database**
   → **"Crear base de datos"** → elige una ubicación cercana → modo **producción**.
3. Ve a la pestaña **"Reglas"** de Firestore y reemplaza el contenido por el que
   está en el archivo `firestore.rules` de esta carpeta → **"Publicar"**.
   (Esas reglas dejan lectura/escritura abierta para que el equipo use el dashboard
   sin necesidad de iniciar sesión; adecuado para una URL de uso interno.)
4. Ve a **"Configuración del proyecto"** (ícono de engranaje, arriba a la izquierda)
   → pestaña **"Tus apps"** → clic en el ícono **`</>`** (Web) → dale un nombre
   → **"Registrar app"**.
5. Firebase te muestra un objeto `firebaseConfig` con varias claves
   (`apiKey`, `authDomain`, `projectId`, etc.). Los necesitarás en el paso 2.

## Paso 2 · Conectar el proyecto con tus claves de Firebase

1. Dentro de esta carpeta, copia `.env.example` y renómbralo a `.env`.
2. Abre `.env` y pega cada valor que te dio Firebase, por ejemplo:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyD...
   VITE_FIREBASE_AUTH_DOMAIN=clinica-equipos.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=clinica-equipos
   VITE_FIREBASE_STORAGE_BUCKET=clinica-equipos.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```
3. Guarda el archivo. **Nunca subas este archivo `.env` a GitHub** (ya está
   excluido en `.gitignore`, no tienes que hacer nada extra).
4. Corre localmente para probar:
   ```
   npm install
   npm run dev
   ```
   Si todo está bien, en el panel lateral izquierdo verás **"Conectado a Firebase"**
   con un punto verde parpadeante en vez de "Modo local".

## Paso 3 · Subir el proyecto a GitHub

1. Crea una cuenta gratis en https://github.com si no tienes.
2. Clic en **"New repository"** → nómbralo (ej. `dashboard-equipos-medicos`) →
   puede ser privado → **"Create repository"**.
3. En esta carpeta, en una terminal:
   ```
   git init
   git add .
   git commit -m "Primera versión del dashboard"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/dashboard-equipos-medicos.git
   git push -u origin main
   ```
   (Como `.env` está en `.gitignore`, tus claves de Firebase NO se suben a GitHub;
   eso es justamente lo que queremos.)

## Paso 4 · Desplegar gratis desde GitHub (con auto-actualización)

### Vercel (recomendado)
1. Ve a https://vercel.com → inicia sesión con tu cuenta de GitHub.
2. **"Add New" → "Project"** → elige el repositorio que acabas de subir.
3. Vercel detecta que es un proyecto Vite automáticamente.
4. Antes de darle a "Deploy", abre la sección **"Environment Variables"** y agrega
   las mismas 6 variables que pusiste en tu `.env` (una por una, con los mismos
   nombres `VITE_FIREBASE_...`).
5. Clic en **"Deploy"**. En un minuto tienes tu URL pública.
6. Desde ahora, cada vez que hagas `git push` a GitHub, Vercel actualiza el sitio
   solo, automáticamente.

### Netlify (alternativa)
1. Ve a https://app.netlify.com → **"Add new site" → "Import an existing project"**
   → conecta GitHub y elige el repositorio.
2. En **"Environment variables"** agrega las mismas variables `VITE_FIREBASE_...`.
3. Build command: `npm run build` — Publish directory: `dist` (Netlify ya lo detecta).
4. Deploy. También se actualiza solo con cada `git push`.

---

## ¿Qué pasa si no configuro Firebase?

Nada se rompe: el dashboard sigue funcionando guardando los datos solo en el
navegador de quien lo usa (localStorage), igual que antes. En cuanto completes
el archivo `.env` (local) o las variables de entorno (en Vercel/Netlify), el
dashboard se conecta solo a Firebase sin que tengas que tocar nada más del código.

## Notas de seguridad

Las reglas de Firestore incluidas (`firestore.rules`) dejan lectura y escritura
abiertas para cualquiera que tenga la URL de tu app — es decir, la seguridad
depende de que la URL no se comparta públicamente. Si vas a publicar la URL de
forma abierta (redes sociales, sitio institucional, etc.), pídeme ayuda para
agregar un inicio de sesión (Firebase Authentication) antes de hacerlo.

## Requisitos para correr localmente
- Node.js 18 o superior (https://nodejs.org)
- Dentro de la carpeta: `npm install` y luego `npm run dev`
