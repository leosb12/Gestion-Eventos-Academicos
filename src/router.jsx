import React from "react";
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import App from "./App.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import CrearEvento from "./pages/CrearEvento.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import NotFound from "./pages/NotFound.jsx";
import UpdatePassword from "./pages/UpdatePassword.jsx";
import Perfil from "./pages/Perfil.jsx";
import DetalleEvento from "./pages/DetalleEvento.jsx";
import MisEventos from "./pages/MisEventos.jsx";
import GestionarEventos from './pages/GestionarEventos';
import VerUsuarios from "./pages/ver-usuarios.jsx"; // ajustá el path si está en otro folder
import PerfilUsuario from './pages/PerfilUsuario';
import DarRol from './pages/DarRol';
import EliminarUsuario from './pages/eliminar-usuario';
import EventosPorTipo from './pages/EventosPorTipo';
import GestionarEventos from './pages/GestionarEventos';
import InscribirEquipo from "./pages/InscribirEquipo.jsx";
// ajustá el path si está en otro folder


export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: (
          <PrivateRoute>
            <App />
          </PrivateRoute>
        )
       },
      {
        path: "GestionarEventos",
        element: <GestionarEventos />
        },
      {
        path: "iniciar-sesion",
        element: <Login />
      },
      {
        path: "registro",
        element: <Register />
      },
      {
        path: "crear-evento",
        element: (
          <PrivateRoute>
            <CrearEvento />
          </PrivateRoute>
        )
      },
      {
        path: "dashboard",
        element: (
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        )
      },
      {
        path: "update-password",
        element: <UpdatePassword />
      },
      {
        path: "perfil",
        element: (
          <PrivateRoute>
            <Perfil />
          </PrivateRoute>
        )
      },
      {
        path: "evento/:id",
        element: (
          <PrivateRoute>
            <DetalleEvento />
          </PrivateRoute>
        )
      },
      {
        path: "mis-eventos",
        element: (
          <PrivateRoute>
            <MisEventos />
          </PrivateRoute>
        )
      },
      {
          path: "inscribir-equipo/:id",
          element: (
          <PrivateRoute>
            <InscribirEquipo />
          </PrivateRoute>
        )
      }
    ]

  },
  {
    path: "*",
    element: <NotFound />
  },
    {
        path: "/",
        element: <MainLayout/>,
        children: [
            {
                index: true,
                element: (
                    <PrivateRoute>
                        <App/>
                    </PrivateRoute>
                )
            },
            {
                path: "GestionarEventos",
                element: <GestionarEventos/>
            },
            {
                path: '/eventos-tipo/:id',
                element: <EventosPorTipo/>
            },
            {
                path: 'eliminar-usuario',
                element: <EliminarUsuario/>
            },
            {
                path: "iniciar-sesion",
                element: <Login/>
            },
            {
                path: "registro",
                element: <Register/>
            },
            {
                path: "crear-evento",
                element: (
                    <PrivateRoute>
                        <CrearEvento/>
                    </PrivateRoute>
                )
            },
            {
                path: "dashboard",
                element: (
                    <PrivateRoute>
                        <Dashboard/>
                    </PrivateRoute>
                )
            },

            {
                path: 'dar-rol',
                element: <DarRol/>
            },

            {
                path: "update-password",
                element: <UpdatePassword/>
            },
            {
                path: "ver-usuarios",
                element: <VerUsuarios/>
            },
            {
                path: "perfil",
                element: (
                    <PrivateRoute>
                        <Perfil/>
                    </PrivateRoute>
                )
            },
            {
                path: "evento/:id",
                element: (
                    <PrivateRoute>
                        <DetalleEvento/>
                    </PrivateRoute>
                )
            },
            {
                path: "perfil-usuario/:id",
                element: <PerfilUsuario/>
            },
            {
                path: "mis-eventos",
                element: (
                    <PrivateRoute>
                        <MisEventos/>
                    </PrivateRoute>
                )
            }
        ]
    },
    {
        path: "*",
        element: <NotFound/>
    }
]);
