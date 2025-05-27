import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import AuthBackground from '../components/AuthBackground.jsx';
import EventWrapper from '../components/EventWrapper.jsx';
import supabase from '../utils/supabaseClient.js';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {UserAuth} from '../context/AuthContext';

const CrearEvento = () => {
    const {user, tipoUsuario} = UserAuth();
    const esAdmin = tipoUsuario === 6 || tipoUsuario === 7;
    const navigate = useNavigate();

    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [ubicacion, setUbicacion] = useState('');
    const [tipoEvento, setTipoEvento] = useState('');
    const [imagen, setImagen] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorBloques, setErrorBloques] = useState('');
    const [horarios, setHorarios] = useState([]);
    const [horarioInicio, setHorarioInicio] = useState('');
    const [horarioFin, setHorarioFin] = useState('');
    const [modalidad, setModalidad] = useState('');
    const [dia, setDia] = useState('');
    const [bloquesHorarios, setBloquesHorarios] = useState([]);

    useEffect(() => {
        const fetchHorarios = async () => {
            const {data, error} = await supabase.from('horario').select('*');
            if (!error) setHorarios(data);
        };
        fetchHorarios();
    }, []);

    const agregarBloqueHorario = () => {
        if (horarioInicio && horarioFin && modalidad && dia) {
            const inicio = parseInt(horarioInicio);
            const fin = parseInt(horarioFin);

            if (fin < inicio) {
                toast.error('La hora de fin debe ser mayor que la hora de inicio.');
                return;
            }

            setBloquesHorarios(prev => [
                ...prev,
                {
                    id_horario_inicio: inicio,
                    id_horario_fin: fin,
                    id_modalidad: parseInt(modalidad),
                    id_dia: parseInt(dia)
                }
            ]);
            setHorarioInicio('');
            setHorarioFin('');
            setModalidad('');
            setDia('');
            setErrorBloques('');
        } else {
            toast.warn('Completa todos los campos del bloque horario.');
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (bloquesHorarios.length === 0) {
            setErrorBloques('Debes agregar al menos un horario.');
            return;
        }

        setErrorBloques('');

        if (new Date(fechaFin) < new Date(fechaInicio)) {
            toast.error('La fecha de fin no puede ser anterior a la fecha de inicio.');
            return;
        }

        if (!user?.email) {
            toast.error('No hay usuario autenticado.');
            return;
        }

        setLoading(true); // ✅ SOLO después de pasar todas las validaciones

        try {
            const {data: usuarioData} = await supabase
                .from('usuario')
                .select('id')
                .eq('correo', user.email)
                .maybeSingle();

            const id_usuario = usuarioData?.id;
            if (!id_usuario) {
                toast.error('No se pudo obtener el ID del usuario.');
                return;
            }

            let imagenUrl = null;

            if (imagen) {
                const fileExt = imagen.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = fileName;

                const {error: uploadError} = await supabase.storage
                    .from('event-images')
                    .upload(filePath, imagen);

                if (uploadError) {
                    toast.error('Error subiendo la imagen.');
                    return;
                }

                const {data: publicUrlData} = supabase.storage
                    .from('event-images')
                    .getPublicUrl(filePath);

                imagenUrl = publicUrlData?.publicUrl || null;
            }

            const {data: insertedEvento, error: insertError} = await supabase
                .from('evento')
                .insert([{
                    nombre,
                    descripcion,
                    fechainicio: fechaInicio,
                    fechafin: fechaFin,
                    id_ubicacion: parseInt(ubicacion),
                    id_tevento: parseInt(tipoEvento),
                    id_estado: 1,
                    id_usuario_creador: id_usuario,
                    imagen_url: imagenUrl
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            if (bloquesHorarios.length > 0) {
                const inserts = bloquesHorarios.map(b => ({
                    ...b,
                    id_evento: insertedEvento.id
                }));
                console.log('Bloques a insertar:', inserts);

                await supabase.from('horarioevento').insert(inserts);
            }

            toast.dismiss(); // por si había uno pendiente
            navigate('/', {state: {eventoCreado: true}});
        } catch (err) {
            toast.error('Error creando evento');
            console.error(err);
        } finally {
            setLoading(false); // ✅ SIEMPRE se ejecuta
        }
    };


    return (
        <>
            <Navbar/>
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

                        <div className="row mb-4 g-3 align-items-end">
                            <div className="col-md-2 col-6">
                                <label className="form-label">Horario Inicio:</label>
                                <select
                                    className="form-select"
                                    value={horarioInicio}
                                    onChange={e => setHorarioInicio(e.target.value)}
                                    required={bloquesHorarios.length === 0}
                                >
                                    <option value="">S</option>
                                    {horarios.map(h => (
                                        <option key={h.id} value={h.id}>{h.hora.slice(0, 5)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-2 col-6">
                                <label className="form-label">Horario Fin:</label>
                                <select
                                    className="form-select"
                                    value={horarioFin}
                                    onChange={e => setHorarioFin(e.target.value)}
                                    required={bloquesHorarios.length === 0}
                                >
                                    <option value="">S</option>
                                    {horarios.map(h => (
                                        <option key={h.id} value={h.id}>{h.hora.slice(0, 5)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-2 col-6">
                                <label className="form-label">Modalidad:</label>
                                <select
                                    className="form-select"
                                    value={modalidad}
                                    onChange={e => setModalidad(e.target.value)}
                                    required={bloquesHorarios.length === 0}
                                >
                                    <option value="">S</option>
                                    <option value="1">Presencial</option>
                                    <option value="2">Virtual</option>
                                    <option value="3">SemiPresencial</option>
                                </select>
                            </div>
                            <div className="col-md-2 col-6">
                                <label className="form-label">Día:</label>
                                <select
                                    className="form-select"
                                    value={dia}
                                    onChange={e => setDia(e.target.value)}
                                    required={bloquesHorarios.length === 0}
                                >
                                    <option value="">S</option>
                                    <option value="1">Lunes</option>
                                    <option value="2">Martes</option>
                                    <option value="3">Miércoles</option>
                                    <option value="4">Jueves</option>
                                    <option value="5">Viernes</option>
                                    <option value="6">Sábado</option>
                                    <option value="7">Domingo</option>
                                </select>
                            </div>
                            <div className="col-12 col-md-4 mt-2 mt-md-0">
                                <button type="button" className="btn btn-dark w-100" onClick={agregarBloqueHorario}>
                                    + Agregar Horario
                                </button>

                            </div>
                        </div>

                        <ul>
                            {bloquesHorarios.map((b, i) => {
                                const diaNombre = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][b.id_dia];
                                const inicioHora = (horarios.find(h => h.id === b.id_horario_inicio)?.hora || '').slice(0, 5) || b.id_horario_inicio;
                                const finHora = (horarios.find(h => h.id === b.id_horario_fin)?.hora || '').slice(0, 5) || b.id_horario_fin;
                                const modalidadTexto = {
                                    1: "Presencial",
                                    2: "Virtual",
                                    3: "Híbrida"
                                }[b.id_modalidad] || b.id_modalidad;

                                return (
                                    <li key={i}>
                                        {diaNombre} - de {inicioHora} a {finHora} ({modalidadTexto})
                                    </li>
                                );
                            })}
                        </ul>
                        {errorBloques && (
                            <div style={{color: 'red', marginTop: '8px'}}>
                                {errorBloques}
                            </div>
                        )}

                        <div className="mb-3">
                            <label className="form-label">Imagen del Evento:</label>
                            <input
                                type="file"
                                accept="image/*"
                                className="form-control"
                                onChange={e => setImagen(e.target.files[0])}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Descripción:</label>
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
                                    {esAdmin ? (
                                        <>
                                            <option value="1">Conferencia</option>
                                            <option value="2">Feria Expositiva</option>
                                            <option value="3">Taller</option>
                                            <option value="4">Hackathon</option>
                                            <option value="5">Cursos</option>
                                            <option value="6">Evento Informal</option>
                                        </>
                                    ) : (
                                        <option value="6">Evento Informal</option>
                                    )}
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

                            {tipoUsuario !== 6 && tipoUsuario !== 7 && (
                                <div className="alert alert-info mt-4" role="alert">
                                    <strong>Nota:</strong> Los estudiantes solo pueden crear eventos de
                                    tipo <em> Evento Informal</em>. Los eventos que creen deberán ser aprobados por un
                                    administrador antes de publicarse.
                                </div>
                            )}

                        </div>


                    </form>
                </EventWrapper>
            </AuthBackground>
        </>
    );
};

export default CrearEvento;
