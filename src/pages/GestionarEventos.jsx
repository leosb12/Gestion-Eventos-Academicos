import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import { UserAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../components/Navbar';

const GestionarEventos = () => {
  const { user, tipoUsuario } = UserAuth();
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    fechainicio: '',
    fechafin: ''
  });

  useEffect(() => {
    if (tipoUsuario !== 7) {
      toast.error('No tienes permisos para acceder');
      navigate('/');
      return;
    }
    cargarEventos();
  }, [tipoUsuario]);

  const cargarEventos = async () => {
    const { data, error } = await supabase
      .from('evento')
      .select('*')
      .order('fechainicio', { ascending: true });

    if (error) {
      toast.error('Error al cargar eventos');
    } else {
      setEventos(data || []);
    }
  };

  const eliminarEvento = async (id) => {
    const confirmado = window.confirm("¿Estás seguro de que deseas eliminar este evento?");
    if (!confirmado) return;

    const { error } = await supabase.from('evento').delete().eq('id', id);
    if (error) {
      toast.error("Error al eliminar: " + error.message);
    } else {
      setEventos(prev => prev.filter(ev => ev.id !== id));
      toast.success("Evento eliminado con éxito");
    }
  };

  const iniciarEdicion = (evento) => {
    setEditandoId(evento.id);
    setForm({
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      fechainicio: evento.fechainicio?.split('T')[0],
      fechafin: evento.fechafin?.split('T')[0]
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setForm({ nombre: '', descripcion: '', fechainicio: '', fechafin: '' });
  };

  const guardarCambios = async () => {
    const { error } = await supabase
      .from('evento')
      .update({
        nombre: form.nombre,
        descripcion: form.descripcion,
        fechainicio: form.fechainicio,
        fechafin: form.fechafin
      })
      .eq('id', editandoId);

    if (error) {
      toast.error('Error al guardar cambios');
    } else {
      toast.success('Evento actualizado');
      cancelarEdicion();
      cargarEventos();
    }
  };

  return (
    <>
      <Navbar />
      <section className="container my-4">
        <h2 className="mb-4">Gestión de Eventos</h2>
        {eventos.map((evento) => (
          <div key={evento.id} className="card mb-3">
            <div className="card-body">
              {editandoId === evento.id ? (
                <>
                  <input
                    type="text"
                    className="form-control mb-2"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Nombre"
                  />
                  <textarea
                    className="form-control mb-2"
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Descripción"
                  />
                  <div className="row mb-2">
                    <div className="col">
                      <input
                        type="date"
                        className="form-control"
                        value={form.fechainicio}
                        onChange={(e) => setForm({ ...form, fechainicio: e.target.value })}
                      />
                    </div>
                    <div className="col">
                      <input
                        type="date"
                        className="form-control"
                        value={form.fechafin}
                        onChange={(e) => setForm({ ...form, fechafin: e.target.value })}
                      />
                    </div>
                  </div>
                  <button className="btn btn-success me-2" onClick={guardarCambios}>Guardar</button>
                  <button className="btn btn-secondary" onClick={cancelarEdicion}>Cancelar</button>
                </>
              ) : (
                <>
                  <h5 className="card-title">{evento.nombre}</h5>
                  <p className="card-text">{evento.descripcion}</p>
                  <p className="card-text"><strong>Inicio:</strong> {evento.fechainicio?.split('T')[0]}</p>
                  <p className="card-text"><strong>Fin:</strong> {evento.fechafin?.split('T')[0]}</p>

                  <button className="btn btn-primary me-2" onClick={() => iniciarEdicion(evento)}>
                    ✏️ Editar
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => eliminarEvento(evento.id)}
                  >
                    🗑️ Eliminar
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </section>
    </>
  );
};

export default GestionarEventos;
