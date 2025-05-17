import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import AuthBackground from '../components/AuthBackground.jsx'
import EventWrapper from '../components/EventWrapper.jsx'
import supabase from '../utils/supabaseClient.js'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { UserAuth } from '../context/AuthContext'

const CrearEvento = () => {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [tipoEvento, setTipoEvento] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user } = UserAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // ✅ Verificamos si hay usuario logueado
      if (!user || !user.email) {
        toast.error('Error: No hay usuario autenticado.')
        setLoading(false)
        return
      }

      // ✅ Buscamos el id de tu tabla "usuario"
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuario')
        .select('id')
        .eq('correo', user.email)
        .maybeSingle()

      if (usuarioError || !usuarioData) {
        toast.error('Error: No se encontró el usuario en la base de datos.')
        setLoading(false)
        return
      }

      const id_usuario = usuarioData.id

      // ✅ Insertamos el evento
      const { error } = await supabase.from('evento').insert([{
        nombre,
        descripcion,
        fechainicio: fechaInicio,
        fechafin: fechaFin,
        id_ubicacion: parseInt(ubicacion, 10),
        id_tevento: parseInt(tipoEvento, 10),
        id_estado: 1,
        id_usuario_creador: id_usuario
      }])

      if (error) throw error

      toast.success('Evento creado con éxito')
      navigate('/')
    } catch (err) {
      toast.error('Error creando evento: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <AuthBackground>
        <EventWrapper title="CREAR EVENTO">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Nombre del Evento:</label>
              <input
                type="text"
                className="form-control"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Descripción del Evento:</label>
              <textarea
                className="form-control"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                required
              />
            </div>

            <div className="row mb-3">
              <div className="col">
                <label className="form-label">Fecha Inicio:</label>
                <input
                  type="date"
                  className="form-control"
                  value={fechaInicio}
                  onChange={e => setFechaInicio(e.target.value)}
                  required
                />
              </div>
              <div className="col">
                <label className="form-label">Fecha Fin:</label>
                <input
                  type="date"
                  className="form-control"
                  value={fechaFin}
                  onChange={e => setFechaFin(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="row mb-4">
              <div className="col">
                <label className="form-label">Ubicación:</label>
                <select
                  className="form-select"
                  value={ubicacion}
                  onChange={e => setUbicacion(e.target.value)}
                  required
                >
                  <option value="">Selecciona...</option>
                  <option value="1">Campus Universitario</option>
                  <option value="2">Auditorio</option>
                  <option value="3">Parqueo</option>
                  <option value="4">Biblioteca</option>
                </select>
              </div>
              <div className="col">
                <label className="form-label">Tipo de Evento:</label>
                <select
                  className="form-select"
                  value={tipoEvento}
                  onChange={e => setTipoEvento(e.target.value)}
                  required
                >
                  <option value="">Selecciona...</option>
                  <option value="1">Conferencia</option>
                  <option value="2">Feria Expositiva</option>
                  <option value="3">Taller</option>
                  <option value="4">Hackathon</option>
                  <option value="5">Cursos</option>
                </select>
              </div>
            </div>

            <div className="text-center">
              <button
                type="submit"
                className="btn btn-primary px-5"
                disabled={loading}
              >
                {loading ? 'Creando…' : 'Crear Evento'}
              </button>
            </div>
          </form>
        </EventWrapper>
      </AuthBackground>
    </>
  )
}

export default CrearEvento
