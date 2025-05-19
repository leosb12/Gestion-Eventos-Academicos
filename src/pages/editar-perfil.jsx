import React, { useEffect, useState } from 'react'
import supabase from '../utils/supabaseClient'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const EditarPerfil = () => {
  const [usuario, setUsuario] = useState(null)
  const [nombre, setNombre] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [passwordActual, setPasswordActual] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPerfil = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return navigate('/iniciar-sesion')

      const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('correo', user.email)
        .single()

      if (data) {
        setUsuario(data)
        setNombre(data.nombre)
        setFechaNacimiento(data.fecha_nacimiento)
      } else {
        console.error('Error al obtener perfil', error)
      }
    }

    fetchPerfil()
  }, [])

  const handleGuardar = async (e) => {
    e.preventDefault()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !usuario) return alert('No autorizado.')

    const { error: updateError } = await supabase
      .from('usuario')
      .update({
        nombre,
        fecha_nacimiento: fechaNacimiento,
      })
      .eq('correo', usuario.correo)

    if (updateError) {
      alert('Error al actualizar perfil.')
      return
    }

    if (passwordActual && nuevaPassword) {
      const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: usuario.correo,
        password: passwordActual,
      })

      if (loginError) return alert('Contraseña actual incorrecta.')

      const { error: passError } = await supabase.auth.updateUser({
        password: nuevaPassword,
      })

      if (passError) return alert('Error al cambiar contraseña: ' + passError.message)
    }

    alert('Perfil actualizado correctamente.')
  }

  if (!usuario) return <p className="text-center mt-5">Cargando perfil...</p>

  return (
    <>
      <Navbar />
      <div className="auth-background d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="bg-white p-5 rounded-4 shadow" style={{ width: '100%', maxWidth: '500px' }}>
          <h2 className="mb-4 text-center">Editar Perfil</h2>
          <form onSubmit={handleGuardar}>
            <div className="mb-3">
              <label className="form-label">Nombre completo</label>
              <input
                type="text"
                className="form-control"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Fecha de nacimiento</label>
              <input
                type="date"
                className="form-control"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
              />
            </div>
            <hr />
            <div className="mb-3">
              <label className="form-label">Contraseña actual</label>
              <input
                type="password"
                className="form-control"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Nueva contraseña</label>
              <input
                type="password"
                className="form-control"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">Guardar cambios</button>
          </form>
        </div>
      </div>
    </>
  )
}

export default EditarPerfil

