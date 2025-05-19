import React, {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import supabase from '../utils/supabaseClient.js'
import {toast, ToastContainer} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import HorarioCard from '../components/HorarioCard.jsx'
import {UserAuth} from '../context/AuthContext.jsx'

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
    }, [evento, usuarioId])

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

    const verificarInscripcion = async () => {
        const {data, error} = await supabase
            .from('inscripcionevento')
            .select('id_evento')
            .eq('id_evento', id)
            .eq('id_usuario', usuarioId)

        if (!error) {
            setEstaInscrito(data.length > 0)
        }
    }

    const manejarInscripcion = async () => {
        if (!evento || !usuarioId) return

        const tipoEvento = parseInt(evento?.id_tevento ?? 0)
        const estadoEvento = parseInt(evento?.id_estado ?? 0)

        if (estadoEvento !== 1) {
            toast.warning('Este evento no está disponible para inscripción.')
            return
        }

        if ((tipoEvento === 4 || tipoEvento === 2) && !estaInscrito) {
            toast.info('Redirigiendo a la inscripción por equipo...')
            navigate(`/inscribir-equipo/${id}`)
            return
        }

        if (!estaInscrito) {
            const {error} = await supabase
                .from('inscripcionevento')
                .insert({id_evento: parseInt(id), id_usuario: usuarioId})

            if (!error) {
                toast.success('Inscripción completada.')
                setEstaInscrito(true)
            } else {
                toast.error('Error al inscribirse al evento.')
            }
        } else {
            setMostrarModalCancelar(true)
        }
    }

    const confirmarCancelacion = async () => {
        try {
            const tipoEvento = parseInt(evento?.id_tevento ?? 0);

            const {data: equipo, error: equipoError} = await supabase
                .from('equipo')
                .select('id, id_lider')
                .eq('id_lider', usuarioId)
                .maybeSingle();

            if ((tipoEvento === 4 || tipoEvento === 2) && equipo && equipo.id_lider === usuarioId) {
                // Si es Hackathon o Feria y el usuario es el líder
                const {data: miembros} = await supabase
                    .from('miembrosequipo')
                    .select('id_usuario')
                    .eq('id_equipo', equipo.id);

                const idsMiembros = miembros.map(m => m.id_usuario);

                await supabase.from('inscripcionevento').delete().in('id_usuario', idsMiembros).eq('id_evento', id);
                await supabase.from('miembrosequipo').delete().eq('id_equipo', equipo.id);
                await supabase.from('nivelgrupo').delete().eq('id_equipo', equipo.id);
                await supabase.from('equipo').delete().eq('id', equipo.id);

                toast.success('Se canceló la inscripción del equipo completo.');
            } else if (tipoEvento === 4 || tipoEvento === 2) {
                // Si es Hackathon o Feria pero no es el líder
                await supabase.from('inscripcionevento').delete().match({id_evento: id, id_usuario: usuarioId});
                await supabase.from('miembrosequipo').delete().match({id_usuario: usuarioId});

                toast.success('Te has salido del equipo correctamente.');
            } else {
                // Si no es Hackathon ni Feria
                await supabase.from('inscripcionevento').delete().match({id_evento: id, id_usuario: usuarioId});

                toast.success('Cancelación completada correctamente.');
            }

            setEstaInscrito(false);
        } catch (err) {
            toast.error('Error al cancelar la inscripción.');
        } finally {
            setMostrarModalCancelar(false);
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
                        <h2 className="fw-bold">{evento.nombre}</h2>
                        <p className="mt-3">{evento.descripcion}</p>
                    </div>

                    <div className="col-md-5 d-flex align-items-start justify-content-center">
                        <section className="border rounded p-4 w-100 bg-white shadow-sm">
                            <div className="row row-cols-1 row-cols-sm-1 row-cols-md-2">
                                <div className="col">
                                    <p className="text-center fw-semibold mb-2">Empieza el:</p>
                                    <p className="text-center fs-5 mb-4">
                                        {new Date(evento.fechainicio).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="col">
                                    <p className="text-center fw-semibold mb-2">Termina el:</p>
                                    <p className="text-center fs-5 mb-4">
                                        {new Date(evento.fechafin).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="d-flex justify-content-center">
                                <button
                                    className={`btn ${estaInscrito ? 'btn-secondary' : 'btn-primary'} px-4`}
                                    onClick={manejarInscripcion}
                                >
                                    {estaInscrito ? 'Cancelar inscripción' : 'Inscribirse'}
                                </button>
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
            </div>
            <ToastContainer position="top-right" autoClose={3000}/>
        </>
    )
}

export default DetalleEvento
