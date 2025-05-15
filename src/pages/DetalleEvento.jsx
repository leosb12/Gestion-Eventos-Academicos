import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import supabase from '../utils/supabaseClient.js'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import HorarioCard from '../components/HorarioCard.jsx'

const DetalleEvento = () => {
  const { id } = useParams()
  const [evento, setEvento] = useState(null)
  const [horarios, setHorarios] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchEvento()
  }, [id])

  const fetchEvento = async () => {
    const { data, error } = await supabase
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
    fetchHorarios(data.id)
  }

  const fetchHorarios = async (eventoId) => {
    const { data, error } = await supabase
      .from('horarioevento')
      .select(`
        id,
        horario_inicio: id_horario_inicio (hora),
        horario_fin: id_horario_fin (hora),
        modalidad: id_modalidad (nombre),
        dia: id_dia (nombre)
      `)
      .eq('id_evento', eventoId)

    if (error) {
      toast.error('Error al cargar los horarios.')
      return
    }

    const formateado = data.map(h => ({
      dia: h.dia.nombre,
      horaInicio: h.horario_inicio.hora,
      horaFin: h.horario_fin.hora,
      modalidad: h.modalidad.nombre
    }))

    setHorarios(formateado)
  }

  if (!evento) return <p className="text-center mt-5">Cargando evento...</p>

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="mb-4">
          <img
            src={evento.imagen_url || '/noDisponible.jpg'}
            className="img-fluid rounded"
            alt={evento.nombre}
            style={{ width: '100%', height: '300px', objectFit: 'cover' }}
          />
        </div>

        <div className="row">
          <div className="col-md-7">
            <h2 className="fw-bold">{evento.nombre}</h2>
            <p className="mt-3">{evento.descripcion}</p>
          </div>

          <div className="col-md-5 d-flex align-items-start justify-content-center">
            <section className="border rounded p-4 w-100 bg-white shadow-sm">
              <p className="text-center fw-semibold mb-2">Empieza en:</p>
              <p className="text-center fs-5 mb-4">
                {new Date(evento.fechainicio).toLocaleDateString()}
              </p>
              <div className="d-flex justify-content-center">
                <button className="btn btn-primary px-4">Inscribirse</button>
              </div>
            </section>
          </div>
        </div>

        <section className="d-flex justify-content-center align-items-start mt-3 p-3">
  <div className="bg-white p-5 p-md-5 rounded-5 shadow" style={{ maxWidth: '55rem', width: '100%' }}>
    <h3 className="text-center fw-bold mb-4">Horarios del Evento</h3>

    {horarios.length === 0 ? (
      <p className="text-center text-muted">No hay horarios disponibles.</p>
    ) : (
      <div className="row g-4">
        {horarios.map((h, index) => (
          <HorarioCard
            key={index}
            dia={h.dia}
            horaInicio={h.horaInicio}
            horaFin={h.horaFin}
            modalidad={h.modalidad}
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
