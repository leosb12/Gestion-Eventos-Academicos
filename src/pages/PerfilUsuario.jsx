import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';

const PerfilUsuario = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    const [eventosCreados, setEventosCreados] = useState([]);
    const [eventosInscritos, setEventosInscritos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [verificado, setVerificado] = useState(false);

    useEffect(() => {
        const verificarPermiso = async () => {
            const {data: sessionData, error: sessionError} = await supabase.auth.getUser();

            if (sessionError || !sessionData?.user) {
                navigate('/');
                return;
            }

            const correo = sessionData.user.email;

            const {data: userData, error: errorUser} = await supabase
                .from('usuario')
                .select('id, id_tipo_usuario')
                .eq('correo', correo)
                .single();

            if (errorUser || !userData) {
                navigate('/');
                return;
            }

            const esAdmin = userData.id_tipo_usuario === 7;
            const esPropioPerfil = String(userData.id) === id;

            if (!esAdmin && !esPropioPerfil) {
                navigate('/');
                return;
            }

            setVerificado(true);
        };

        verificarPermiso();
    }, [navigate, id]);

    useEffect(() => {
        const cargarDatos = async () => {
            const {data: usuarioData, error} = await supabase
                .from('usuario')
                .select('id, nombre, correo, fecha_nacimiento, id_tipo_usuario, tipousuario(nombre)')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error usuario:', error.message);
                setCargando(false);
                return;
            }

            setUsuario(usuarioData);

            const {data: creados} = await supabase
                .from('evento')
                .select('id, nombre, fechainicio, fechafin, imagen_url')
                .eq('id_usuario_creador', id);

            setEventosCreados(creados || []);

            const {data: inscripciones, error: errorInscritos} = await supabase
                .from('inscripcionevento')
                .select('evento:id_evento (id, nombre, fechainicio, fechafin, imagen_url)')
                .eq('id_usuario', id);

            if (errorInscritos) {
                console.error('Error inscripciones:', errorInscritos.message);
            } else {
                const inscritos = inscripciones.map((i) => i.evento);
                setEventosInscritos(inscritos || []);
            }

            setCargando(false);
        };

        if (verificado) {
            cargarDatos();
        }
    }, [id, verificado]);

    const irADetalle = (idEvento) => {
        navigate(`/evento/${idEvento}`);
    };

    if (!verificado) return <p className="text-center mt-5">Verificando acceso...</p>;
    if (cargando) return <p className="text-center mt-5">Cargando perfil...</p>;
    if (!usuario) return <p className="text-center mt-5">Usuario no encontrado</p>;
    const calcularEdad = (fechaNacimiento) => {
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mesDiferencia = hoy.getMonth() - nacimiento.getMonth();
        if (mesDiferencia < 0 || (mesDiferencia === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        return edad;
    };

    return (
        <>
            <Navbar/>
            <div className="container mt-4">
                <h2 className="mb-4">Perfil del Usuario</h2>
                <ul className="list-group mb-4">
                    <li className="list-group-item"><strong>ID:</strong> {usuario.id}</li>
                    <li className="list-group-item"><strong>Nombre:</strong> {usuario.nombre}</li>
                    <li className="list-group-item"><strong>Correo:</strong> {usuario.correo}</li>
                    <li className="list-group-item">
                        <strong>Fecha de nacimiento:</strong> {usuario.fecha_nacimiento.split('-').reverse().join('/')}

                    </li>
                    <li className="list-group-item">
                        <strong>Edad:</strong> {calcularEdad(usuario.fecha_nacimiento)} años
                    </li>
                    <li className="list-group-item"><strong>Rol:</strong> {usuario.tipousuario?.nombre || 'Desconocido'}
                    </li>
                </ul>

                {/* Eventos Creados */}
                <div className="mb-4">
                    <h4>Eventos Creados ({eventosCreados.length})</h4>
                    {eventosCreados.length === 0 ? (
                        <p className="text-muted">No tiene eventos creados.</p>
                    ) : (
                        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                            {eventosCreados.map((evt) => (
                                <div key={evt.id} className="col">
                                    <div className="card h-100 shadow">
                                        {evt.imagen_url && (
                                            <img
                                                src={evt.imagen_url}
                                                className="card-img-top"
                                                alt="Imagen del evento"
                                                style={{height: '180px', objectFit: 'cover'}}
                                            />
                                        )}
                                        <div className="card-body">
                                            <h5 className="card-title">{evt.nombre}</h5>
                                            <p className="card-text">Del {evt.fechainicio} al {evt.fechafin}</p>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => irADetalle(evt.id)}
                                            >
                                                Ver Evento
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Eventos Inscritos */}
                <div className="mb-4">
                    <h4>Eventos Inscritos ({eventosInscritos.length})</h4>
                    {eventosInscritos.length === 0 ? (
                        <p className="text-muted">No está inscrito en ningún evento.</p>
                    ) : (
                        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                            {eventosInscritos.map((evt) => (
                                <div key={evt.id} className="col">
                                    <div className="card h-100 shadow">
                                        {evt.imagen_url && (
                                            <img
                                                src={evt.imagen_url}
                                                className="card-img-top"
                                                alt="Imagen del evento"
                                                style={{height: '180px', objectFit: 'cover'}}
                                            />
                                        )}
                                        <div className="card-body">
                                            <h5 className="card-title">{evt.nombre}</h5>
                                            <p className="card-text">Del {evt.fechainicio} al {evt.fechafin}</p>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => irADetalle(evt.id)}
                                            >
                                                Ver Evento
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PerfilUsuario;
