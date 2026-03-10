# Sistema de Gestión de Inventario

Aplicación web moderna e intuitiva para el control y la gestión de inventarios, diseñada para administrar activos a través de múltiples ubicaciones (C5, Seguridad Pública, CERITY) y rastear su estado operativo.

## 🚀 Características Principales

- **Panel de Control (Dashboard):** Estadísticas en tiempo real de los movimientos (entradas, salidas, saldos pendientes) y búsqueda global en todo el historial.
- **Gestión Multi-Ubicación:** Administración de activos segmentados por distintas ubicaciones físicas (C5, Seguridad Pública, CERITY).
- **Control de Estado Operativo:** Seguimiento detallado del estado de cada activo (Funcional / No Funcional).
- **Entradas y Salidas:** Registro completo de movimientos de stock con la posibilidad de seleccionar fechas y horas personalizadas, además de especificar el motivo.
- **Búsqueda y Filtrado Global:** Encuentra rápidamente productos, movimientos históricos y reportes desde una sola barra de búsqueda.
- **Almacenamiento Local Rápido:** Uso de IndexedDB para un rendimiento fluido y manejo de datos localmente.

## 🛠️ Tecnologías Utilizadas

- **[React 19](https://react.dev/):** Biblioteca principal para la interfaz de usuario.
- **[Vite](https://vitejs.dev/):** Entorno de desarrollo rápido y empaquetador moderno.
- **[React Router DOM](https://reactrouter.com/):** Manejo de rutas y navegación de la aplicación (Single Page Application).
- **[Dexie.js](https://dexie.org/):** Wrapper minimalista sobre IndexedDB para el manejo y persistencia de datos (offline-first).
- **[date-fns](https://date-fns.org/):** Manipulación y formateo de fechas de manera moderna y sencilla.
- **[Lucide React](https://lucide.dev/):** Conjunto de iconos limpios y consistentes.

## 📁 Estructura del Proyecto

```text
src/
├── assets/       # Imágenes, fuentes u otros archivos estáticos
├── components/   # Componentes reutilizables de UI (Botones, Modales, Tablas, etc.)
├── context/      # Proveedores de estado global (React Context API)
├── db/           # Configuración de Dexie y lógica de acceso a la base de datos
├── views/        # Vistas y pantallas principales (Dashboard, Inventario, Reportes, etc.)
├── App.jsx       # Componente raíz y configuración de Rutas
└── main.jsx      # Punto de entrada de la aplicación
```

## 💻 Instalación y Uso

Asegúrate de tener [Node.js](https://nodejs.org/) instalado en tu sistema.

1. **Clonar o descargar el proyecto**
2. **Instalar las dependencias:**
   ```bash
   npm install
   ```
3. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
4. **Abrir en el navegador:**
   La aplicación normalmente estará disponible en `http://localhost:5173/`

## 📦 Construcción para Producción

Para generar una versión optimizada para producción:

```bash
npm run build
```

Los archivos generados se encontrarán en la carpeta `dist/`, listos para ser desplegados en cualquier servidor web estático.
