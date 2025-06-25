// Reemplazado y actualizado
import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import AuthBackground from '../components/AuthBackground.jsx';
import EventWrapper from '../components/EventWrapper.jsx';
import supabase from '../utils/supabaseClient.js';
import {toast, ToastContainer} from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import {UserAuth} from '../context/AuthContext';
import ImageCropper from '../components/ImageCropper.jsx';

function convertToSquareWithBlackBackground(base64Image) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const size = Math.max(img.width, img.height);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, size, size);
            const dx = (size - img.width) / 2;
            const dy = (size - img.height) / 2;
            ctx.drawImage(img, dx, dy);
            resolve(canvas.toDataURL('image/jpeg'));
        };
        img.src = base64Image;
    });
}

const CrearEvento = () => {
    const {user, tipoUsuario} = UserAuth();
    const esAdmin = tipoUsuario === 6 || tipoUsuario === 7;
    const navigate = useNavigate();

    const [nombre, setNombre] = useState('');
    const [caracteristicas, setCaracteristicas] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [ubicacion, setUbicacion] = useState('');
    const [ubicaciones, setUbicaciones] = useState([]);
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
    const [claveAsistencia, setClaveAsistencia] = useState('');
    const [showCropper, setShowCropper] = useState(false);
    const [rawImage, setRawImage] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const {data: horariosData} = await supabase.from('horario').select('*');
            if (horariosData) setHorarios(horariosData);

            const {data: ubicacionesData} = await supabase.from('ubicacion').select('*');
            if (ubicacionesData) setUbicaciones(ubicacionesData);
        };
        fetchData();
    }, []);

    const agregarBloqueHorario = () => {
        if (horarioInicio && horarioFin && modalidad && dia) {
            const inicio = parseInt(horarioInicio);
            const fin = parseInt(horarioFin);
            if (fin < inicio) {
                toast.error('La hora de fin debe ser mayor que la hora de inicio.');
                return;
            }
            setBloquesHorarios(prev => [...prev, {
                id_horario_inicio: inicio,
                id_horario_fin: fin,
                id_modalidad: parseInt(modalidad),
                id_dia: parseInt(dia)
            }]);
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

        if (new Date(fechaFin) < new Date(fechaInicio)) {
            toast.error('La fecha de fin no puede ser anterior a la fecha de inicio.');
            return;
        }

        if (!user?.email) {
            toast.error('No hay usuario autenticado.');
            return;
        }

        setLoading(true);

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
                const fileName = `${Date.now()}.jpg`;
                const {error: uploadError} = await supabase.storage
                    .from('event-images')
                    .upload(fileName, imagen);
                if (uploadError) {
                    toast.error('Error subiendo la imagen.');
                    return;
                }
                const {data: publicUrlData} = supabase.storage.from('event-images').getPublicUrl(fileName);
                imagenUrl = publicUrlData?.publicUrl || null;
            }

            const {data: insertedEvento, error: insertError} = await supabase
                .from('evento')
                .insert([{
                    nombre,
                    descripcion: caracteristicas,
                    fechainicio: fechaInicio,
                    fechafin: fechaFin,
                    id_ubicacion: parseInt(ubicacion),
                    id_tevento: parseInt(tipoEvento),
                    id_estado: 1,
                    id_usuario_creador: id_usuario,
                    imagen_url: imagenUrl,
                    clave_asistencia: tipoEvento === '4' ? claveAsistencia.trim() : null
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            if (bloquesHorarios.length > 0) {
                const inserts = bloquesHorarios.map(b => ({
                    ...b,
                    id_evento: insertedEvento.id
                }));
                await supabase.from('horarioevento').insert(inserts);
            }

            toast.dismiss();
            navigate(`/detalle-evento-creador/${insertedEvento.id}`);
        } catch (err) {
            toast.error('Error creando evento');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar/>
            <AuthBackground>
                <EventWrapper title="CREAR EVENTO">
                    <form onSubmit={handleSubmit}>
                        {/* ...otros inputs... */}
                        <div className="mb-3">
                            <label className="form-label">Características:</label>
                            <textarea
                                className="form-control"
                                value={caracteristicas}
                                onChange={e => setCaracteristicas(e.target.value)}
                                required
                            />
                        </div>
                        {/* ...el resto del formulario queda igual... */}
                    </form>
                    {showCropper && rawImage && (
                        <ImageCropper
                            image={rawImage}
                            onClose={() => setShowCropper(false)}
                            onCrop={(croppedFile) => setImagen(croppedFile)}
                        />
                    )}
                </EventWrapper>
            </AuthBackground>
            <ToastContainer position="top-right" autoClose={3000}/>
        </>
    );
};

export default CrearEvento;
