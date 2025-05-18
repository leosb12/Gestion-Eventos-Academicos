import React, {useEffect, useState} from 'react';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import {useNavigate} from 'react-router-dom';

const DarRol = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [mensaje, setMensaje] = useState('');
    const [rolSeleccionado, setRolSeleccionado] = useState({});
    const [loading, setLoading] = useState(true);
    const [verificado, setVerificado] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // ✅ Verificar si el usuario es tipo 7
        const verificarPermiso = async () => {
            const {data: sessionData, error: sessionError} = await supabase.auth.getUser();

            if (sessionError || !sessionData?.user) {
                navigate('/');
                return;
            }

            const correo = sessionData.user.email;

            const {data: userData, error: errorUser} = await supabase
                .from('usuario')
                .select('id_tipo_usuario')
                .eq('correo', correo)
                .single();

            if (errorUser || !userData || userData.id_tipo_usuario !== 7) {
                navigate('/');
                return;
            }

            setVerificado(true);
        };

        verificarPermiso();
    }, [navigate]);

    useEffect(() => {
        const mensajeGuardado = localStorage.getItem('mensajeExito');
        if (mensajeGuardado) {
            setMensaje(mensajeGuardado);
            setTimeout(() => {
                setMensaje('');
                localStorage.removeItem('mensajeExito');
            }, 2000);
        }

        const cargarDatos = async () => {
            setLoading(true);

            const {data: usuariosData, error: errorUsuarios} = await supabase
                .from('usuario')
                .select('id, nombre, correo, id_tipo_usuario, tipousuario(nombre)')
                .order('id');

            const {data: rolesData, error: errorRoles} = await supabase
                .from('tipousuario')
                .select('id, nombre');

            if (errorUsuarios || errorRoles) {
                setMensaje('Error al cargar los datos.');
                setLoading(false);
                return;
            }

            setUsuarios(usuariosData);
            setRoles(rolesData);

            const inicial = {};
            usuariosData.forEach(u => {
                inicial[u.id] = u.id_tipo_usuario;
            });
            setRolSeleccionado(inicial);

            setLoading(false);
        };

        if (verificado) {
            cargarDatos();
        }
    }, [verificado]);

    const handleChange = (idUsuario, nuevoRol) => {
        setRolSeleccionado(prev => ({
            ...prev,
            [idUsuario]: parseInt(nuevoRol),
        }));
    };

    const actualizarRol = async (idUsuario) => {
        const nuevoRol = rolSeleccionado[idUsuario];

        const {error} = await supabase
            .from('usuario')
            .update({id_tipo_usuario: nuevoRol})
            .eq('id', idUsuario);

        if (error) {
            setMensaje(`❌ Error al actualizar el rol del usuario ${idUsuario}`);
        } else {
            localStorage.setItem('mensajeExito', `✅ Rol del usuario ${idUsuario} actualizado correctamente.`);
            window.location.reload();
        }
    };

    if (!verificado) return <p className="text-center mt-5">Verificando acceso...</p>;

    return (
        <>
            <Navbar/>
            <div className="container mt-4">
                <h2 className="text-dark">Asignar Rol a Usuarios</h2>
                <p className="mb-3 text-secondary">Cantidad de usuarios: {usuarios.length}</p>

                {mensaje && <div className="alert alert-info">{mensaje}</div>}

                {loading ? (
                    <p>Cargando datos...</p>
                ) : (
                    <div className="table-responsive shadow rounded">
                        <table className="table table-striped table-light align-middle">
                            <thead className="table-primary text-center">
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th className="d-none d-md-table-cell">Correo</th>
                                <th className="d-none d-md-table-cell">Rol Actual</th>
                                <th>Nuevo Rol</th>
                                <th>Acción</th>
                            </tr>
                            </thead>
                            <tbody className="text-center">
                            {usuarios.map((usuario) => (
                                <tr key={usuario.id}>
                                    <td>{usuario.id}</td>
                                    <td>{usuario.nombre}</td>
                                    <td className="d-none d-md-table-cell">{usuario.correo}</td>
                                    <td className="d-none d-md-table-cell">{usuario.tipousuario?.nombre || 'Desconocido'}</td>
                                    <td>
                                        <select
                                            className="form-select form-select-sm"
                                            value={rolSeleccionado[usuario.id]}
                                            onChange={(e) => handleChange(usuario.id, e.target.value)}
                                        >
                                            {roles.map((rol) => (
                                                <option key={rol.id} value={rol.id}>
                                                    {rol.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-outline-success btn-sm"
                                            onClick={() => actualizarRol(usuario.id)}
                                        >
                                            Actualizar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};

export default DarRol;
