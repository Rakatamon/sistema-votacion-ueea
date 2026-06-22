<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png" alt="React Logo" width="100" />
  <h1>🗳️ Sistema de Votación Escolar</h1>
  <p><strong>Un sistema de votación electrónica moderno, seguro y eficiente, diseñado para procesos electorales estudiantiles.</strong></p>
</div>

<br />

## 🚀 Características Principales

*   📊 **Dashboard Administrativo**: Panel de control interactivo para gestionar elecciones, cursos y estudiantes.
*   📱 **Votación Intuitiva**: Interfaz amigable para que los estudiantes emitan su voto de forma rápida desde cualquier dispositivo.
*   👥 **Importación Masiva**: Carga rápida de padrón electoral mediante archivos Excel o CSV.
*   📈 **Resultados en Tiempo Real**: Estadísticas y gráficos al instante utilizando Recharts.
*   🖨️ **Exportación de Datos**: Generación automática de reportes en PDF y generación de códigos únicos para imprimir.
*   🔒 **Alta Seguridad**: Integración con Firebase Authentication y validación en tiempo real para prevenir doble votación.

## 🛠️ Stack Tecnológico

Este proyecto fue desarrollado utilizando herramientas modernas para garantizar escalabilidad y excelente experiencia de usuario:

*   **Frontend**: React 19 + Vite
*   **Estilos**: Tailwind CSS v4
*   **Backend & Base de Datos**: Firebase (Firestore, Authentication)
*   **Gráficos**: Recharts
*   **Exportación PDF**: jsPDF & html-to-image
*   **Iconos**: Lucide React

## ⚙️ Instalación y Uso Local

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/josuegomez/sistema-votacion-ueea.git
   cd sistema-votacion-ueea
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar Variables de Entorno**
   Renombra `.env.example` a `.env` y coloca las credenciales de tu proyecto de Firebase.

4. **Ejecutar el Servidor de Desarrollo**
   ```bash
   pnpm run dev
   ```

## 🏗️ Despliegue

Este sistema está listo para ser desplegado en plataformas modernas como **Vercel**, **Netlify**, o **Firebase Hosting**. Solo ejecuta `pnpm build` para generar los archivos optimizados listos para producción.

---

<div align="center">
  <p>Desarrollado y mantenido de forma independiente para facilitar procesos electorales.</p>
  <b>Hecho con ❤️ por Josue Gomez</b>
</div>
