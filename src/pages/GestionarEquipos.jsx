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
            const {data: authUser} = await supabase.auth.getUser();
            const correo = authUser?.user?.email?.toLowerCase();

            if (!correo) {
                toast.error("No se pudo obtener tu correo.");
                setLoading(false);
                return;
            }

            const {data: usuarioData, error} = await supabase
                .from('usuario')
                .select('id, id_tipo_usuario, tipo_usuario:tipousuario(nombre)')
                .eq('correo', correo)
                .maybeSingle();

            if (error || !usuarioData) {
                toast.error("No estás registrado correctamente en el sistema.");
                setLoading(false);
                return;
            }

            const uid = usuarioData.id;
            const tipo = usuarioData.id_tipo_usuario;
            setIdUsuario(uid);
            setTipoUsuario(usuarioData.tipo_usuario?.nombre || '');

            // Traer mis equipos
            const {data: misMiembros} = await supabase
                .from('miembrosequipo')
                .select('id_equipo')
                .eq('id_usuario', uid);

            const misEquipoIds = (misMiembros || []).map(m => m.id_equipo);

            let misEquiposData = [];
            if (misEquipoIds.length > 0) {
                const {data} = await supabase
                    .from('equipo')
                    .select('id, nombre, id_lider, id_evento, evento(nombre), mentor_id')
                    .in('id', misEquipoIds);
                misEquiposData = data || [];
            }

            const misEquiposConMiembros = await Promise.all(misEquiposData.map(async (equipo) => {
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
                    tribunal: tribunal || []
                };
            }));

            setMisEquipos(misEquiposConMiembros);

            // Si es organizador o admin, traer todos los equipos
            if (tipo === 6 || tipo === 7) {
                const {data} = await supabase
                    .from('equipo')
                    .select('id, nombre, id_lider, id_evento, evento(nombre), mentor_id');
                const equipos = data || [];

                const equiposConMiembros = await Promise.all(equipos.map(async (equipo) => {
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
                        tribunal: tribunal || []
                    };
                }));

                setTodosEquipos(equiposConMiembros);
            }

            setLoading(false);
        };

        fetchEquipos();
    }, []);

    const salirOEliminar = async (equipo) => {
        if (!idUsuario) return;

        const esLider = idUsuario === equipo.id_lider;
        const esAdmin = tipoUsuario === 'Organizador' || tipoUsuario === 'Administrador';

        if (esLider || esAdmin) {
            const {error: err1} = await supabase.from('miembrosequipo').delete().eq('id_equipo', equipo.id);
            const {error: err2} = await supabase.from('equipo').delete().eq('id', equipo.id);
            if (err1 || err2) toast.error("Error al eliminar el equipo");
            else {
                toast.success("Equipo eliminado correctamente");
                setMisEquipos(prev => prev.filter(e => e.id !== equipo.id));
                setTodosEquipos(prev => prev.filter(e => e.id !== equipo.id));
            }
        } else {
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

    const renderEquipoCard = (equipo) => (
        <div key={equipo.id} className="col-12 col-md-6 mb-4">
            <div className="card shadow border h-100">
                <div
                    className="card-header bg-dark text-white d-flex justify-content-between align-items-center flex-wrap">
                    <h5 className="mb-2 mb-md-0">{equipo.nombre} (Evento: {equipo.evento?.nombre || 'Desconocido'})</h5>
                    <button className="btn btn-sm btn-danger mt-2 mt-md-0" onClick={() => salirOEliminar(equipo)}>
                        {(idUsuario === equipo.id_lider || tipoUsuario === 'Organizador' || tipoUsuario === 'Administrador')
                            ? '🗑 Eliminar equipo'
                            : '🚪 Salir del equipo'}
                    </button>
                </div>
                <div className="card-body">
                    <p><strong>👑 Líder del equipo:</strong> {equipo.id_lider}</p>
                    <p><strong>🎓 Mentor:</strong> {equipo.mentor_id || 'No asignado'}</p>
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
                {misEquipos.length === 0
                    ? <p className="text-center text-muted">No hay equipos disponibles.</p>
                    : <div className="row">{misEquipos.map(renderEquipoCard)}</div>
                }

                {(tipoUsuario === 'Organizador' || tipoUsuario === 'Administrador') && (
                    <>
                        <h2 className="fw-bold text-center my-4">📋 Equipos de la facultad</h2>
                        {todosEquipos.length === 0
                            ? <p className="text-center text-muted">No hay equipos registrados.</p>
                            : <div className="row">{todosEquipos.map(renderEquipoCard)}</div>
                        }
                    </>
                )}
            </div>
            <ToastContainer position="top-right" autoClose={3000}/>
        </>
    );
};

export default GestionarEquipos;
