import React, {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import supabase from '../utils/supabaseClient.js'
import {toast} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import HorarioCard from '../components/HorarioCard.jsx'

const DetalleEvento = () => {
    const {id} = useParams()
    const [evento, setEvento] = useState(null)
    const [horarios, setHorarios] = useState([])
    const [ampliada, setAmpliada] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchEvento()
    }, [id])

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

        if (error) {
            console.error("❌ Error al obtener horarios:", error.message, error.details, error.hint)
            return;
        }

        console.log("📅 Datos de horarios obtenidos:", data)
        setHorarios(data)
    }

    if (!evento) return <p className="text-center mt-5">Cargando evento...</p>

    return (
        <>
            <Navbar/>

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
                                <button className="btn btn-primary px-4">Inscribirse</button>
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
        </>
    )
}

export default DetalleEvento
