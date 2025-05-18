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
        if (usuarioId) {
            const nuevosMiembros = Array.from({length: numMiembros}, (_, i) => {
                if (i === 0) return usuarioId;
                return '';
            });
            setMiembros(nuevosMiembros);
        }
    }, [numMiembros, usuarioId]);

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
            const {data: equipoNombre, error: nombreError} = await supabase
                .from('equipo')
                .select('id')
                .eq('nombre', nombreEquipo);

            if (nombreError) throw nombreError;

            if (equipoNombre.length > 0) {
                const {data: relacionados, error: relError} = await supabase
                    .from('nivelgrupo')
                    .select('id_equipo')
                    .in('id_equipo', equipoNombre.map(e => e.id));

                if (relError) throw relError;

                const {data: yaInscritos, error: inscError} = await supabase
                    .from('inscripcionevento')
                    .select('id_usuario')
                    .eq('id_evento', parseInt(idEvento));

                if (inscError) throw inscError;

                const usadosEnEsteEvento = yaInscritos
                    .map(i => i.id_usuario)
                    .filter(id => miembrosNumeros.includes(id));

                if (usadosEnEsteEvento.length > 0) {
                    toast.error('Ya existe un equipo con ese nombre en este evento.');
                    setLoading(false);
                    return;
                }
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
                    id_lider: usuarioId // ✅ este es el campo nuevo
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
                            <button type="submit" className="btn btn-primary px-5" disabled={loading}>
                                {loading ? 'Inscribiendo…' : 'Inscribir Equipo'}
                            </button>
                        </div>
                    </form>
                    <ToastContainer position="top-right" autoClose={3000}/>
                </EventWrapper>
            </AuthBackground>
        </>
    );
};

export default InscribirEquipo;
