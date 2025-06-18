import React, {useEffect, useState} from 'react';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';

const GestionarEquipos = () => {
    const [equipos, setEquipos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEquipos = async () => {
            // 1. Obtener el correo del usuario autenticado
            const {data: authUser, error: errorAuth} = await supabase.auth.getUser();
            const correo = authUser?.user?.email;

            // 2. Obtener el id_usuario desde la tabla usuario
            const {data: usuarioData, error: errorUsuario} = await supabase
                .from('usuario')
                .select('id')
                .eq('correo', correo)
                .maybeSingle();

            if (!usuarioData) {
                console.error("No se encontró el usuario en la tabla usuario");
                setLoading(false);
                return;
            }

            const idUsuario = usuarioData.id;

            // 3. Buscar los equipos donde está inscrito
            const {data: miembros, error} = await supabase
                .from('miembrosequipo')
                .select('id_equipo')
                .eq('id_usuario', idUsuario);

            if (error || !miembros || miembros.length === 0) {
                setEquipos([]);
                setLoading(false);
                return;
            }

            const equipoIds = miembros.map(m => m.id_equipo);

            // 4. Obtener detalles de los equipos
            const {data: equipoData} = await supabase
                .from('equipo')
                .select('id, nombre, id_lider, id_evento, evento(nombre), mentor_id')
                .in('id', equipoIds);

            // 5. Obtener miembros de cada equipo
            const equiposConMiembros = await Promise.all(equipoData.map(async (equipo) => {
                const {data: miembrosEquipo} = await supabase
                    .from('miembrosequipo')
                    .select('id_usuario, usuario(nombre)')
                    .eq('id_equipo', equipo.id);

                return {
                    ...equipo,
                    miembros: miembrosEquipo || []
                };
            }));

            setEquipos(equiposConMiembros);
            setLoading(false);
        };

        fetchEquipos();
    }, []);

    if (loading) return <p className="text-center mt-5">Cargando equipos...</p>;

    return (
        <>
            <Navbar/>
            <div className="container mt-5">
                <h2 className="fw-bold text-center mb-4">📋 Mis Equipos</h2>
                {equipos.length === 0 ? (
                    <p className="text-center text-muted">No estás inscrito en ningún equipo.</p>
                ) : (
                    equipos.map((equipo, idx) => (
                        <div key={equipo.id} className="card mb-4 shadow border">
                            <div className="card-header bg-dark text-white">
                                <h5 className="mb-0">{equipo.nombre} (Evento: {equipo.evento?.nombre || 'Desconocido'})</h5>
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
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
};

export default GestionarEquipos;
