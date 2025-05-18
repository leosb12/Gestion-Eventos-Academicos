import React, {useEffect, useState} from 'react';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import {useNavigate} from 'react-router-dom';

const EliminarUsuario = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(true);
    const [verificado, setVerificado] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // ✅ Verificación de permiso tipo_usuario = 7
        const verificarPermisos = async () => {
            const {data: sessionData, error: sessionError} = await supabase.auth.getUser();

            if (sessionError || !sessionData?.user) {
                navigate('/');
                return;
            }

            const correo = sessionData.user.email;

            const {data: userData, error: errorUsuario} = await supabase
                .from('usuario')
                .select('id_tipo_usuario')
                .eq('correo', correo)
                .single();

            if (errorUsuario || !userData || userData.id_tipo_usuario !== 7) {
                navigate('/');
                return;
            }

            setVerificado(true);
        };

        verificarPermisos();
    }, [navigate]);

    useEffect(() => {
        const mensajeGuardado = localStorage.getItem('mensajeEliminado');
        if (mensajeGuardado) {
            setMensaje(mensajeGuardado);
            setTimeout(() => {
                setMensaje('');
                localStorage.removeItem('mensajeEliminado');
            }, 2000);
        }

        const obtenerUsuarios = async () => {
            setLoading(true);
            const {data, error} = await supabase
                .from('usuario')
                .select('id, nombre, correo')
                .order('id');

            if (error) {
                setMensaje('Error al cargar usuarios.');
            } else {
                setUsuarios(data);
            }

            setLoading(false);
        };

        if (verificado) {
            obtenerUsuarios();
        }
    }, [verificado]);

    const eliminarUsuario = async (id, nombre) => {
        const confirmar = window.confirm(`¿Estás seguro de eliminar al usuario "${nombre}" (${id})?`);
        if (!confirmar) return;

        const {error} = await supabase
            .from('usuario')
            .delete()
            .eq('id', id);

        if (error) {
            setMensaje(`❌ Error al eliminar al usuario ${id}`);
        } else {
            localStorage.setItem('mensajeEliminado', `🗑️ Usuario ${id} eliminado correctamente.`);
            window.location.reload();
        }
    };

    if (!verificado) return <p className="text-center mt-5">Verificando acceso...</p>;

    return (
        <>
            <Navbar/>
            <div className="container mt-4">
                <h2 className="text-dark">Eliminar Usuarios</h2>
                <p className="mb-3 text-secondary">Cantidad de usuarios: {usuarios.length}</p>

                {mensaje && <div className="alert alert-info">{mensaje}</div>}

                {loading ? (
                    <p>Cargando usuarios...</p>
                ) : (
                    <div className="table-responsive shadow rounded">
                        <table className="table table-striped table-light align-middle">
                            <thead className="table-danger text-center">
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th className="d-none d-md-table-cell">Correo</th>
                                <th>Acción</th>
                            </tr>
                            </thead>
                            <tbody className="text-center">
                            {usuarios.map((usuario) => (
                                <tr key={usuario.id}>
                                    <td>{usuario.id}</td>
                                    <td>{usuario.nombre}</td>
                                    <td className="d-none d-md-table-cell">{usuario.correo}</td>
                                    <td>
                                        <button
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => eliminarUsuario(usuario.id, usuario.nombre)}
                                        >
                                            Eliminar
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

export default EliminarUsuario;
