import React, {useEffect, useState} from 'react';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GestionarEquipos = () => {
    const [misEquipos, setMisEquipos] = useState([]);
    const [todosEquipos, setTodosEquipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [idUsuario, setIdUsuario] = useState(null);
    const [tipoUsuario, setTipoUsuario] = useState('');

    useEffect(() => {
        const fetchEquipos = async () => {
            // 1) obtener usuario
            const {data: authUser} = await supabase.auth.getUser();
            const correo = authUser?.user?.email?.toLowerCase();
            if (!correo) {
                toast.error("No se pudo obtener tu correo.");
                setLoading(false);
                return;
            }

            const {data: usuarioData, error: errUser} = await supabase
                .from('usuario')
                .select('id, id_tipo_usuario, tipo_usuario:tipousuario(nombre)')
                .eq('correo', correo)
                .maybeSingle();
            if (errUser || !usuarioData) {
                toast.error("No estás registrado correctamente en el sistema.");
                setLoading(false);
                return;
            }

            const uid = usuarioData.id;
            const tipoId = usuarioData.id_tipo_usuario;
            setIdUsuario(uid);
            setTipoUsuario(usuarioData.tipo_usuario?.nombre || '');

            // 2) traer todas las evaluaciones de la tabla
            const {data: evals} = await supabase
                .from('evaluacion')
                .select('id_equipo, puntaje, comentario, fecha');
            const evalMap = {};
            (evals || []).forEach(e => {
                evalMap[e.id_equipo] = e;
            });

            // Define el SELECT base, incluyendo el nombre del mentor
            const baseSelect = `
        id,
        nombre,
        id_lider,
        id_evento,
        evento(nombre),
        mentor_id,
        mentor:usuario!mentor_id(nombre)
      `;

            // 3) TRAER MIS EQUIPOS
            const {data: misMiembros} = await supabase
                .from('miembrosequipo')
                .select('id_equipo')
                .eq('id_usuario', uid);
            const misEquipoIds = (misMiembros || []).map(m => m.id_equipo);

            const misEquiposData = misEquipoIds.length > 0
                ? (await supabase
                        .from('equipo')
                        .select(baseSelect)
                        .in('id', misEquipoIds)
                ).data
                : [];

            const misEquiposConMiembros = await Promise.all(
                (misEquiposData || []).map(async equipo => {
                    const {data: miembros} = await supabase
                        .from('miembrosequipo')
                        .select('id_usuario, usuario(nombre)')
                        .eq('id_equipo', equipo.id);
                    const {data: tribunal} = await supabase
                        .from('tribunal')
                        .select('id_usuario, usuario(nombre)')
                        .eq('id_equipo', equipo.id);
                    return {
                        ...equipo,
                        miembros: miembros || [],
                        tribunal: tribunal || [],
                        evaluacion: evalMap[equipo.id] || null
                    };
                })
            );
            setMisEquipos(misEquiposConMiembros);

            // 4) SI ES ORGANIZADOR O ADMIN => TRAER TODOS LOS EQUIPOS
            if (tipoId === 6 || tipoId === 7) {
                const {data: all} = await supabase
                    .from('equipo')
                    .select(baseSelect);
                const todos = all || [];
                const todosConMiembros = await Promise.all(
                    todos.map(async equipo => {
                        const {data: miembros} = await supabase
                            .from('miembrosequipo')
                            .select('id_usuario, usuario(nombre)')
                            .eq('id_equipo', equipo.id);
                        const {data: tribunal} = await supabase
                            .from('tribunal')
                            .select('id_usuario, usuario(nombre)')
                            .eq('id_equipo', equipo.id);
                        return {
                            ...equipo,
                            miembros: miembros || [],
                            tribunal: tribunal || [],
                            evaluacion: evalMap[equipo.id] || null
                        };
                    })
                );
                setTodosEquipos(todosConMiembros);
            }

            setLoading(false);
        };

        fetchEquipos();
    }, []);

    const salirOEliminar = async equipo => {
        if (!idUsuario) return;
        const esLider = idUsuario === equipo.id_lider;
        const esAdmin = tipoUsuario === 'Organizador' || tipoUsuario === 'Administrador';

        if (esLider || esAdmin) {
            // eliminar equipo completo
            await supabase.from('miembrosequipo').delete().eq('id_equipo', equipo.id);
            await supabase.from('equipo').delete().eq('id', equipo.id);
            toast.success("Equipo eliminado correctamente");
            setMisEquipos(prev => prev.filter(e => e.id !== equipo.id));
            setTodosEquipos(prev => prev.filter(e => e.id !== equipo.id));
        } else {
            // salir solo yo
            const {error} = await supabase
                .from('miembrosequipo')
                .delete()
                .eq('id_equipo', equipo.id)
                .eq('id_usuario', idUsuario);
            if (error) toast.error("Error al salir del equipo");
            else {
                toast.success("Te has salido del equipo");
                setMisEquipos(prev => prev.filter(e => e.id !== equipo.id));
            }
        }
    };

    const MAX_PUNTAJE = 5 * 3;

    const renderEquipoCard = equipo => (
        <div key={equipo.id} className="col-12 col-md-6 mb-4">
            <div className="card shadow border h-100">
                <div
                    className="card-header bg-dark text-white d-flex justify-content-between align-items-center flex-wrap">
                    <h5 className="mb-2 mb-md-0">
                        {equipo.nombre} (Evento: {equipo.evento?.nombre || 'Desconocido'})
                    </h5>
                    <button
                        className="btn btn-sm btn-danger mt-2 mt-md-0"
                        onClick={() => salirOEliminar(equipo)}
                    >
                        {(idUsuario === equipo.id_lider ||
                            tipoUsuario === 'Organizador' ||
                            tipoUsuario === 'Administrador')
                            ? '🗑 Eliminar equipo'
                            : '🚪 Salir del equipo'}
                    </button>
                </div>
                <div className="card-body">
                    <p><strong>👑 Líder del equipo:</strong> {equipo.id_lider}</p>
                    <p>
                        <strong>🎓 Mentor:</strong>{' '}
                        {equipo.mentor?.nombre || 'No asignado'}
                    </p>

                    <h6 className="fw-bold mt-3">👥 Miembros:</h6>
                    <ul className="list-group list-group-flush">
                        {equipo.miembros.map(m => (
                            <li key={m.id_usuario} className="list-group-item">
                                {m.usuario?.nombre || m.id_usuario}
                                {m.id_usuario === equipo.id_lider && ' 👑 (Líder)'}
                            </li>
                        ))}
                    </ul>

                    {equipo.tribunal.length > 0 && (
                        <>
                            <h6 className="fw-bold mt-3">⚖️ Tribunal:</h6>
                            <ul className="list-group list-group-flush">
                                {equipo.tribunal.map(t => (
                                    <li key={t.id_usuario} className="list-group-item">
                                        {t.usuario?.nombre || t.id_usuario}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    <h6 className="fw-bold mt-3">📝 Evaluación:</h6>
                    {equipo.evaluacion ? (
                        <ul className="list-group list-group-flush">
                            <li className="list-group-item">
                                <strong>Puntaje:</strong> {equipo.evaluacion.puntaje}/{MAX_PUNTAJE}
                            </li>
                            <li className="list-group-item">
                                <strong>Comentario:</strong> {equipo.evaluacion.comentario}
                            </li>
                            <li className="list-group-item">
                                <strong>Fecha:</strong> {new Date(equipo.evaluacion.fecha).toLocaleString()}
                            </li>
                        </ul>
                    ) : (
                        <p className="text-warning">Pendiente de revisar</p>
                    )}
                </div>
            </div>
        </div>
    );

    if (loading) return <p className="text-center mt-5">Cargando equipos...</p>;

    return (
        <>
            <Navbar/>
            <div className="container mt-4 px-3">
                <h2 className="fw-bold text-center mb-4">📋 Mis Equipos</h2>
                {misEquipos.length === 0 ? (
                    <p className="text-center text-muted">No hay equipos disponibles.</p>
                ) : (
                    <div className="row">{misEquipos.map(renderEquipoCard)}</div>
                )}

                {(tipoUsuario === 'Organizador' || tipoUsuario === 'Administrador') && (
                    <>
                        <h2 className="fw-bold text-center my-4">📋 Equipos de la facultad</h2>
                        {todosEquipos.length === 0 ? (
                            <p className="text-center text-muted">No hay equipos registrados.</p>
                        ) : (
                            <div className="row">{todosEquipos.map(renderEquipoCard)}</div>
                        )}
                    </>
                )}
            </div>
            <ToastContainer position="top-right" autoClose={3000}/>
        </>
    );
};

export default GestionarEquipos;
