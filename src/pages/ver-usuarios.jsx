import React, {useEffect, useState} from 'react';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import {useNavigate} from 'react-router-dom';

const VerUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verificado, setVerificado] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const verificarPermisos = async () => {
            const {data: sessionData, error: sessionError} = await supabase.auth.getUser();

            if (sessionError || !sessionData?.user) {
                navigate('/'); // no logueado
                return;
            }

            const correo = sessionData.user.email;

            const {data: usuario, error: errorUsuario} = await supabase
                .from('usuario')
                .select('id_tipo_usuario')
                .eq('correo', correo)
                .single();

            if (errorUsuario || !usuario || usuario.id_tipo_usuario !== 7) {
                navigate('/'); // no tiene permiso
                return;
            }

            setVerificado(true);
        };

        verificarPermisos();
    }, [navigate]);

    useEffect(() => {
        const obtenerUsuarios = async () => {
            const {data, error} = await supabase
                .from('usuario')
                .select('id, nombre');

            if (error) {
                console.error('Error al obtener usuarios:', error.message);
            } else {
                setUsuarios(data);
            }

            setLoading(false);
        };

        if (verificado) {
            obtenerUsuarios();
        }
    }, [verificado]);

    const irAPerfil = (id) => {
        navigate(`/perfil-usuario/${id}`);
    };

    if (!verificado) return <p className="text-center mt-5">Verificando acceso...</p>;

    return (
        <>
            <Navbar/>
            <div className="container mt-4">
                <h2 className="mb-4 text-dark">Usuarios Registrados</h2>
                <p className="mb-4 text-secondary">Cantidad de usuarios: {usuarios.length}</p>

                {loading ? (
                    <p className="text-secondary">Cargando usuarios...</p>
                ) : (
                    <div className="table-responsive shadow rounded">
                        <table className="table table-striped table-light align-middle">
                            <thead className="table-primary text-center">
                            <tr>
                                <th scope="col">Registro</th>
                                <th scope="col">Nombre</th>
                                <th scope="col">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="text-center">
                            {usuarios.map((usuario) => (
                                <tr key={usuario.id}>
                                    <td>{usuario.id}</td>
                                    <td>{usuario.nombre}</td>
                                    <td>
                                        <button
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => irAPerfil(usuario.id)}
                                        >
                                            Ver Perfil
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

export default VerUsuarios;
