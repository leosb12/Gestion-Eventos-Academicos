import React, { useEffect, useState } from 'react';
import { UserAuth } from '../context/AuthContext';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import AuthBackground from '../components/AuthBackground';
import EventWrapper from '../components/EventWrapper';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MisEventos = () => {
  const { user } = UserAuth();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    fechainicio: '',
    fechafin: '',
    imagen_url: '',
    nuevaImagen: null
  });

  useEffect(() => {
    const obtenerMisEventos = async () => {
      if (!user || !user.email) return;

      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuario')
        .select('id')
        .eq('correo', user.email)
        .maybeSingle();

      if (usuarioError || !usuarioData) {
        console.error("No se pudo obtener el ID del usuario:", usuarioError);
        setLoading(false);
        return;
      }

      const idUsuario = usuarioData.id;

      const { data: eventosData, error: eventosError } = await supabase
        .from('evento')
        .select('*')
        .eq('id_usuario_creador', idUsuario)
        .order('fechainicio', { ascending: true });

      if (eventosError) {
        console.error("Error al obtener eventos:", eventosError);
      } else {
        setEventos(eventosData || []);
      }

      setLoading(false);
    };

    obtenerMisEventos();
  }, [user]);

  const comenzarEdicion = (evento) => {
    setEditandoId(evento.id);
    setForm({
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      fechainicio: evento.fechainicio,
      fechafin: evento.fechafin,
      imagen_url: evento.imagen_url,
      nuevaImagen: null
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setForm({ nombre: '', descripcion: '', fechainicio: '', fechafin: '', imagen_url: '', nuevaImagen: null });
  };

  const guardarCambios = async (id) => {
    let nuevaURL = form.imagen_url;

    if (form.nuevaImagen) {
      const fileExt = form.nuevaImagen.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, form.nuevaImagen, {
          contentType: form.nuevaImagen.type
        });

      if (uploadError) {
        toast.error("No se pudo subir la nueva imagen");
        console.error(uploadError);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      nuevaURL = publicUrlData?.publicUrl;
    }

    const { error } = await supabase
      .from('evento')
      .update({
        nombre: form.nombre,
        descripcion: form.descripcion,
        fechainicio: form.fechainicio,
        fechafin: form.fechafin,
        imagen_url: nuevaURL
      })
      .eq('id', id);

    if (error) {
      toast.error("Error al guardar cambios: " + error.message);
    } else {
      setEventos((prev) =>
        prev.map((ev) =>
          ev.id === id ? { ...ev, ...form, imagen_url: nuevaURL } : ev
        )
      );
      toast.success("Evento actualizado correctamente");
      cancelarEdicion();
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

  return (
    <>
      <Navbar />
      <AuthBackground>
        <EventWrapper title="MIS EVENTOS">
          {loading ? (
            <p>Cargando tus eventos...</p>
          ) : eventos.length === 0 ? (
            <p>No has creado ningún evento.</p>
          ) : (
            <ul className="list-group">
              {eventos.map((evento) => (
                <li key={evento.id} className="list-group-item mb-2">
                  {editandoId === evento.id ? (
                    <>
                      <input
                        className="form-control mb-1"
                        value={form.nombre}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, nombre: e.target.value }))
                        }
                      />
                      <textarea
                        className="form-control mb-1"
                        value={form.descripcion}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, descripcion: e.target.value }))
                        }
                      />
                      <div className="row mb-2">
                        <div className="col">
                          <input
                            type="date"
                            className="form-control"
                            value={form.fechainicio}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, fechainicio: e.target.value }))
                            }
                          />
                        </div>
                        <div className="col">
                          <input
                            type="date"
                            className="form-control"
                            value={form.fechafin}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, fechafin: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      {/* Imagen actual */}
                      {form.imagen_url && (
                        <div className="mb-2 text-center">
                          <img
                            src={form.imagen_url}
                            alt="imagen actual"
                            className="img-fluid rounded"
                            style={{ maxHeight: '150px' }}
                          />
                        </div>
                      )}
                      {/* Input para nueva imagen */}
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control mb-2"
                        onChange={(e) =>
                          setForm((f) => ({ ...f, nuevaImagen: e.target.files[0] }))
                        }
                      />

                      <button
                        className="btn btn-success btn-sm me-2"
                        onClick={() => guardarCambios(evento.id)}
                      >
                        💾 Guardar
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={cancelarEdicion}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <div className="d-flex justify-content-between align-items-center flex-column flex-md-row">
                      <div className="text-center text-md-start w-100">
                        <h5 className="mb-1">{evento.nombre}</h5>
                        <p className="mb-1 d-none d-md-block">{evento.descripcion}</p>
                        <p className="mb-0 text-muted d-none d-md-block">
                          {evento.fechainicio} – {evento.fechafin}
                        </p>
                      </div>
                      <div className="mt-2 mt-md-0 d-grid gap-2 d-md-flex justify-content-md-end">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => comenzarEdicion(evento)}
                        >
                          🖉 Editar
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => eliminarEvento(evento.id)}
                        >
                          🗑 Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </EventWrapper>
      </AuthBackground>
    </>
  );
};

export default MisEventos;
