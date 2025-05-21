import React from 'react';
import { Navigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext.jsx";

const PrivateRoute = ({ children }) => {
  const auth = UserAuth();

  if (!auth || auth.session === undefined) {
    // Mientras carga el contexto
    return <p className="text-center mt-5">Cargando...</p>;
  }

  return auth.session
      ? <>{children}</>
      : <Navigate to="/iniciar-sesion" replace/>;
  };

export default PrivateRoute;
