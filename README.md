# Sistema de Información para la Gestión de Eventos Académicos

Este proyecto es una aplicación web desarrollada como parte de la materia **Sistemas de Información I** en la Facultad de Ciencias de la Computación y Telecomunicaciones (UAGRM). El objetivo es facilitar la planificación y gestión de eventos académicos, formativos, recreativos y extracurriculares dentro de la facultad.

## 🧑‍💻 Sobre el proyecto

El proyecto es un sistema real de gestión institucional, integrando múltiples áreas tecnológicas y roles del desarrollo de software. Como grupo, trabajamos de manera integral en todas las capas del sistema: desde el diseño de interfaces con React, hasta la lógica y la configuración de base de datos relacional con PostgreSQL, utilizando Supabase como plataforma backend.

Cada integrante participó activamente en el desarrollo de funcionalidades frontend, backend y modelado de datos, cumpliendo con un enfoque de rotación de tareas que nos permitió adquirir experiencia práctica en el ciclo completo de desarrollo de software.

El resultado es una aplicación web funcional y escalable, orientada a la planificación y administración de eventos académicos, formativos y extracurriculares dentro del contexto universitario.

## 🚀 Tecnologías utilizadas

- **Frontend**: [React](https://reactjs.org/) con [Vite](https://vitejs.dev/) para una experiencia de desarrollo rápida y moderna.
- **Backend y Base de Datos**: [Supabase](https://supabase.com/), que proporciona:
  - **PostgreSQL** como sistema de gestión de bases de datos relacional.
  - **Supabase Auth** para la autenticación de usuarios.
  - **Supabase Storage** para el manejo de archivos y recursos multimedia.
- **Estilizado**: [Tailwind CSS](https://tailwindcss.com/) para un diseño responsivo y moderno.
- **Despliegue**: [Vercel](https://vercel.com/) para el hosting y despliegue continuo de la aplicación.

## 🧩 Estructura del proyecto

- `/src`: Contiene el código fuente de la aplicación.
  - `/components`: Componentes reutilizables de la interfaz de usuario.
  - `/pages`: Páginas principales de la aplicación.
  - `/utils`: Funciones y configuraciones auxiliares, incluyendo la conexión con Supabase.
- `/public`: Archivos estáticos y recursos públicos.
- `/supabase`: Configuraciones y scripts relacionados con Supabase.

## 🔐 Autenticación y rutas protegidas

La aplicación implementa un sistema de autenticación utilizando **Supabase Auth**. Se han definido rutas protegidas que requieren que el usuario esté autenticado para acceder a ciertas secciones de la aplicación. Esto se maneja mediante componentes como `PrivateRoute.jsx` y configuraciones en `router.jsx`.

## 📦 Visualización del proyecto

El proyecto está desplegado y disponible públicamente en el siguiente enlace:

🔗 [Ver aplicación web](http://notificct.dpdns.org)
