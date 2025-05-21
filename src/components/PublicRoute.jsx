import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext.jsx';

const PublicRoute = ({ children }) => {
  const { session } = UserAuth();

  // Mientras carga la sesión
  if (session === undefined) {
    return <p className="text-center mt-5">Cargando...</p>;
  }

  return session
    ? <Navigate to="/" replace />
    : <>{children}</>;
};

export default PublicRoute;