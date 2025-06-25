import React, {useEffect, useState} from 'react';
import Navbar from '../components/Navbar';
import supabase from '../utils/supabaseClient';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// ...importaciones igual...

const AsignarTribunal = () => {
    const [equipos, setEquipos] = useState([]);
    const [tribunales, setTribunales] = useState([]);
    const [proyectosPorEquipo, setProyectosPorEquipo] = useState({});
    const [asignaciones, setAsignaciones] = useState({});
    const [expanded, setExpanded] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarDatos = async () => {
            const {data: tribunalUsers} = await supabase
                .from('usuario')
                .select('id, nombre')
                .eq('id_tipo_usuario', 3);
            setTribunales(tribunalUsers || []);

            const {data: equiposData} = await supabase
                .from('equipo')
                .select('id, nombre, id_evento, evento(nombre)')
                .order('id_evento', {ascending: true});

            const proyectosMap = {};
            const asignacionMap = {};

            for (let eq of equiposData) {
                const {data: proyecto} = await supabase
                    .from('proyecto')
                    .select('id')
                    .eq('id_equipo', eq.id)
                    .maybeSingle();

                if (proyecto) {
                    proyectosMap[eq.id] = proyecto.id;

                    const {data: asignados} = await supabase
                        .from('tribunal')
                        .select('id_usuario')
                        .eq('id_proyecto', proyecto.id);

                    asignacionMap[eq.id] = asignados.map(a => a.id_usuario);
                } else {
                    asignacionMap[eq.id] = [];
                }
            }

            setEquipos(equiposData);
            setProyectosPorEquipo(proyectosMap);
            setAsignaciones(asignacionMap);
            setLoading(false);
        };

        cargarDatos();
    }, []);

    const toggleTribunal = (equipoId, usuarioId) => {
        setAsignaciones(prev => {
            const actual = new Set(prev[equipoId] || []);
            if (actual.has(usuarioId)) {
                actual.delete(usuarioId);
            } else {
                actual.add(usuarioId);
            }
            return {...prev, [equipoId]: Array.from(actual)};
        });
    };

    const guardarAsignaciones = async () => {
        for (const [equipoId, usuarios] of Object.entries(asignaciones)) {
            const proyectoId = proyectosPorEquipo[equipoId];
            if (!proyectoId) continue;

            await supabase.from('tribunal').delete().eq('id_proyecto', proyectoId);

            if (usuarios.length > 0) {
                const inserts = usuarios.map(id_usuario => ({
                    id_proyecto: proyectoId,
                    id_usuario,
                    id_equipo: parseInt(equipoId)
                }));

                const {error} = await supabase.from('tribunal').insert(inserts);
                if (error) {
                    console.error(error);
                    toast.error(`Error al asignar tribunal al equipo ${equipoId}`);
                    return;
                }
            }
        }

        toast.success('Tribunales asignados correctamente');
        setTimeout(() => window.location.reload(), 1500);
    };

    if (loading) return <p className="text-center mt-5">Cargando...</p>;

    return (
        <>
            <Navbar/>
            <div className="container mt-4">
                <h2 className="mb-4 text-center fw-bold">🧑‍⚖️ Asignar Tribunal a Equipos</h2>
                <div className="table-responsive shadow border rounded bg-white">
                    <table className="table table-hover align-middle text-center">
                        <thead className="bg-dark text-white">
                        <tr>
                            <th>#</th>
                            <th>🧑‍🤝‍🧑 Equipo</th>
                            <th>🎪 Evento</th>
                            <th>👨‍⚖️ Tribunal</th>
                        </tr>
                        </thead>
                        <tbody>
                        {equipos.map((equipo, idx) => (
                            <tr key={equipo.id}>
                                <td>{idx + 1}</td>
                                <td className="fw-semibold">{equipo.nombre}</td>
                                <td>{equipo.evento?.nombre || '—'}</td>
                                <td>
                                    {proyectosPorEquipo[equipo.id] ? (
                                        <>
                                            <button
                                                className={`btn btn-sm ${
                                                    asignaciones[equipo.id]?.length > 0 ? 'btn-outline-secondary' : 'btn-outline-primary'
                                                }`}
                                                onClick={() => setExpanded(expanded === equipo.id ? null : equipo.id)}
                                            >
                                                {expanded === equipo.id ? 'Cerrar' : (asignaciones[equipo.id]?.length > 0 ? 'Editar Tribunal' : 'Asignar Tribunal')}
                                            </button>

                                            {expanded === equipo.id && (
                                                <div className="mt-2 text-start">
                                                    {tribunales.map(t => (
                                                        <div key={t.id} className="form-check">
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                id={`chk-${equipo.id}-${t.id}`}
                                                                checked={(asignaciones[equipo.id] || []).includes(t.id)}
                                                                onChange={() => toggleTribunal(equipo.id, t.id)}
                                                            />
                                                            <label className="form-check-label"
                                                                   htmlFor={`chk-${equipo.id}-${t.id}`}>
                                                                {t.nombre}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-muted fst-italic">Sin proyecto</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="text-center mt-4">
                    <button className="btn btn-primary px-4 fw-bold" onClick={guardarAsignaciones}>
                        💾 Guardar Asignaciones
                    </button>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000}/>
        </>
    );
};

export default AsignarTribunal;
