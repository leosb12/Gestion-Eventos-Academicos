import React, {useEffect, useState} from 'react';
import {NavLink, useLocation, useNavigate} from 'react-router-dom';
import {UserAuth} from '../context/AuthContext.jsx';
import supabase from '../utils/supabaseClient';
import BuscadorEventos from './BuscadorEventos.jsx';

export default function Navbar() {
    const {session, tipoUsuario, signOut} = UserAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [tiposEvento, setTiposEvento] = useState([]);
    const [submenuAbierto, setSubmenuAbierto] = useState(false); // 👈 nuevo

    useEffect(() => {
        const fetchTipos = async () => {
            const {data, error} = await supabase.from('tipoevento').select('id, nombre').order('id');
            if (!error) setTiposEvento(data);
        };
        fetchTipos();
    }, []);

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
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3">
                <NavLink className="navbar-brand d-flex align-items-center" to="/">
                    <img src="/logo.png" alt="Logo" width="32" height="32" className="me-2"/>
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
                    <span className="navbar-toggler-icon"/>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav mb-2 mb-lg-0 w-100">
                        <li className="nav-item">
                            <NavLink
                                to="/"
                                className={({isActive}) =>
                                    `nav-link fs-5 text-white ${isActive ? 'fw-bold' : ''}`
                                }
                            >
                                Inicio
                            </NavLink>
                        </li>

                        <li className="nav-item dropdown">
                            <a
                                className="nav-link dropdown-toggle fs-5 text-white"
                                href="#"
                                role="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                Eventos
                            </a>
                            <ul className="dropdown-menu bg-primary border-0 shadow-none">

                                <li className="dropdown-submenu">
                                    <button
                                        type="button"
                                        className="dropdown-item text-white"
                                        onClick={(e) => {
                                            e.stopPropagation(); // 👈 esto evita que se cierre el menú "Eventos"
                                            setSubmenuAbierto(!submenuAbierto);
                                        }}
                                        style={{width: '100%', textAlign: 'left', background: 'none', border: 'none'}}
                                    >
                                        Categorias... ▼
                                    </button>

                                    {submenuAbierto && (
                                        <ul className="dropdown-menu show" style={{
                                            position: 'relative',
                                            background: 'transparent',
                                            border: 'none',
                                            boxShadow: 'none'
                                        }}>
                                            {tiposEvento.map((tipo) => (
                                                <li key={tipo.id}>
                                                    <NavLink
                                                        to={`/eventos-tipo/${tipo.id}`}
                                                        className={({isActive}) =>
                                                            `dropdown-item text-white ${isActive ? 'fw-bold' : ''}`
                                                        }
                                                    >
                                                        {tipo.nombre}
                                                    </NavLink>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>


                                <li>
                                    <NavLink
                                        to="/mis-eventos"
                                        className={({isActive}) =>
                                            `dropdown-item text-white ${isActive ? 'fw-bold' : ''}`
                                        }
                                    >
                                        Mis Eventos
                                    </NavLink>
                                </li>

                                {session && (
                                    <>
                                        <li>
                                            <hr className="dropdown-divider"/>
                                        </li>
                                        <li>
                                            <NavLink
                                                to="/crear-evento"
                                                className={({isActive}) =>
                                                    `dropdown-item text-white ${isActive ? 'fw-bold' : ''}`
                                                }
                                            >
                                                Crear Evento
                                            </NavLink>
                                        </li>
                                        {(tipoUsuario === 6 || tipoUsuario === 7) && (
                                            <li>
                                                <NavLink
                                                    to="/GestionarEventos"
                                                    className={({isActive}) =>
                                                        `dropdown-item text-white ${isActive ? 'fw-bold' : ''}`
                                                    }
                                                >
                                                    Gestionar Eventos
                                                </NavLink>
                                            </li>
                                        )}
                                    </>
                                )}
                            </ul>
                        </li>

                        {/* Menú de Usuarios para tipoUsuario 7 */}
                        {tipoUsuario === 7 && (
                            <li className="nav-item dropdown">
                                <a
                                    className="nav-link dropdown-toggle fs-5 text-white"
                                    href="#"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    Usuarios
                                </a>
                                <ul className="dropdown-menu bg-primary border-0 shadow-none">
                                    <li>
                                        <NavLink
                                            to="/ver-usuarios"
                                            className={({isActive}) =>
                                                `dropdown-item text-white ${isActive ? 'fw-bold' : ''}`
                                            }
                                        >
                                            Ver Usuarios
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to="/dar-rol"
                                            className={({isActive}) =>
                                                `dropdown-item text-white ${isActive ? 'fw-bold' : ''}`
                                            }
                                        >
                                            Dar Rol
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to="/eliminar-usuario"
                                            className={({isActive}) =>
                                                `dropdown-item text-white ${isActive ? 'fw-bold' : ''}`
                                            }
                                        >
                                            Eliminar Usuario
                                        </NavLink>
                                    </li>
                                </ul>
                            </li>
                        )}

                        {/* Menú Perfil */}
                        {session && (
                            <li className="nav-item dropdown">
                                <a
                                    className="nav-link dropdown-toggle fs-5 text-white"
                                    href="#"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    Perfil
                                </a>
                                <ul className="dropdown-menu bg-primary border-0 shadow-none">
                                    <li>
                                        <NavLink
                                            to="/perfil"
                                            className={({isActive}) =>
                                                `dropdown-item text-white ${isActive ? 'fw-bold' : ''}`
                                            }
                                        >
                                            Ver Perfil
                                        </NavLink>
                                    </li>
                                    <li>
                                        <button
                                            className="dropdown-item text-white"
                                            onClick={handleOpenModal}
                                            style={{cursor: 'pointer'}}
                                        >
                                            Cerrar Sesión
                                        </button>
                                    </li>
                                </ul>
                            </li>
                        )}

                        <li className="nav-item d-none d-lg-block align-self-center">
                            <BuscadorEventos/>
                        </li>
                    </ul>

                    <div className="w-100 mt-2 d-lg-none">
                        <BuscadorEventos/>
                    </div>
                </div>
            </nav>

            {/* Modal de cierre de sesión */}
            {showModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-content">
                        <h5 className="mb-3">¿Seguro que quieres cerrar sesión?</h5>
                        <div className="custom-modal-footer">
                            <button className="btn btn-secondary" onClick={handleCancel}>
                                Cancelar
                            </button>
                            <button className="btn btn-danger" onClick={handleConfirmLogout}>
                                Sí, cerrar sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
