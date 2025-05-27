import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {ToastContainer} from 'react-toastify';


const DetalleEventoCreador = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [evento, setEvento] = useState(null);
    const [usuarioId, setUsuarioId] = useState(null);
    const [inscritos, setInscritos] = useState([]);
    const [asistencias, setAsistencias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [estados, setEstados] = useState([]);
    const [editando, setEditando] = useState(false);
    const [form, setForm] = useState({nombre: '', descripcion: '', fechainicio: '', fechafin: '', nuevaImagen: null});

    useEffect(() => {
        const fetchData = async () => {
            const {data: authUser} = await supabase.auth.getUser();
            const correo = authUser?.user?.email;
            if (!correo) return navigate('/');

            const {data: usuario} = await supabase
                .from('usuario')
                .select('id')
                .eq('correo', correo)
                .maybeSingle();

            if (!usuario) return navigate('/');
            setUsuarioId(usuario.id);

            const [{data: eventoData, error: eventoError}, {data: estadosData}] = await Promise.all([
                supabase.from('evento').select('*').eq('id', id).maybeSingle(),
                supabase.from('estado').select('*')
            ]);

            if (eventoError || !eventoData || eventoData.id_usuario_creador !== usuario.id) {
                toast.error('No tienes permiso para ver este evento');
                return navigate('/');
            }

            setEvento(eventoData);
            setEstados(estadosData || []);
            setForm({
                nombre: eventoData.nombre,
                descripcion: eventoData.descripcion,
                fechainicio: eventoData.fechainicio,
                fechafin: eventoData.fechafin,
                nuevaImagen: null
            });
            setLoading(false);
        };

        fetchData();
    }, [id, navigate]);

    useEffect(() => {
        if (!evento) return;

        const obtenerDatos = async () => {
            const {data, error} = await supabase
                .from('inscripcionevento')
                .select('id_usuario')
                .eq('id_evento', evento.id);

            if (error) {
                toast.error('Error al cargar inscritos');
                return;
            }

            const idsUsuarios = data.map(row => row.id_usuario);
            if (idsUsuarios.length === 0) {
                setInscritos([]);
                return;
            }

            const [{data: usuarios}, {data: asistencias}] = await Promise.all([
                supabase.from('usuario').select('id, nombre, correo').in('id', idsUsuarios),
                supabase.from('asistencia').select('id_usuario').eq('id_evento', evento.id)
            ])


            setInscritos(usuarios);
            setAsistencias((asistencias || []).map(a => a.id_usuario));

        };

        obtenerDatos();
    }, [evento]);

    const eliminarEvento = async () => {
        const confirmar = window.confirm('¿Estás seguro de eliminar este evento?');
        if (!confirmar) return;

        const {error} = await supabase.from('evento').delete().eq('id', evento.id);
        if (error) toast.error('Error al eliminar el evento');
        else {
            toast.success('Evento eliminado correctamente');
            navigate('/mis-eventos');
        }
    };

    const guardarCambios = async () => {
        let nuevaURL = evento.imagen_url;

        if (form.nuevaImagen) {
            const fileExt = form.nuevaImagen.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = fileName;

            const {error: uploadError} = await supabase.storage
                .from('event-images')
                .upload(filePath, form.nuevaImagen, {
                    contentType: form.nuevaImagen.type
                });

            if (uploadError) {
                toast.error("No se pudo subir la nueva imagen");
                return;
            }

            const {data: publicUrlData} = supabase.storage.from('event-images').getPublicUrl(filePath);
            nuevaURL = publicUrlData?.publicUrl;
        }

        const {error} = await supabase
            .from('evento')
            .update({
                nombre: form.nombre,
                descripcion: form.descripcion,
                fechainicio: form.fechainicio,
                fechafin: form.fechafin,
                imagen_url: nuevaURL
            })
            .eq('id', evento.id);

        if (error) {
            toast.error('Error al guardar cambios');
        } else {
            toast.success('Cambios guardados');
            setEvento({...evento, ...form, imagen_url: nuevaURL});
            setEditando(false);
        }
    };

    const cambiarEstado = async (nuevoEstado) => {
        const {error} = await supabase
            .from('evento')
            .update({id_estado: nuevoEstado})
            .eq('id', evento.id);

        if (error) toast.error('Error al cambiar estado');
        else {
            toast.success('Estado actualizado');
            setEvento(prev => ({...prev, id_estado: nuevoEstado}));
        }
    };

    if (loading || !evento) return <p className="text-center mt-5">Cargando...</p>;

    return (
        <>
            <Navbar/>
            <div className="container mt-4">
                {editando ? (
                    <>
                        <input className="form-control mb-2" value={form.nombre}
                               onChange={(e) => setForm(f => ({...f, nombre: e.target.value}))}/>
                        <textarea className="form-control mb-2" value={form.descripcion}
                                  onChange={(e) => setForm(f => ({...f, descripcion: e.target.value}))}/>
                        <div className="row mb-2">
                            <div className="col">
                                <input type="date" className="form-control" value={form.fechainicio}
                                       onChange={(e) => setForm(f => ({...f, fechainicio: e.target.value}))}/>
                            </div>
                            <div className="col">
                                <input type="date" className="form-control" value={form.fechafin}
                                       onChange={(e) => setForm(f => ({...f, fechafin: e.target.value}))}/>
                            </div>
                        </div>
                        <input type="file" accept="image/*" className="form-control mb-3"
                               onChange={(e) => setForm(f => ({...f, nuevaImagen: e.target.files[0]}))}/>
                        <button className="btn btn-success me-2" onClick={guardarCambios}>💾 Guardar</button>
                        <button className="btn btn-secondary" onClick={() => setEditando(false)}>Cancelar</button>
                    </>
                ) : (
                    <>
                        <h2 className="mb-3">{evento.nombre}</h2>
                        <p className="text-muted">{evento.fechainicio} - {evento.fechafin}</p>
                        <img
                            src={evento.imagen_url || '/noDisponible.jpg'}
                            alt="Imagen del evento"
                            className="img-fluid mb-3"
                            style={{maxHeight: '300px', objectFit: 'cover'}}
                        />
                        <p>{evento.descripcion}</p>
                        <div className="mb-3">
                            <label className="form-label">Estado del Evento</label>
                            <select
                                className="form-select"
                                value={evento.id_estado}
                                onChange={(e) => cambiarEstado(parseInt(e.target.value))}
                            >
                                {estados.map((estado) => (
                                    <option key={estado.id} value={estado.id}>{estado.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="d-flex gap-2 my-3">
                            <button className="btn btn-outline-warning" onClick={() => setEditando(true)}>
                                ✏️ Editar Evento
                            </button>
                            <button className="btn btn-outline-danger" onClick={eliminarEvento}>
                                🗑 Eliminar Evento
                            </button>
                        </div>
                    </>
                )}

                <hr/>

                <h4 className="mb-3">👥 Participantes Inscritos</h4>
                {inscritos.length === 0 ? (
                    <p className="text-secondary">No hay inscritos todavía.</p>
                ) : (
                    <div className="table-responsive shadow rounded">
                        <table className="table table-striped table-light align-middle">
                            <thead className="table-primary text-center">
                            <tr>
                                <th scope="col">Registro</th>
                                <th scope="col">Nombre</th>
                                <th scope="col">Correo</th>
                                <th scope="col">Asistencia</th>
                            </tr>
                            </thead>
                            <tbody className="text-center">
                            {inscritos.map((usuario) => (
                                <tr key={usuario.id}>
                                    <td>{usuario.id}</td>
                                    <td>{usuario.nombre}</td>
                                    <td>{usuario.correo}</td>
                                    <td>

                                        {asistencias.includes(usuario.id) ? (
                                            <span className="badge bg-success">Asistió</span>
                                        ) : (
                                            <span className="badge bg-danger">Falta</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar/>
        </>
    );
};

export default DetalleEventoCreador;