import React, {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import supabase from '../utils/supabaseClient.js'
import {toast, ToastContainer} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import HorarioCard from '../components/HorarioCard.jsx'
import {UserAuth} from '../context/AuthContext.jsx'
import MarcarAsistencia from '../components/MarcarAsistencia.jsx';


const DetalleEvento = () => {
    const {id} = useParams()
    const {user} = UserAuth()
    const navigate = useNavigate()

    const [evento, setEvento] = useState(null)
    const [horarios, setHorarios] = useState([])
    const [ampliada, setAmpliada] = useState(false)
    const [usuarioId, setUsuarioId] = useState(null)
    const [estaInscrito, setEstaInscrito] = useState(false)
    const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false)
    const [equiposIncompletos, setEquiposIncompletos] = useState([]);
    const [inscripcionCargando, setInscripcionCargando] = useState(true);
    const [refresco, setRefresco] = useState(0);

    useEffect(() => {
        fetchEvento()
    }, [id])

    useEffect(() => {
        if (user?.email) {
            obtenerUsuarioId()
        }
    }, [user])

    useEffect(() => {
        if (evento && usuarioId) {
            verificarInscripcion()
        }
    }, [evento, usuarioId, refresco])

    useEffect(() => {
        if (evento && evento.id_tevento && !estaInscrito) {
            const tipo = parseInt(evento.id_tevento)
            if (tipo === 2 || tipo === 4) {
                fetchEquiposIncompletos(evento.id)
            }
        }
    }, [evento, estaInscrito])

    useEffect(() => {
        if (!usuarioId || !evento) return;

        const canal = supabase
            .channel('inscripcion_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'inscripcionevento',
                    filter: `id_usuario=eq.${usuarioId}`
                },
                (payload) => {
                    if (payload.new?.id_evento === parseInt(id) || payload.old?.id_evento === parseInt(id)) {
                        setRefresco(prev => prev + 1);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(canal);
        };
    }, [usuarioId, evento]);

    const obtenerUsuarioId = async () => {
        const {data, error} = await supabase
            .from('usuario')
            .select('id')
            .eq('correo', user.email)
            .maybeSingle()

        if (error || !data) {
            toast.error('No se pudo identificar al usuario.')
            return
        }

        setUsuarioId(data.id)
    }

    const fetchEvento = async () => {
        const {data, error} = await supabase
            .from('evento')
            .select('*')
            .eq('id', id)
            .maybeSingle()

        if (error || !data) {
            toast.error('No se pudo cargar el evento.')
            navigate('/')
            return
        }

        setEvento(data)
        fetchHorariosEvento(data.id)
    }

    const fetchHorariosEvento = async (eventoId) => {
        const {data, error} = await supabase
            .from('horarioevento')
            .select(`
        id_evento ( id ),
        id_dia ( dia ),
        id_horario_inicio ( hora ),
        id_horario_fin ( hora ),
        id_modalidad ( nombre )
      `)
            .eq('id_evento', eventoId)

        if (!error) setHorarios(data)
    }

    const fetchEquiposIncompletos = async (eventoId) => {
        const {data: equipos, error} = await supabase
            .from('equipo')
            .select(`
            id,
            nombre,
            id_lider,
            usuario:usuario!id_lider (
                nombre
            ),
            nivelgrupo (
                id_nivel,
                nivel:nivel!id (
                    nombre
                )
            ),
            miembrosequipo (
                id_usuario
            )
        `)
            .eq('id_evento', eventoId)

        if (error) {
            toast.error('Error al cargar equipos.')
            return
        }

        const incompletos = (equipos || [])
            .map(eq => ({
                id: eq.id,
                nombre: eq.nombre,
                nivel: eq.nivelgrupo?.[0]?.nivel?.nombre || '-',
                cantidad: eq.miembrosequipo?.length || 0,
                lider: eq.usuario?.nombre || '-'
            }))
            .filter(eq => eq.cantidad < 6);

        setEquiposIncompletos(incompletos)
    }

    const verificarInscripcion = async () => {
        const {data, error} = await supabase
            .from('inscripcionevento')
            .select('id_evento')
            .eq('id_evento', id)
            .eq('id_usuario', usuarioId)

        if (!error) {
            setEstaInscrito(data.length > 0)
        }
        setInscripcionCargando(false);
    }

    const manejarInscripcion = async () => {
        if (!evento || !usuarioId) return;

        try {
            // Verificación adicional segura
            const {data: check, error: errorCheck} = await supabase
                .from('inscripcionevento')
                .select('id_evento')
                .eq('id_evento', id)
                .eq('id_usuario', usuarioId);

            if (errorCheck) {
                console.error(errorCheck);
                toast.error('No se pudo verificar la inscripción actual.');
                return;
            }

            const yaInscrito = Array.isArray(check) && check.length > 0;
            setEstaInscrito(yaInscrito);

            const tipoEvento = parseInt(evento?.id_tevento ?? 0);
            const estadoEvento = parseInt(evento?.id_estado ?? 0);

            if (estadoEvento !== 1) {
                toast.warning('El evento esta en curso');
                return;
            }

            if ((tipoEvento === 4 || tipoEvento === 2) && !yaInscrito) {
                toast.info('Redirigiendo a la inscripción por equipo...');
                navigate(`/inscribir-equipo/${id}`);
                return;
            }

            if (!yaInscrito) {
                const {error} = await supabase
                    .from('inscripcionevento')
                    .insert({id_evento: parseInt(id), id_usuario: usuarioId});

                if (!error) {
                    toast.success('Inscripción completada.');
                    setEstaInscrito(true);
                } else {
                    toast.error('Error al inscribirse al evento.');
                }
            } else {
                setMostrarModalCancelar(true);
            }
        } catch (err) {
            console.error('Error inesperado en manejo inscripción:', err);
            toast.error('Error inesperado al procesar la inscripción.');
        }
    };


    const confirmarCancelacion = async () => {
        try {
            const tipoEvento = parseInt(evento?.id_tevento ?? 0);

            const {data: equipo, error: equipoError} = await supabase
                .from('equipo')
                .select('id, id_lider')
                .eq('id_lider', usuarioId)
                .eq('id_evento', id)
                .maybeSingle();

            if ((tipoEvento === 4 || tipoEvento === 2) && equipo && equipo.id_lider === usuarioId) {
                // Si es Hackathon o Feria y el usuario es el líder
                const {data: miembros} = await supabase
                    .from('miembrosequipo')
                    .select('id_usuario')
                    .eq('id_equipo', equipo.id);

                const idsMiembros = miembros.map(m => m.id_usuario);

                // Eliminar proyecto si existe
                await supabase.from('proyecto').delete().eq('id_equipo', equipo.id);
                await supabase.from('asistencia').delete().in('id_usuario', idsMiembros).eq('id_evento', id);


// Eliminar inscripciones y relaciones
                await supabase.from('inscripcionevento').delete().in('id_usuario', idsMiembros).eq('id_evento', id);
                await supabase.from('miembrosequipo').delete().eq('id_equipo', equipo.id);
                await supabase.from('nivelgrupo').delete().eq('id_equipo', equipo.id);
                await supabase.from('equipo').delete().eq('id', equipo.id);

                toast.success('Se canceló la inscripción del equipo completo.');
                await fetchEquiposIncompletos(evento.id);
            } else if (tipoEvento === 4 || tipoEvento === 2) {
                // Si es Hackathon o Feria pero no es el líder
                await supabase.from('inscripcionevento').delete().match({id_evento: id, id_usuario: usuarioId});
                await supabase.from('asistencia').delete().match({id_evento: id, id_usuario: usuarioId});

                await supabase.from('miembrosequipo').delete().match({id_usuario: usuarioId});

                toast.success('Te has salido del equipo correctamente.');
            } else {
                // Si no es Hackathon ni Feria
                await supabase.from('inscripcionevento').delete().match({id_evento: id, id_usuario: usuarioId});
                await supabase.from('asistencia').delete().match({id_evento: id, id_usuario: usuarioId});


                toast.success('Cancelación completada correctamente.');
            }

            setEstaInscrito(false);
        } catch (err) {
            toast.error('Error al cancelar la inscripción.');
        } finally {
            setMostrarModalCancelar(false);
        }
    };

    const unirseAEquipo = async (equipoId) => {
        try {
            // Validar que no esté ya inscrito
            const {data: yaInscrito, error: errorInscrito} = await supabase
                .from('inscripcionevento')
                .select('id_usuario')
                .eq('id_evento', id)
                .eq('id_usuario', usuarioId);

            if (errorInscrito) throw errorInscrito;
            if (yaInscrito.length > 0) {
                toast.info('Ya estás inscrito en este evento.');
                return;
            }

            // Verificar que el equipo aún exista
            const {data: equipoExistente, error: equipoError} = await supabase
                .from('equipo')
                .select('id')
                .eq('id', equipoId)
                .maybeSingle();

            if (equipoError) throw equipoError;
            if (!equipoExistente) {
                toast.error('El equipo ya no existe.');
                fetchEquiposIncompletos(evento.id); // Refresca lista visual
                return;
            }

            // Verificar cantidad de miembros actual
            const {data: miembrosActuales, error: errorMiembros} = await supabase
                .from('miembrosequipo')
                .select('id_usuario')
                .eq('id_equipo', equipoId);

            if (errorMiembros) throw errorMiembros;
            if ((miembrosActuales?.length ?? 0) >= 6) {
                toast.error('El equipo ya está completo.');
                fetchEquiposIncompletos(evento.id);
                return;
            }

            // Insertar en ambas tablas (inscripcionevento y miembrosequipo)
            const {error: inscError} = await supabase
                .from('inscripcionevento')
                .insert({id_evento: parseInt(id), id_usuario: usuarioId});

            if (inscError) throw inscError;

            const {error: miembroError} = await supabase
                .from('miembrosequipo')
                .insert({id_equipo: equipoId, id_usuario: usuarioId});

            if (miembroError) throw miembroError;

            toast.success('Te uniste al equipo exitosamente.');
            setEstaInscrito(true);
            fetchEquiposIncompletos(evento.id);
        } catch (error) {
            console.error(error);
            toast.error('Hubo un error al intentar unirte al equipo.');
        }
    };

    if (!evento) return <p className="text-center mt-5">Cargando evento...</p>


    return (
        <>
            <Navbar/>

            {mostrarModalCancelar && (
                <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirmar cancelación</h5>
                                <button type="button" className="btn-close"
                                        onClick={() => setMostrarModalCancelar(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>¿Estás seguro de cancelar tu inscripción al evento?</p>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary"
                                        onClick={() => setMostrarModalCancelar(false)}>No
                                </button>
                                <button className="btn btn-danger" onClick={confirmarCancelacion}>Sí, cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {ampliada && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center"
                    style={{zIndex: 1050}}
                    onClick={() => setAmpliada(false)}
                >
                    <img
                        src={evento.imagen_url}
                        alt="ampliada"
                        className="img-fluid rounded shadow-lg"
                        style={{maxHeight: '90vh', maxWidth: '90vw'}}
                    />
                </div>
            )}

            <div className="container mt-5">
                <div className="text-center mb-4">
                    <img
                        src={evento.imagen_url || '/noDisponible.jpg'}
                        alt={evento.nombre}
                        className="img-fluid rounded-4 shadow"
                        style={{maxWidth: '100%', height: 'auto', cursor: 'zoom-in'}}
                        onClick={() => setAmpliada(true)}
                    />
                </div>

                <div className="row">
                    <div className="col-md-7">
                        {evento.id_estado === 1 && (
                            <span className="badge bg-success fs-6 mb-2">Inscripción Abierta</span>
                        )}
                        {evento.id_estado === 2 && (
                            <span className="badge bg-secondary fs-6 mb-2">Inscripción Cerrada</span>
                        )}
                        {evento.id_estado === 3 && (
                            <span className="badge bg-warning text-dark fs-6 mb-2">Próximamente</span>
                        )}
                        {evento.id_estado === 4 && (
                            <span className="badge bg-primary fs-6 mb-2">En Curso</span>
                        )}
                        {evento.id_estado === 5 && (
                            <span className="badge bg-dark fs-6 mb-2">Finalizado</span>
                        )}
                        {evento.id_estado === 6 && (
                            <span className="badge bg-danger fs-6 mb-2">Cancelado</span>
                        )}

                        <h2 className="fw-bold">{evento.nombre}</h2>
                        <p className="mt-3">{evento.descripcion}</p>

                        {/* ✅ Bloque de asistencia si el usuario está inscrito */}
                        {estaInscrito && (
                            <div className="bg-white p-4 mt-4 mb-3 rounded-4 shadow-sm border d-inline-block">
                                <h5 className="fw-bold mb-3">Registro de Asistencia</h5>
                                <MarcarAsistencia evento={evento} usuarioId={usuarioId}/>
                            </div>
                        )}
                    </div>

                    <div className="col-md-5 d-flex align-items-start justify-content-center">
                        <section className="border rounded p-4 w-100 bg-white shadow-sm">
                            <div className="row row-cols-1 row-cols-sm-1 row-cols-md-2">
                                <div className="col">
                                    <p className="text-center fw-semibold mb-2">Empieza el:</p>
                                    <p className="text-center fs-5 mb-4">
                                        <p className="text-center fs-5 mb-4">
                                            {evento.fechainicio?.split('-').reverse().join('/')}
                                        </p>


                                    </p>
                                </div>
                                <div className="col">
                                    <p className="text-center fw-semibold mb-2">Termina el:</p>
                                    <p className="text-center fs-5 mb-4">
                                        <p className="text-center fs-5 mb-4">
                                            {evento.fechafin?.split('-').reverse().join('/')}
                                        </p>


                                    </p>
                                </div>
                            </div>
                            <div className="d-flex justify-content-center">
                                {!inscripcionCargando && (
                                    <button
                                        className={`btn ${estaInscrito ? 'btn-secondary' : 'btn-primary'} px-4`}
                                        onClick={manejarInscripcion}
                                    >
                                        {estaInscrito ? 'Cancelar inscripción' : 'Inscribirse'}
                                    </button>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                <section className="d-flex justify-content-center align-items-start mt-3 p-3">
                    <div className="bg-white p-5 p-md-5 rounded-5 shadow" style={{maxWidth: '55rem', width: '100%'}}>
                        <h3 className="text-center fw-bold mb-4">Horarios del Evento</h3>
                        {horarios.length === 0 ? (
                            <p className="text-center text-muted">No hay horarios disponibles.</p>
                        ) : (
                            <div className="row g-4">
                                {horarios.map((h, index) => (
                                    <HorarioCard
                                        key={index}
                                        dia={h.id_dia?.dia || '-'}
                                        horaInicio={h.id_horario_inicio?.hora?.slice(0, 5) || '-'}
                                        horaFin={h.id_horario_fin?.hora?.slice(0, 5) || '-'}
                                        modalidad={h.id_modalidad?.nombre || '-'}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
                {!inscripcionCargando && (evento.id_tevento === 2 || evento.id_tevento === 4) && !estaInscrito && (
                    <section className="d-flex justify-content-center align-items-start mt-3 p-3">
                        <div className="bg-white p-5 p-md-5 rounded-5 shadow"
                             style={{maxWidth: '55rem', width: '100%'}}>
                            <h3 className="text-center fw-bold mb-4">Equipos con cupos disponibles</h3>
                            {equiposIncompletos.length === 0 ? (
                                <p className="text-center text-muted">No hay equipos con cupos disponibles.</p>
                            ) : (
                                <div className="row g-3">
                                    {equiposIncompletos.map((equipo, i) => (
                                        <div key={i} className="col-12 border rounded p-3 shadow-sm bg-light">
                                            <div
                                                className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center text-start text-md-start">
                                                <div className="flex-grow-1 mb-2 mb-md-0">
                                                    <p className="mb-1 text-nowrap d-flex">
                                                        <span className="fw-bold me-1">Equipo:</span>
                                                        <span>{equipo.nombre}</span>
                                                    </p>
                                                    <p className="mb-1 text-nowrap d-flex">
                                                        <span className="fw-bold me-1">Nivel:</span>
                                                        <span>{equipo.nivel}</span>
                                                    </p>
                                                    <p className="mb-1 text-nowrap d-flex">
                                                        <span className="fw-bold me-1">Miembros:</span>
                                                        <span>{equipo.cantidad} / 6</span>
                                                    </p>
                                                    <p className="mb-1 text-nowrap d-flex">
                                                        <span className="fw-bold me-1">Líder:</span>
                                                        <span>{equipo.lider}</span>
                                                    </p>
                                                </div>
                                                <div
                                                    className="w-100 w-md-auto d-flex align-items-md-center justify-content-center justify-content-md-end mt-3 mt-md-0">
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{width: '200px'}}
                                                        onClick={() => unirseAEquipo(equipo.id)}
                                                    >
                                                        Unirse al Equipo
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

            </div>
            <ToastContainer position="top-right" autoClose={3000}/>
        </>
    )
}

export default DetalleEvento
