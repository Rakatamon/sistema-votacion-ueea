# 🗳️ Sistema de Votación UEEA

Sistema de votación electrónica desarrollado para la Unidad Educativa Ecuatoriana Austriaca. Permite realizar elecciones estudiantiles de manera segura y eficiente.

## 🚀 Características

- **Dashboard Administrativo**: Gestión completa de elecciones y votantes
- **Sistema de Votación**: Interfaz intuitiva para estudiantes
- **Importación Masiva**: Carga de estudiantes via Excel/CSV
- **Resultados en Tiempo Real**: Visualización de resultados con gráficos
- **Exportación de Datos**: Descarga de resultados en Excel
- **Seguridad**: Autenticación Firebase y prevención de doble votación
- **Responsive**: Optimizado para móviles y escritorio

## 🛠️ Tecnologías

- **Frontend**: React 19, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Create React App
- **Package Manager**: pnpm

## 📋 Prerrequisitos

- Node.js 16+ 
- pnpm
- Cuenta de Firebase
- Navegador moderno

## ⚙️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/sistema-votacion-ueea.git
   cd sistema-votacion-ueea
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Completar `.env` con tus credenciales de Firebase:
   ```env
   REACT_APP_FIREBASE_API_KEY=tu_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=tu_proyecto_id
   # ... resto de variables
   ```

4. **Configurar Firebase**
   - Crear proyecto en [Firebase Console](https://console.firebase.google.com)
   - Habilitar Authentication (Email/Password y Anonymous)
   - Crear base de datos Firestore
   - Configurar reglas de seguridad (ver sección Seguridad)

5. **Iniciar aplicación**
   ```bash
   pnpm start
   ```

## 🔐 Configuración de Seguridad

### Reglas de Firestore (IMPORTANTE)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo administradores autenticados pueden escribir
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.token.email != null;
    }
    
    // Usuarios anónimos solo pueden leer datos públicos y votar
    match /artifacts/{appId}/public/data/{document=**} {
      allow read: if request.auth != null;
    }
    
    match /artifacts/{appId}/public/data/votes/{voteId} {
      allow create: if request.auth != null && 
                      request.resource.data.voterCode is string &&
                      request.resource.data.electionId is string;
    }
    
    match /artifacts/{appId}/public/data/voters/{voterId} {
      allow update: if request.auth != null && 
                      resource.id == voterId &&
                      request.resource.data.diff(resource.data).affectedKeys() == ['hasVoted'].toSet();
    }
  }
}
```

## 📖 Uso

### Administrador
1. Acceder con credenciales de administrador
2. Crear nueva elección con opciones
3. Importar lista de votantes (Excel/CSV)
4. Activar elección
5. Monitorear resultados en tiempo real
6. Exportar resultados finales

### Estudiante
1. Ingresar código estudiantil
2. Seleccionar opción de voto
3. Confirmar voto
4. Recibir confirmación

## 📊 Scripts Disponibles

```bash
# Desarrollo
pnpm start          # Iniciar servidor de desarrollo
pnpm build          # Crear build de producción
pnpm test           # Ejecutar tests

# Análisis
pnpm build:analyze  # Analizar tamaño del bundle
```

## 🚀 Despliegue

### Firebase Hosting (Recomendado)
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login y configurar
firebase login
firebase init hosting

# Desplegar
pnpm build
firebase deploy
```

### Netlify / Vercel
1. Conectar repositorio
2. Configurar variables de entorno
3. Build command: `pnpm build`
4. Publish directory: `build`

## 🔧 Estructura del Proyecto

```
src/
├── App.js              # Componente principal
├── App.css             # Estilos globales
├── index.js            # Punto de entrada
└── components/         # Componentes (futuras versiones)

public/
├── index.html          # Template HTML
├── manifest.json       # PWA manifest
└── favicon.ico         # Icono

Firebase/
├── firestore.rules     # Reglas de seguridad
├── firebase.json       # Configuración Firebase
└── .env               # Variables de entorno (no incluir en Git)
```

## 🤝 Contribuir

1. Fork del proyecto
2. Crear branch para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver [LICENSE](LICENSE) para detalles.

## 👥 Autores

- **Tu Nombre** - *Desarrollo inicial* - [tu-usuario](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- Unidad Educativa Ecuatoriana Austriaca
- Comunidad de React y Firebase
- Contribuidores del proyecto

---

**⚠️ Nota de Seguridad**: Este sistema maneja datos sensibles de votación. Asegúrate de seguir todas las mejores prácticas de seguridad antes de usar en producción.
