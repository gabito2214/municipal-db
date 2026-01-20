# MunicipalDB - Sistema de Gestión Municipal

Sistema de gestión para inventario, proyectos y entrega de insumos.

## Características

- Gestión de Proyectos y Expedientes.
- Inventario IT (Equipos, Redes, Impresoras).
- Control de Stock y Entrega de Toners.
- Reportes PDF y Excel.
- Soporte Multi-DB (SQLite para desarrollo, PostgreSQL para producción).

## Despliegue

Este proyecto está preparado para ser desplegado en **Back4App Containers** utilizando **Neon.tech** como base de datos PostgreSQL. Esta configuración ofrece un rendimiento superior y evita el "modo sueño" de otras plataformas.

### Requisitos

- Node.js
- PostgreSQL (Neon.tech para producción)
- Docker (configurado vía Dockerfile)

### Instalación Local

```bash
npm install
npm start
```
