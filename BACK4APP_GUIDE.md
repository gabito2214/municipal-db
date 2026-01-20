# Guia de Despliegue en Back4App Containers

Esta plataforma es mucho más rápida que Render porque no pone tu aplicación a "dormir". Aquí tienes los pasos para subir tu sistema.

## 1. Base de Datos Externa (Neon.tech)

Para que tus datos no se pierdan al reiniciar el contenedor, usaremos **Neon.tech** (gratis y muy rápido).

1. Crea una cuenta en [Neon.tech](https://neon.tech/).
2. Crea un proyecto nuevo llamado `municipal-db`.
3. Copia el **Connection String** (algo como `postgres://user:pass@ep-hostname.aws.neon.tech/neondb?sslmode=require`).
4. Guarda esta URL, la usaremos en el paso 3.

## 2. Preparación del Código

1. Asegúrate de que los archivos `Dockerfile` y `.dockerignore` estén en tu repositorio de GitHub.
2. Sube tus últimos cambios a GitHub.

## 3. Configuración en Back4App

1. Entra a [Back4App Containers](https://www.back4app.com/products/container-service).
2. Haz clic en **"Create New App"** y selecciona **"GitHub"**.
3. Conecta tu repositorio.
4. En la configuración de la App:
   - **Port**: 3000
   - **Environment Variables**:
     - Haz clic en "Add Variable":
       - Key: `DATABASE_URL`
       - Value: `(Pega la URL de Neon.tech que copiaste en el paso 1)`
5. Haz clic en **"Deploy"**.

## 4. Migración de Datos (Pasar tus datos actuales a la nube)

Para subir tus datos de `municipal.db` a la nueva base de datos de Neon:

1. Abre tu terminal local en esta carpeta.
2. Ejecuta:

   ```bash
   $env:DATABASE_URL="TU_URL_DE_NEON_AQUI"; npm run migrate
   ```

   *(Esto subirá todos tus registros actuales a la nube).*

¡Listo! Tu página cargará instantáneamente cada vez que entres.
