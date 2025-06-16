import React, {useEffect, useState} from 'react';
import Navbar from '../components/Navbar';
import supabase from '../utils/supabaseClient';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AsignarMentor = () => {
    const [equipos, setEquipos] = useState([]);
    const [mentores, setMentores] = useState([]);
    const [mentorAsignado, setMentorAsignado] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarDatos = async () => {
            const {data: mentorUsers} = await supabase
                .from('usuario')
                .select('id, nombre')
                .eq('id_tipo_usuario', 8); // tipo mentor

            setMentores(mentorUsers || []);

            const {data: equiposData} = await supabase
                .from('equipo')
                .select('id, nombre, id_evento, mentor_id, evento(nombre)')
                .order('id_evento', {ascending: true});

            const asignaciones = {};
            equiposData.forEach(e => {
                if (e.mentor_id) asignaciones[e.id] = e.mentor_id;
            });

            setEquipos(equiposData);
            setMentorAsignado(asignaciones);
            setLoading(false);
        };

        cargarDatos();
    }, []);

    const guardarAsignaciones = async () => {
        for (const [equipoId, mentorId] of Object.entries(mentorAsignado)) {
            const {error} = await supabase
                .from('equipo')
                .update({mentor_id: mentorId})
                .eq('id', parseInt(equipoId));

            if (error) {
                toast.error(`Error al asignar mentor al equipo ID ${equipoId}`);
                return;
            }
        }

        toast.success('Mentores asignados correctamente');
    };

    if (loading) return <p className="text-center mt-5">Cargando...</p>;

    return (
        <>
            <Navbar/>
            <div className="container mt-4">
                <h2 className="mb-4 text-center fw-bold">🧑‍🏫 Asignar Mentor a Equipos</h2>
                <div className="table-responsive shadow border rounded bg-white">
                    <table className="table table-hover align-middle text-center">
                        <thead className="bg-dark text-white">
                        <tr>
                            <th style={{minWidth: "50px"}}>#</th>
                            <th style={{minWidth: "200px"}}>🧑‍🤝‍🧑 Equipo</th>
                            <th style={{minWidth: "200px"}}>🎪 Evento</th>
                            <th style={{minWidth: "250px"}}>🧑‍🏫 Mentor Asignado</th>
                        </tr>
                        </thead>
                        <tbody>
                        {equipos.map((equipo, idx) => (
                            <tr key={equipo.id}>
                                <td data-label="#"> {idx + 1}</td>
                                <td data-label="Equipo" className="fw-semibold">{equipo.nombre}</td>
                                <td data-label="Evento">{equipo.evento?.nombre || '—'}</td>
                                <td data-label="Mentor">
                                    <select
                                        className="form-select"
                                        value={mentorAsignado[equipo.id] ?? ''}
                                        onChange={e =>
                                            setMentorAsignado(prev => ({
                                                ...prev,
                                                [equipo.id]: e.target.value ? parseInt(e.target.value) : null
                                            }))
                                        }
                                    >
                                        <option value="">— No asignado —</option>
                                        {mentores.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="text-center mt-4">
                    <button className="btn btn-success px-4 fw-bold" onClick={guardarAsignaciones}>
                        💾 Guardar Asignaciones
                    </button>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000}/>
        </>
    );
};

export default AsignarMentor;
