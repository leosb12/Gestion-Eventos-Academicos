import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext.jsx';
import BuscadorEventos from './BuscadorEventos.jsx'; // ✅ Tu componente separado

export default function Navbar() {
  const { session, tipoUsuario, signOut } = UserAuth();
  const esAdmin = tipoUsuario === 6 || tipoUsuario === 7;
  const location = useLocation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const hiddenPaths = ['/iniciar-sesion', '/registro'];
  if (hiddenPaths.includes(location.pathname)) return null;

  const handleOpenModal = () => setShowModal(true);
  const handleCancel = () => setShowModal(false);
  const handleConfirmLogout = async () => {
    await signOut();
    setShowModal(false);
    navigate('/iniciar-sesion');
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3 position-relative">
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
          {/* Menú principal - izquierda */}
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
                {session && esAdmin && (
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

          {/* 🔍 Acá va el buscador minimalista */}
          <BuscadorEventos />

          {/* Menú derecho - Dropdown de Perfil */}
          {session && (
            <ul className="navbar-nav ms-lg-auto ms-0">
              <li className="nav-item dropdown position-relative">
                <a
                  className="nav-link dropdown-toggle fs-5 text-light"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Perfil
                </a>
                <ul
                  className="dropdown-menu bg-primary border-0 shadow-none"
                  style={{
                    minWidth: "160px",
                    maxWidth: "250px",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    position: "absolute",
                    right: 0,
                    left: "auto",
                    zIndex: 1050
                  }}
                >
                  <li>
                    <NavLink to="/perfil" className="dropdown-item text-white">
                      Ver Perfil
                    </NavLink>
                  </li>
                  <li>
                    <button
                      className="dropdown-item text-white"
                      onClick={handleOpenModal}
                      style={{ cursor: "pointer" }}
                    >
                      Cerrar Sesión
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          )}
        </div>
      </nav>

      {/* Modal de confirmación */}
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
