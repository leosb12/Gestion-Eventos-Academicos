import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserAuth } from '../context/AuthContext';

export default function GestionarNotificaciones() {
  const { user, tipoUsuario } = UserAuth();
  const navigate = useNavigate();

  // Solo admin (tipoUsuario === 7)
  useEffect(() => {
    if (!user || tipoUsuario == null) return; // esperar login y carga
    const tipo = Number(tipoUsuario);
    if (tipo !== 7) {
      toast.error('Acceso denegado: solo administradores pueden ver esta página');
      navigate('/');
    }
  }, [user, tipoUsuario, navigate]);

  const [usuarios, setUsuarios] = useState([]);
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar lista de usuarios (solo si admin)
  useEffect(() => {
    const tipo = Number(tipoUsuario);
    if (tipo !== 7) return;
    supabase
      .from('usuario')
      .select('id, nombre, correo')
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          toast.error('Error al cargar usuarios');
        } else {
          setUsuarios(data);
        }
      });
  }, [tipoUsuario]);

  const toggleAll = () => {
    if (allChecked) {
      setSeleccionados(new Set());
      setAllChecked(false);
    } else {
      setSeleccionados(new Set(usuarios.map(u => u.id)));
      setAllChecked(true);
    }
  };

  const toggleOne = id => {
    const s = new Set(seleccionados);
    s.has(id) ? s.delete(id) : s.add(id);
    setSeleccionados(s);
    if (s.size !== usuarios.length) setAllChecked(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const tipo = Number(tipoUsuario);
    if (tipo !== 7) return;
    if (!asunto.trim()) return toast.error('Escribe el asunto');
    if (!mensaje.trim()) return toast.error('Escribe un mensaje');
    if (seleccionados.size === 0) return toast.error('Selecciona al menos un destinatario');

    setLoading(true);
    try {
      const destinatarios = usuarios
        .filter(u => seleccionados.has(u.id))
        .map(u => u.correo);

      // Envío a la Edge Function con clave
      await fetch(
        'https://sgpnyeashmuwwlpvxbgm.supabase.co/functions/v1/enviar-correo',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`
          },
          body: JSON.stringify({ to: destinatarios, subject: asunto, html: `<p>${mensaje}</p>`, text: mensaje })
        }
      );

      const ahora = new Date().toISOString();
      const inserts = Array.from(seleccionados).map(uid => ({
        usuario_id: uid,
        notificacion_id: null,
        texto: mensaje,
        fecha_envio: ahora,
        leido: false
      }));

      const { error: dbError } = await supabase
        .from('notificaciones_usuarios')
        .insert(inserts);
      if (dbError) {
        console.error(dbError);
        toast.warn('Correo enviado, pero no se registró en la base.');
      } else {
        toast.success('Notificación enviada y registrada.');
      }

      setAsunto('');
      setMensaje('');
      setSeleccionados(new Set());
      setAllChecked(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al enviar notificación');
    } finally {
      setLoading(false);
    }
  };

  if (!user || Number(tipoUsuario) !== 7) {
    return null;
  }

  return (
    <>
      <Navbar />

      <div className="container mt-5">
        <h1 className="mb-4">Gestionar Notificaciones</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label">Asunto</label>
            <input
              type="text"
              className="form-control"
              placeholder="Escribe el asunto..."
              value={asunto}
              onChange={e => setAsunto(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Mensaje</label>
            <textarea
              className="form-control"
              rows="4"
              placeholder="Escribe tu mensaje..."
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="mb-2 d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Destinatarios</h5>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={toggleAll}
              disabled={loading}
            >
              {allChecked ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          </div>

          <div
            className="border rounded mb-4"
            style={{ maxHeight: '300px', overflowY: 'auto' }}
          >
            <table className="table mb-0">
              <thead style={{ backgroundColor: '#e3f2fd' }}>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th style={{ width: '80px' }}>Seleccionar</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => (
                  <tr key={u.id}>
                    <td>{i + 1}</td>
                    <td>{u.nombre}</td>
                    <td>{u.correo}</td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={seleccionados.has(u.id)}
                        onChange={() => toggleOne(u.id)}
                        disabled={loading}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="submit"
            className="btn btn-lg btn-primary"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar Notificación'}
          </button>
        </form>
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </>
  );
}
