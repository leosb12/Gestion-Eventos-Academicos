import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import {UserAuth} from '../context/AuthContext';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../components/Navbar';
import {ToastContainer} from 'react-toastify';


const GestionarEventos = () => {
    const {user, tipoUsuario} = UserAuth();
    const navigate = useNavigate();
    const [eventos, setEventos] = useState([]);
    const [editandoId, setEditandoId] = useState(null);
    const [mensajeExito, setMensajeExito] = useState('');
    const [form, setForm] = useState({
        nombre: '',
        descripcion: '',
        fechainicio: '',
        fechafin: ''
    });
    const [eventosEnCarrusel, setEventosEnCarrusel] = useState([]);


    const cargarEventosEnCarrusel = async () => {
        const {data, error} = await supabase.from('carousel').select('evento_id');
        if (!error && data) {
            setEventosEnCarrusel(data.map(e => e.evento_id));
        }
    };

    useEffect(() => {
        if (mensajeExito) {
            // Scroll automático al principio
            window.scrollTo({top: 0, behavior: 'smooth'});

            // Ocultar el mensaje después de 2 segundos
            const timeout = setTimeout(() => {
                setMensajeExito('');
            }, 2000);

            // Limpiar el timeout si cambia antes de los 2s
            return () => clearTimeout(timeout);
        }
    }, [mensajeExito]);

    const cargarEventos = async () => {
        const {data, error} = await supabase
            .from('evento')
            .select('*')
            .order('fechainicio', {ascending: true});

        if (error) {
            toast.error('Error al cargar eventos');
        } else {
            setEventos(data || []);
        }
    };

    const añadirACarrusel = async (eventoId) => {
        const {error} = await supabase.from('carousel').insert({evento_id: eventoId});
        if (error) {
            toast.error('Error al añadir al carrusel');
        } else {
            setMensajeExito('📷 Imagen añadida a la página principal con éxito');
            setEventosEnCarrusel(prev => [...prev, eventoId]);
        }
    };
    const eliminarDelCarrusel = async (eventoId) => {
        const {error} = await supabase.from('carousel').delete().eq('evento_id', eventoId);
        if (error) {
            toast.error('Error al eliminar del carrusel');
        } else {
            setMensajeExito('❌ Imagen eliminada del carrusel');
            setEventosEnCarrusel(prev => prev.filter(id => id !== eventoId));
        }
    };


    const eliminarEvento = async (id) => {
        const confirmado = window.confirm("¿Estás seguro de que deseas eliminar este evento?");
        if (!confirmado) return;

        // Obtener imagen_url
        const {data: eventoData, error: fetchError} = await supabase
            .from('evento')
            .select('imagen_url')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) {
            toast.error("Error al obtener el evento: " + fetchError.message);
            return;
        }

        // Eliminar imagen del Storage si existe
        if (eventoData?.imagen_url) {
            const url = eventoData.imagen_url;
            const nombreArchivo = url.split('/event-images/')[1];

            if (nombreArchivo) {

                const {error: storageError} = await supabase
                    .storage
                    .from("event-images")
                    .remove([nombreArchivo])

                if (storageError) {
                    console.error("No se pudo eliminar la imagen:", storageError.message);
                } else {
                    console.log("✅ Imagen eliminada correctamente del storage.");
                }
            }
        }

        // Eliminar del carrusel
        await supabase.from('carousel').delete().eq('evento_id', id);

        // Eliminar el evento
        const {error} = await supabase.from('evento').delete().eq('id', id);
        if (error) {
            toast.error("Error al eliminar el evento: " + error.message);
        } else {
            setEventos(prev => prev.filter(ev => ev.id !== id));
            setEventosEnCarrusel(prev => prev.filter(eid => eid !== id));
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
        setForm({nombre: '', descripcion: '', fechainicio: '', fechafin: ''});
    };

    const guardarCambios = async () => {
        const {error} = await supabase
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
    useEffect(() => {
        if (tipoUsuario === null) return; // todavía cargando

        if (tipoUsuario !== 7) {
            toast.error('No tienes permisos para acceder');
            navigate('/');
            return;
        }

        cargarEventos();
        cargarEventosEnCarrusel();
    }, [tipoUsuario]);


    return (
        <>
            <Navbar/>
            <section className="container my-4">
                <h2 className="mb-4">Gestión de Eventos</h2>

                {mensajeExito && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        {mensajeExito}
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setMensajeExito('')}
                        ></button>
                    </div>
                )}

                {eventos.map((evento) => (
                    <div key={evento.id} className="card mb-3">
                        <div className="card-body">
                            {editandoId === evento.id ? (
                                <>
                                    <input
                                        type="text"
                                        className="form-control mb-2"
                                        value={form.nombre}
                                        onChange={(e) => setForm({...form, nombre: e.target.value})}
                                        placeholder="Nombre"
                                    />
                                    <textarea
                                        className="form-control mb-2"
                                        value={form.descripcion}
                                        onChange={(e) => setForm({...form, descripcion: e.target.value})}
                                        placeholder="Descripción"
                                    />
                                    <div className="row mb-2">
                                        <div className="col">
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={form.fechainicio}
                                                onChange={(e) => setForm({...form, fechainicio: e.target.value})}
                                            />
                                        </div>
                                        <div className="col">
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={form.fechafin}
                                                onChange={(e) => setForm({...form, fechafin: e.target.value})}
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
                                    <p className="card-text">
                                        <strong>Inicio:</strong> {evento.fechainicio?.split('T')[0]}
                                    </p>
                                    <p className="card-text">
                                        <strong>Fin:</strong> {evento.fechafin?.split('T')[0]}
                                    </p>

                                    <div className="d-flex flex-wrap gap-2 mt-3">
                                        <button className="btn btn-primary" onClick={() => iniciarEdicion(evento)}>
                                            ✏️ Editar
                                        </button>
                                        <button className="btn btn-danger" onClick={() => eliminarEvento(evento.id)}>
                                            🗑️ Eliminar
                                        </button>
                                        {eventosEnCarrusel.includes(evento.id) ? (
                                            <button
                                                className="btn"
                                                style={{
                                                    backgroundColor: '#f2f2f2',
                                                    color: 'black',
                                                    border: '1px solid #ccc'
                                                }}
                                                onClick={() => eliminarDelCarrusel(evento.id)}
                                            >
                                                ❌ Eliminar del Carrusel
                                            </button>
                                        ) : (
                                            <button
                                                className="btn"
                                                style={{
                                                    backgroundColor: '#f2f2f2',
                                                    color: 'black',
                                                    border: '1px solid #ccc'
                                                }}
                                                onClick={() => añadirACarrusel(evento.id)}
                                            >
                                                📷 Añadir al Carrusel
                                            </button>
                                        )}

                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </section>
            <ToastContainer position="top-right" autoClose={3000}/>
        </>
    );
};

export default GestionarEventos;
