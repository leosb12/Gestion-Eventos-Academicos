import {NavLink} from "react-router-dom";

const Navbar = () => {
    return (
        <nav className="navbar bg-primary navbar-expand-lg navbar-dark p-2">
            <div className="container">
                <a className="navbar-brand d-flex align-items-center" href="#">
                    <img src="/logo.png" alt="Logo" width="34" height="28" className="d-inline-block align-text-top me-2" />
                    <span className="text-light fw-bold fs-3">NotiFicct</span>
                </a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
                        aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <NavLink
                                to="/"
                                className={({ isActive }) => `nav-link fs-5 ${isActive ? "active fw-bold" : ""}`}
                            >
                                Inicio
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink
                                to="/iniciar-sesion"
                                className={({ isActive }) => `nav-link fs-5 ${isActive ? "active fw-bold" : ""}`}
                            >
                                Perfil
                            </NavLink>
                        </li>
                        <li className="nav-item dropdown">
                            <a className="nav-link dropdown-toggle fs-5" href="#" role="button" data-bs-toggle="dropdown"
                               aria-expanded="false">
                               Eventos
                            </a>
                            <ul className="dropdown-menu">
                                <li><a className="dropdown-item" href="#">Conferencia</a></li>
                                <li><a className="dropdown-item" href="#">Feria Expositiva</a></li>
                                <li><a className="dropdown-item" href="#">Taller</a></li>
                                <li><a className="dropdown-item" href="#">Hackaton</a></li>
                                <li><a className="dropdown-item" href="#">Cursos</a></li>
                                <li>
                                    <hr className="dropdown-divider"/>
                                </li>
                                <li>
                                    <NavLink
                                        to="/crear-evento"
                                        className={({ isActive }) => `dropdown-item ${isActive ? "active fw-bold" : ""}`}
                                    >
                                        Crear Evento
                                    </NavLink>
                                </li>
                            </ul>
                        </li>
                    </ul>
                    <form className="d-flex" role="search">
                        <input className="form-control me-2" type="search" placeholder="Buscar Evento" aria-label="Search"/>
                        <button className="btn btn-primary border-light btn-light-outline-sucess" type="submit">Search</button>
                    </form>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;