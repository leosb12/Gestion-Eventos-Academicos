import React, {useEffect, useState} from 'react';
import supabase from '../utils/supabaseClient';
import {useNavigate} from 'react-router-dom';
import {UserAuth} from '../context/AuthContext';
import {toast} from 'react-toastify';
import Navbar from '../components/Navbar';

const criterios = ['Originalidad', 'Claridad', 'Presentación'];

export default function EvaluarProyectos() {
    const {session, tipoUsuario} = UserAuth();
    const navigate = useNavigate();

    const [usuarioId, setUsuarioId] = useState(null);
    const [equiposAsignados, setEquiposAsignados] = useState([]);
    const [evaluaciones, setEvaluaciones] = useState({});
    const [comentarios, setComentarios] = useState({});
    const [evaluacionesRealizadas, setEvaluacionesRealizadas] = useState({});

    // 1) obtener el ID de usuario
    useEffect(() => {
        if (!session?.user?.email) return;
        supabase
            .from('usuario')
            .select('id')
            .eq('correo', session.user.email)
            .maybeSingle()
            .then(({data, error}) => {
                if (!error && data) setUsuarioId(data.id);
            });
    }, [session]);

    // 2) validar rol
    useEffect(() => {
        if (tipoUsuario == null) return; // aún cargando
        if (![3, 7].includes(tipoUsuario)) {
            toast.error('Acceso no autorizado');
            navigate('/');
        }
    }, [tipoUsuario, navigate]);

    // 3) traer equipos + su informe + evaluaciones previas
    useEffect(() => {
        if (usuarioId == null || tipoUsuario == null) return;

        (async () => {
            let equipos = [];

            const selectEquipos = `
        id,
        nombre,
        evento(id_tevento),
        proyecto(id, url_informe)
      `;

            if (tipoUsuario === 7) {
                // admin: traigo TODOS los equipos
                const {data: allEqs, error: errAll} = await supabase
                    .from('equipo')
                    .select(selectEquipos);
                if (errAll) {
                    toast.error('Error al cargar equipos');
                    return;
                }
                equipos = allEqs;
            } else {
                // tribunal: solo los que tengo asignados
                const {data: asigns, error: errTr} = await supabase
                    .from('tribunal')
                    .select('id_equipo')
                    .eq('id_usuario', usuarioId);
                if (errTr) {
                    toast.error('Error al cargar asignaciones');
                    return;
                }
                const equipoIds = (asigns || []).map(a => a.id_equipo);
                if (equipoIds.length) {
                    const {data: misEqs, error: errEqs} = await supabase
                        .from('equipo')
                        .select(selectEquipos)
                        .in('id', equipoIds);
                    if (errEqs) {
                        toast.error('Error al cargar equipos');
                        return;
                    }
                    equipos = misEqs;
                }
            }

            setEquiposAsignados(equipos);

            // c) evaluaciones ya hechas por mí
            const {data: evals, error: errEvals} = await supabase
                .from('evaluacion')
                .select('id_equipo, puntaje, comentario, fecha')
                .eq('id_usuario', usuarioId);
            if (!errEvals) {
                const mapEval = {};
                (evals || []).forEach(e => {
                    mapEval[e.id_equipo] = e;
                });
                setEvaluacionesRealizadas(mapEval);
            }
        })();
    }, [usuarioId, tipoUsuario]);

    // handlers de formulario
    const handleEvaluacion = (equipoId, criterio, valor) => {
        setEvaluaciones(prev => ({
            ...prev,
            [equipoId]: {...prev[equipoId], [criterio]: Number(valor)}
        }));
    };
    const handleComentario = (equipoId, texto) => {
        setComentarios(prev => ({...prev, [equipoId]: texto}));
    };

    // guardar
    const guardarEvaluacion = async equipoId => {
        const evalObj = evaluaciones[equipoId];
        if (!evalObj || Object.keys(evalObj).length !== criterios.length) {
            return toast.error('Debes completar todos los criterios');
        }
        const total = Object.values(evalObj).reduce((a, b) => a + b, 0);
        const {error} = await supabase.from('evaluacion').insert({
            id_equipo: equipoId,
            id_usuario: usuarioId,
            puntaje: total,
            comentario: comentarios[equipoId]
        });
        if (error) toast.error('Error al guardar evaluación');
        else {
            toast.success('Evaluación guardada');
            setEvaluacionesRealizadas(prev => ({
                ...prev,
                [equipoId]: {
                    puntaje: total,
                    comentario: comentarios[equipoId],
                    fecha: new Date().toISOString()
                }
            }));
        }
    };

    // renderizado por equipo
    const renderEvaluacion = equipo => {
        const prev = evaluacionesRealizadas[equipo.id];
        if (prev) {
            return (
                <div key={equipo.id} className="card mb-4 border-success">
                    <div className="card-header bg-success text-white">
                        {equipo.nombre} – Ya Evaluado
                    </div>
                    <div className="card-body">
                        <p><strong>Puntaje:</strong> {prev.puntaje}</p>
                        <p><strong>Comentario:</strong> {prev.comentario}</p>
                        <p><em>{new Date(prev.fecha).toLocaleString()}</em></p>
                    </div>
                </div>
            );
        }
        return (
            <div key={equipo.id} className="card mb-4">
                <div className="card-header fw-bold">{equipo.nombre}</div>
                <div className="card-body">
                    {criterios.map(c => (
                        <div key={c} className="mb-3">
                            <label className="form-label">{c}</label>
                            <select
                                className="form-select"
                                defaultValue=""
                                onChange={e => handleEvaluacion(equipo.id, c, e.target.value)}
                            >
                                <option value="" disabled>Selecciona puntaje</option>
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    ))}

                    {/* ——— Aquí mostramos el botón de Informe PDF sólo para Ferias ——— */}
                    {equipo.evento?.id_tevento === 2 &&
                        Array.isArray(equipo.proyecto) &&
                        equipo.proyecto[0]?.url_informe && (
                            <div className="mb-3">
                                <a
                                    href={equipo.proyecto[0].url_informe}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-primary"
                                >
                                    📄 Ver Informe PDF
                                </a>
                            </div>
                        )}

                    <div className="mb-3">
                        <label className="form-label">Comentarios</label>
                        <textarea
                            className="form-control"
                            rows={3}
                            onChange={e => handleComentario(equipo.id, e.target.value)}
                        />
                    </div>
                    <button className="btn btn-success" onClick={() => guardarEvaluacion(equipo.id)}>
                        Guardar
                    </button>
                </div>
            </div>
        );
    };

    const ferias = equiposAsignados.filter(e => e.evento?.id_tevento === 2);
    const hackatones = equiposAsignados.filter(e => e.evento?.id_tevento === 4);

    return (
        <>
            <Navbar/>
            <div className="container py-4">
                <h2>Evaluar Equipos Asignados</h2>

                <h4 className="text-primary">Equipos de Feria</h4>
                {ferias.length
                    ? ferias.map(renderEvaluacion)
                    : <p>No tienes equipos de feria.</p>
                }

                <hr/>

                <h4 className="text-success">Equipos de Hackatón</h4>
                {hackatones.length
                    ? hackatones.map(renderEvaluacion)
                    : <p>No tienes equipos de hackatón.</p>
                }
            </div>
        </>
    );
}
