import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { session, signOut } = UserAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const hiddenPaths = ['/iniciar-sesion', '/registro'];
  if (hiddenPaths.includes(location.pathname)) return null;

  const handleOpenModal = () => {
    console.log('↪️  Abrir modal');
    setShowModal(true);
  };
  const handleCancel = () => {
    console.log('↪️  Cancelar modal');
    setShowModal(false);
  };
  const handleConfirmLogout = async () => {
    console.log('↪️  Confirmar logout');
    const res = await signOut();
    console.log('↪️  signOut res:', res);
    setShowModal(false);
    navigate('/iniciar-sesion');
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3">
        <NavLink className="navbar-brand d-flex align-items-center" to="/">
          <img src="/logo.png" alt="Logo" width="32" height="32" className="me-2" />
          <span className="fw-bold fs-4">NotiFicct</span>
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `nav-link fs-5 ${isActive ? 'active fw-bold' : ''}`
                }
              >
                Inicio
              </NavLink>
            </li>
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle fs-5"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Eventos
              </a>
              <ul className="dropdown-menu">
                <li>
                  <NavLink to="/" className="dropdown-item">
                    Ver Eventos
                  </NavLink>
                </li>
                {session && (
                  <>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <NavLink to="/crear-evento" className="dropdown-item">
                        Crear Evento
                      </NavLink>
                    </li>
                  </>
                )}
              </ul>
            </li>
          </ul>

          {session && (
            <button
              className="btn btn-outline-light"
              onClick={handleOpenModal}
            >
              Cerrar Sesión
            </button>
          )}
        </div>
      </nav>

      {showModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <h5 className="mb-3">¿Seguro que quieres cerrar sesión?</h5>
            <div className="custom-modal-footer">
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmLogout}
              >
                Sí, cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
