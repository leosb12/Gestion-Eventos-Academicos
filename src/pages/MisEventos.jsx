import React, {useEffect, useState} from 'react';
import {UserAuth} from '../context/AuthContext';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import {useNavigate} from 'react-router-dom';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MisEventos = () => {
    const {user} = UserAuth();
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const obtenerEventos = async () => {
            if (!user?.email) return;
            const {data: usuario, error: errorUsuario} = await supabase
                .from('usuario')
                .select('id')
                .eq('correo', user.email)
                .maybeSingle();

            if (errorUsuario || !usuario) return;

            const {data, error} = await supabase
                .from('evento')
                .select('*')
                .eq('id_usuario_creador', usuario.id)
                .order('fechainicio', {ascending: true});

            if (error) {
                toast.error('Error al cargar eventos');
            } else {
                setEventos(data);
            }
            setLoading(false);
        };

        obtenerEventos();
    }, [user]);

    const formatearFecha = (fechaStr) => {
        if (!fechaStr) return '';
        const [year, month, day] = fechaStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const descripcionLimitada = (texto, limite) => {
        if (!texto) return '';
        return texto.length > limite ? texto.slice(0, limite) + '...' : texto;
    };

    return (
        <>
            <Navbar/>
            <div className="container mt-4">
                <h2 className="mb-4 text-center">EVENTOS CREADOS</h2>
                {loading ? (
                    <p>Cargando...</p>
                ) : eventos.length === 0 ? (
                    <p>No tienes eventos creados.</p>
                ) : (
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                        {eventos.map((evento) => (
                            <div className="col" key={evento.id}>
                                <div
                                    className="card h-100 shadow-sm p-2 text-center"
                                    style={{cursor: 'pointer'}}
                                    onClick={() => navigate(`/detalle-evento-creador/${evento.id}`)}
                                >
                                    <img
                                        src={evento.imagen_url || '/noDisponible.jpg'}
                                        className="card-img-top"
                                        alt={evento.nombre}
                                        style={{objectFit: 'cover', height: '200px'}}
                                    />
                                    <div className="card-body d-flex flex-column">
                                        <h5 className="card-title">{evento.nombre}</h5>
                                        <p className="card-text">
                                            {descripcionLimitada(evento.descripcion, 100)}
                                        </p>
                                        <p className="text-muted small mb-0">
                                            {formatearFecha(evento.fechainicio)} - {formatearFecha(evento.fechafin)}
                                        </p>
                                        <button
                                            className="btn btn-outline-primary btn-sm mt-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/detalle-evento-creador/${evento.id}`);
                                            }}
                                        >
                                            Gestionar Evento
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default MisEventos;
