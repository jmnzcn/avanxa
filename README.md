# Avanxa

Aplicación de seguimiento de hábitos construida con un monorepo que incluye backend (Node.js/Express) y frontend (React/Vite).

## Arquitectura

Este proyecto utiliza una estructura de monorepo con NPM workspaces:

- `backend` - Servidor API Node.js/Express con Prisma y PostgreSQL
- `frontend` - Aplicación web React con Vite y Tailwind CSS

## Inicio Rápido

```bash
# Instalar todas las dependencias
npm install

# Configurar la base de datos (opcional)
docker-compose up -d db    # Iniciar PostgreSQL
npm run db:generate        # Generar cliente Prisma
npm run db:push           # Sincronizar esquema

# Iniciar servidores de desarrollo
npm run backend:dev    # Iniciar servidor backend (puerto 3001)
npm run frontend:dev   # Iniciar servidor frontend (puerto 3000)

# O iniciar ambos simultáneamente
npm run dev
```

## Comandos de Desarrollo

```bash
# Instalar dependencias para todos los paquetes
npm install

# Construir todos los paquetes
npm run build

# Ejecutar tests en todos los paquetes
npm test

# Limpiar todos los artefactos de construcción
npm run clean

# Comandos específicos por paquete
npm run backend:dev     # Iniciar backend en desarrollo (puerto 3001)
npm run frontend:dev    # Iniciar frontend en desarrollo (puerto 3000)
npm run backend:build   # Construir backend
npm run frontend:build  # Construir frontend

# Comandos de desarrollo alternativos
npm run dev:backend     # Alias para backend:dev
npm run dev:frontend    # Alias para frontend:dev

# Comandos de base de datos
npm run db:generate     # Generar cliente Prisma
npm run db:push         # Sincronizar esquema con la base de datos
npm run db:migrate      # Ejecutar migraciones
npm run db:studio       # Abrir Prisma Studio
npm run db:seed         # Poblar la base de datos con datos iniciales
```

## Estructura del Proyecto

```
├── backend/            # API Express.js
├── frontend/           # Aplicación React
├── package.json        # Configuración del paquete raíz
├── tsconfig.json       # Configuración TypeScript raíz
└── README.md          # Este archivo
```
