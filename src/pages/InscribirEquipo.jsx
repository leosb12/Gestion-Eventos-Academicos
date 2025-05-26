import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthBackground from '../components/AuthBackground';
import EventWrapper from '../components/EventWrapper';
import supabase from '../utils/supabaseClient';
import {toast} from 'react-toastify';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {UserAuth} from '../context/AuthContext';
import {useLocation} from 'react-router-dom';

const InscribirEquipo = () => {
    const {id: idEvento} = useParams();
    const navigate = useNavigate();
    const {user} = UserAuth();

    const [usuarioId, setUsuarioId] = useState(null);
    const [nivelOpciones, setNivelOpciones] = useState([]);
    const [nombreEquipo, setNombreEquipo] = useState('');
    const [nivelSeleccionado, setNivelSeleccionado] = useState('');
    const [numMiembros, setNumMiembros] = useState(1);
    const [miembros, setMiembros] = useState([]);
    const [loading, setLoading] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (location.state) {
            const {nombreEquipo, nivelSeleccionado, miembros} = location.state;
            if (nombreEquipo) setNombreEquipo(nombreEquipo);
            if (nivelSeleccionado) setNivelSeleccionado(nivelSeleccionado);
            if (Array.isArray(miembros) && miembros.length > 0) {
                setMiembros(miembros);
                setNumMiembros(miembros.length);
            }
        }
    }, [location.state]);

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
        const obtenerNiveles = async () => {
            const {data, error} = await supabase.from('nivel').select('*');
            if (!error) setNivelOpciones(data);
        };

        obtenerNiveles();
    }, []);

    useEffect(() => {
        if (!usuarioId) return;

        setMiembros(prev => {
            let actualizados = [...prev];

            // Asegurar que el primer miembro siempre sea el usuario actual
            actualizados[0] = usuarioId;

            // Si hay más miembros de los necesarios, recortar
            if (actualizados.length > numMiembros) {
                actualizados = actualizados.slice(0, numMiembros);
            }

            // Si faltan miembros, añadir vacíos
            while (actualizados.length < numMiembros) {
                actualizados.push('');
            }

            return actualizados;
        });
    }, [numMiembros, usuarioId]);


    const handleDefinirProyecto = async () => {
        if (!nombreEquipo || !nivelSeleccionado || miembros.length === 0) {
            toast.error('Completa todos los campos.');
            return;
        }

        if (new Set(miembros).size !== miembros.length) {
            toast.error('Hay miembros duplicados.');
            return;
        }

        const miembrosNumeros = miembros
            .map(id => parseInt(id))
            .filter(id => Number.isInteger(id) && id > 0);

        if (miembrosNumeros.length !== miembros.length) {
            toast.error('Todos los registros deben ser números válidos.');
            return;
        }

        const {data: usuariosValidos, error: valError} = await supabase
            .from('usuario')
            .select('id')
            .in('id', miembrosNumeros);

        if (valError) {
            toast.error('Error al validar los registros.');
            return;
        }

        const idsValidos = usuariosValidos.map(u => u.id);
        const idsInvalidos = miembrosNumeros.filter(id => !idsValidos.includes(id));

        if (idsInvalidos.length > 0) {
            toast.error(`Registro inválido: los siguientes ID no existen: ${idsInvalidos.join(', ')}`);
            return;
        }

        const {data: inscritos, error: yaInsError} = await supabase
            .from('inscripcionevento')
            .select('id_usuario')
            .eq('id_evento', parseInt(idEvento));

        if (yaInsError) {
            toast.error('Error al verificar inscripciones previas.');
            return;
        }

        const conflicto = miembrosNumeros.filter(id =>
            inscritos.some(i => i.id_usuario === id)
        );

        if (conflicto.length > 0) {
            toast.error(`Usuarios ya inscritos: ${conflicto.join(', ')}`);
            return;
        }

        navigate(`/definir-proyecto/${idEvento}`, {
            state: {
                nombreEquipo,
                nivelSeleccionado,
                miembros
            }
        });
    };

    const handleChangeMiembro = (index, value) => {
        const actualizados = [...miembros];
        actualizados[index] = value;
        setMiembros(actualizados);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nombreEquipo || !nivelSeleccionado || miembros.length === 0) {
            toast.error('Completa todos los campos.');
            return;
        }

        if (new Set(miembros).size !== miembros.length) {
            toast.error('Hay miembros duplicados.');
            return;
        }

        const miembrosNumeros = miembros
            .map(id => parseInt(id))
            .filter(id => Number.isInteger(id) && id > 0);

        if (miembrosNumeros.length !== miembros.length) {
            toast.error('Todos los registros deben ser números válidos.');
            return;
        }

        setLoading(true);

        try {
            const {data: equiposMismoNombre, error: nombreError} = await supabase
                .from('equipo')
                .select('id')
                .ilike('nombre', nombreEquipo.trim())
                .eq('id_evento', parseInt(idEvento));

            if (nombreError) throw nombreError;

            if (equiposMismoNombre.length > 0) {
                toast.error('Ya existe un equipo con ese nombre en este evento.');
                setLoading(false);
                return;
            }


            const {data: usuariosValidos, error: valError} = await supabase
                .from('usuario')
                .select('id')
                .in('id', miembrosNumeros);

            if (valError) {
                toast.error('Error al validar los registros.');
                setLoading(false);
                return;
            }

            const idsValidos = usuariosValidos.map(u => u.id);
            const idsInvalidos = miembrosNumeros.filter(id => !idsValidos.includes(id));

            if (idsInvalidos.length > 0) {
                console.log("IDs inválidos detectados:", idsInvalidos);
                toast.error(`Registro inválido: los siguientes ID no existen: ${idsInvalidos.join(', ')}`);
                setLoading(false);
                return;
            }


            const {data: inscritos, error: yaInsError} = await supabase
                .from('inscripcionevento')
                .select('id_usuario')
                .eq('id_evento', parseInt(idEvento));

            if (yaInsError) throw yaInsError;

            const conflicto = miembrosNumeros.filter(id =>
                inscritos.some(i => i.id_usuario === id)
            );

            if (conflicto.length > 0) {
                toast.error(`Usuarios ya inscritos: ${conflicto.join(', ')}`);
                setLoading(false);
                return;
            }

            // 1. Insertar el equipo con id_lider
            const {data: equipoData, error: eqInsertError} = await supabase
                .from('equipo')
                .insert({
                    nombre: nombreEquipo,
                    id_lider: usuarioId,
                    id_evento: parseInt(idEvento)
                })
                .select()
                .single();


            if (eqInsertError) throw eqInsertError;
            const idEquipo = equipoData.id;

// 2. Insertar miembros
            const miembrosData = miembrosNumeros.map(id_usuario => ({
                id_equipo: idEquipo,
                id_usuario
            }));

            const {error: miembrosError} = await supabase
                .from('miembrosequipo')
                .insert(miembrosData);

            if (miembrosError) throw miembrosError;

// 3. Insertar nivel del grupo
            const {error: nivelError} = await supabase
                .from('nivelgrupo')
                .insert({
                    id_nivel: parseInt(nivelSeleccionado),
                    id_equipo: idEquipo
                });

            if (nivelError) throw nivelError;

// 4. Inscribir a todos los miembros en el evento
            const inscripciones = miembrosNumeros.map(id_usuario => ({
                id_evento: parseInt(idEvento),
                id_usuario
            }));

            const {error: inscError} = await supabase
                .from('inscripcionevento')
                .insert(inscripciones);

            if (inscError) throw inscError;

            toast.success('Equipo inscrito correctamente.');
            setTimeout(() => navigate('/'), 3500);


        } catch (err) {
            toast.error('Error al inscribir equipo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const [tipoEvento, setTipoEvento] = useState(null);

    useEffect(() => {
        const obtenerTipoEvento = async () => {
            const {data, error} = await supabase
                .from('evento')
                .select('id_tevento')
                .eq('id', idEvento)
                .maybeSingle();

            if (!error && data) {
                setTipoEvento(data.id_tevento);
            }
        };

        obtenerTipoEvento();
    }, [idEvento]);


    return (
        <>
            <Navbar/>
            <AuthBackground>
                <EventWrapper title="INSCRIBIR EQUIPO">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Nombre del equipo:</label>
                            <input
                                type="text"
                                className="form-control"
                                value={nombreEquipo}
                                onChange={e => setNombreEquipo(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Nivel:</label>
                            <select
                                className="form-select"
                                value={nivelSeleccionado}
                                onChange={e => setNivelSeleccionado(e.target.value)}
                                required
                            >
                                <option value="">Selecciona...</option>
                                {nivelOpciones.map(nivel => (
                                    <option key={nivel.id} value={nivel.id}>
                                        {nivel.nombre} - {nivel.descripcion}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Número de miembros:</label>
                            <div className="input-group">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() => setNumMiembros(prev => Math.max(1, prev - 1))}
                                >
                                    −
                                </button>
                                <input
                                    type="text"
                                    className="form-control text-center"
                                    value={numMiembros}
                                    readOnly
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() => setNumMiembros(prev => Math.min(6, prev + 1))}
                                >
                                    +
                                </button>
                            </div>
                        </div>


                        <div className="mb-4">
                            <label className="form-label">Registros de los miembros:</label>
                            {miembros.map((miembro, index) => (
                                <div key={index} className="input-group mb-2">
                                    <span className="input-group-text">Miembro #{index + 1}</span>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={miembro}
                                        onChange={e => handleChangeMiembro(index, e.target.value)}
                                        readOnly={index === 0}
                                        required
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="text-center">
                            {tipoEvento === 2 ? (
                                <button
                                    type="button"
                                    className="btn btn-primary px-5"
                                    onClick={handleDefinirProyecto}
                                >
                                    Guardar Equipo
                                </button>
                            ) : (
                                <button type="submit" className="btn btn-primary px-5" disabled={loading}>
                                    {loading ? 'Inscribiendo…' : 'Inscribir Equipo'}
                                </button>
                            )}
                        </div>
                    </form>
                    <ToastContainer position="top-right" autoClose={3000}/>
                </EventWrapper>
            </AuthBackground>
        </>
    );
};

export default InscribirEquipo;
