import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthBackground from '../components/AuthBackground';
import EventWrapper from '../components/EventWrapper';
import supabase from '../utils/supabaseClient';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {UserAuth} from '../context/AuthContext';

const DefinirProyecto = () => {
    const navigate = useNavigate();
    const {id: idEvento} = useParams();
    const {state} = useLocation();
    const {nombreEquipo, nivelSeleccionado, miembros} = state || {};

    const [usuarioId, setUsuarioId] = useState(null);
    const [materias, setMaterias] = useState([]);
    const [nombreProyecto, setNombreProyecto] = useState('');
    const [descripcionProyecto, setDescripcionProyecto] = useState('');
    const [materiaSeleccionada, setMateriaSeleccionada] = useState('');
    const [loading, setLoading] = useState(false);
    const [proyectoFinalizado, setProyectoFinalizado] = useState(false);
    const [archivoInforme, setArchivoInforme] = useState(null);

    const {user} = UserAuth();

    useEffect(() => {
        const obtenerUsuario = async () => {
            const {data, error} = await supabase
                .from('usuario')
                .select('id')
                .eq('correo', user.email)
                .maybeSingle();

            if (error || !data) {
                toast.error('No se pudo identificar al usuario.');
                return;
            }

            setUsuarioId(data.id);
        };

        if (user?.email) {
            obtenerUsuario();
        }
    }, [user]);

    useEffect(() => {
        const cargarMaterias = async () => {
            const {data, error} = await supabase.from('materia').select('*');
            if (!error) setMaterias(data);
        };

        cargarMaterias();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nombreProyecto || !descripcionProyecto || !materiaSeleccionada) {
            toast.error('Completa todos los campos.');
            return;
        }

        setLoading(true);
        let informeURL = null;

        // Primero: subir informe PDF si se marcó
        if (proyectoFinalizado) {
            if (!archivoInforme || archivoInforme.type !== 'application/pdf') {
                toast.error('Debes subir un archivo PDF válido.');
                setLoading(false);
                return;
            }

            if (archivoInforme.size === 0) {
                toast.error('El archivo PDF está vacío.');
                setLoading(false);
                return;
            }

            const nombreLimpio = archivoInforme.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
            const nombreArchivo = `informe_${Date.now()}_${nombreLimpio}`;

            const {data: storageData, error: storageError} = await supabase.storage
                .from('informes')
                .upload(nombreArchivo, archivoInforme);

            if (storageError) {
                toast.error('Error al subir el informe: ' + storageError.message);
                setLoading(false);
                return;
            }

            const {data: urlData} = supabase
                .storage
                .from('informes')
                .getPublicUrl(nombreArchivo);

            informeURL = urlData.publicUrl;
        }

        try {
            // Insertar equipo
            const {data: equipoData, error: eqInsertError} = await supabase
                .from('equipo')
                .insert({nombre: nombreEquipo, id_lider: usuarioId, id_evento: parseInt(idEvento)})
                .select()
                .single();

            if (eqInsertError) throw eqInsertError;
            const idEquipo = equipoData.id;

            // Insertar miembros
            const miembrosNumeros = miembros.map(id => parseInt(id));
            const miembrosData = miembrosNumeros.map(id_usuario => ({id_equipo: idEquipo, id_usuario}));

            const {error: miembrosError} = await supabase.from('miembrosequipo').insert(miembrosData);
            if (miembrosError) throw miembrosError;

            // Insertar nivel
            const {error: nivelError} = await supabase
                .from('nivelgrupo')
                .insert({id_nivel: parseInt(nivelSeleccionado), id_equipo: idEquipo});
            if (nivelError) throw nivelError;

            // Insertar inscripciones
            const {data: yaInscritos, error: yaInsError} = await supabase
                .from('inscripcionevento')
                .select('id_usuario')
                .eq('id_evento', parseInt(idEvento));

            if (yaInsError) throw yaInsError;

            const yaInsIds = yaInscritos.map(i => i.id_usuario);
            const nuevasInscripciones = miembrosNumeros
                .filter(id_usuario => !yaInsIds.includes(id_usuario))
                .map(id_usuario => ({id_evento: parseInt(idEvento), id_usuario}));

            if (nuevasInscripciones.length > 0) {
                const {error: inscError} = await supabase.from('inscripcionevento').insert(nuevasInscripciones);
                if (inscError) throw inscError;
            }

            // Insertar proyecto
            const {error: proyectoError} = await supabase.from('proyecto').insert({
                nombre: nombreProyecto,
                descripcion: descripcionProyecto,
                id_equipo: idEquipo,
                id_materia: parseInt(materiaSeleccionada),
                id_estado: 4,
                url_informe: informeURL
            });

            if (proyectoError) throw proyectoError;

            toast.success('Proyecto definido e inscrito correctamente.');
            setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            toast.error('Error al guardar el proyecto.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar/>
            <AuthBackground>
                <EventWrapper title="DEFINIR PROYECTO">
                    <div className="mb-3">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => navigate(`/inscribir-equipo/${idEvento}`, {
                                state: {nombreEquipo, nivelSeleccionado, miembros}
                            })}
                        >
                            ← Volver al equipo
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Nombre del Proyecto:</label>
                            <input
                                type="text"
                                className="form-control"
                                value={nombreProyecto}
                                onChange={e => setNombreProyecto(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Descripción:</label>
                            <textarea
                                className="form-control"
                                value={descripcionProyecto}
                                onChange={e => setDescripcionProyecto(e.target.value)}
                                rows={4}
                                required
                            ></textarea>
                        </div>

                        <div className="mb-4">
                            <label className="form-label">Materia:</label>
                            <select
                                className="form-select"
                                value={materiaSeleccionada}
                                onChange={e => setMateriaSeleccionada(e.target.value)}
                                required
                            >
                                <option value="">Selecciona una materia...</option>
                                {materias.map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                            </select>

                            <div className="form-check mt-4 mb-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="proyectoFinalizado"
                                    checked={proyectoFinalizado}
                                    onChange={(e) => setProyectoFinalizado(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="proyectoFinalizado">
                                    Mi proyecto está finalizado
                                </label>
                            </div>

                            {proyectoFinalizado && (
                                <div className="mb-3">
                                    <label className="form-label">Subir informe PDF:</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept=".pdf"
                                        onChange={(e) => setArchivoInforme(e.target.files[0])}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="text-center">
                            <button type="submit" className="btn btn-primary px-5" disabled={loading}>
                                {loading ? 'Guardando…' : 'Guardar Proyecto'}
                            </button>
                        </div>
                    </form>
                    <ToastContainer position="top-right" autoClose={3000}/>
                </EventWrapper>
            </AuthBackground>
        </>
    );
};

export default DefinirProyecto;
