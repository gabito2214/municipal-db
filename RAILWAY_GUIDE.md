# Guia Rápida: Despliegue en Railway

Si Back4App te sigue dando problemas con GitHub, **Railway** es la solución. Es famoso por ser el más fácil de usar y muy rápido.

## 1. Crear cuenta en Railway

1. Entra a [Railway.app](https://railway.app/).
2. Dale a **"Login"** y elige **GitHub**. (Suele funcionar a la primera sin errores).

## 2. Desplegar el Proyecto

1. Haz clic en **"+ New Project"**.
2. Selecciona **"Deploy from GitHub repo"**.
3. Elige tu repositorio `municipal-db`.
4. Dale a **"Deploy Now"**.

## 3. Configurar la Base de Datos (Neon)

1. Una vez que se cree el proyecto, ve a la pestaña **"Variables"** de tu aplicación en Railway.
2. Haz clic en **"Add Variable"**.
3. **Variable Name**: `DATABASE_URL`
4. **Variable Value**: `postgresql://neondb_owner:npg_4rtEvUmgB1wl@ep-royal-bush-ahxq7p54-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
5. Dale a **"Add"**.

¡Listo! Railway detectará automáticamente el `Dockerfile` que creamos y encenderá tu servidor en segundos. La página te dará una URL (ej: `municipal-db-production.up.railway.app`).

**Ventaja**: Railway NO pone a dormir tu aplicación en el plan gratuito inicial, así que cargará siempre rápido.
