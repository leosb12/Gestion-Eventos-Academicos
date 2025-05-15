// src/router.jsx

import React from "react";
import { createBrowserRouter } from "react-router-dom";
import MainLayout   from "./layouts/MainLayout.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import App          from "./App.jsx";
import Login        from "./pages/Login.jsx";
import Register     from "./pages/Register.jsx";
import CrearEvento  from "./pages/CrearEvento.jsx";
import Dashboard    from "./pages/Dashboard.jsx";
import NotFound     from "./pages/NotFound.jsx";
import UpdatePassword from "./pages/UpdatePassword.jsx";
import DetalleEvento from "./pages/DetalleEvento";

export const router =  createBrowserRouter([
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
        element: <UpdatePassword /> },
      {
        path: "evento/:id",
        element: <DetalleEvento />
      }
    ]
  },
  {
    path: "*",
    element: <NotFound />
  }
]);
