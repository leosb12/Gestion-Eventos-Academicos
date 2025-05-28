import React, {useEffect, useState} from 'react';
import supabase from '../utils/supabaseClient';
import {toast} from 'react-toastify';

const MarcarAsistencia = ({evento, usuarioId}) => {
    const [clave, setClave] = useState('');
    const [yaMarcada, setYaMarcada] = useState(false);
    const [equipoId, setEquipoId] = useState(null);

    useEffect(() => {
        const verificarAsistencia = async () => {
            if (!evento?.id || !usuarioId) return;

            const {data, error} = await supabase
                .from('asistencia')
                .select('id_evento')
                .match({id_evento: evento.id, id_usuario: usuarioId});

            if (!error && data?.length > 0) {
                setYaMarcada(true);
            } else {
                setYaMarcada(false);
            }
        };

        verificarAsistencia();
    }, [evento, usuarioId]);

    useEffect(() => {
        const obtenerEquipo = async () => {
            if (!usuarioId || !evento?.id || evento.id_tevento !== 2) return;

            const {data: equiposUsuario, error} = await supabase
                .from('miembrosequipo')
                .select('equipo(id, id_evento)')
                .eq('id_usuario', usuarioId);

            if (error || !equiposUsuario?.length) return;

            const equipoActual = equiposUsuario.find(e => e.equipo?.id_evento === evento.id);
            console.log("📦 Equipos del usuario:", equiposUsuario);
            console.log("🎯 Buscando equipo con id_evento =", evento.id);

            if (equipoActual?.equipo?.id) {
                setEquipoId(equipoActual.equipo.id);
            }
        };

        obtenerEquipo();
    }, [usuarioId, evento]);


    const handleAsistencia = async () => {
        console.log("📌 handleAsistencia: evento =", evento);
        console.log("📌 handleAsistencia: usuarioId =", usuarioId);
        console.log("📌 handleAsistencia: equipoId =", equipoId);

        if (!evento || !usuarioId) {
            toast.error('Faltan datos para marcar asistencia');
            return;
        }

        if (evento.id_tevento === 2) {
            if (!equipoId) {
                toast.error('No se encontró equipo válido');
                return;
            }

            const {data: proyecto, error: errorProyecto} = await supabase
                .from('proyecto')
                .select('id, url_informe')
                .eq('id_equipo', equipoId)
                .not('url_informe', 'is', null);


            if (errorProyecto || !proyecto || proyecto.length === 0) {
                toast.error('Debes subir el informe final antes de marcar asistencia.');
                return;
            }
        }

        if (evento.id_tevento === 4) {
            if (!evento.clave_asistencia) {
                toast.error('No hay clave configurada para este evento.');
                return;
            }

            if (clave.trim() !== evento.clave_asistencia.trim()) {
                toast.error('Clave incorrecta.');
                return;
            }
        }


        const {error: insertError} = await supabase.from('asistencia').insert({
            id_evento: evento.id,
            id_usuario: usuarioId,
            fecha: new Date().toISOString().split('T')[0],
        });

        if (insertError) {
            if (insertError.message.toLowerCase().includes('duplicate')) {
                toast.info('Ya habías marcado asistencia.');
                setYaMarcada(true);
            } else {
                toast.error('No se pudo registrar la asistencia.');
            }
            return;
        }

        toast.success('Asistencia registrada con éxito.');
        setYaMarcada(true);
    };

    return (
        <div className="text-center">
            {yaMarcada ? (
                <span className="badge bg-success px-3 py-2">✅ Asistencia ya registrada</span>
            ) : (
                <>
                    {evento.id_tevento === 4 && (
                        <input
                            type="password"
                            className="form-control mb-2"
                            placeholder="Ingresa la clave"
                            value={clave}
                            onChange={(e) => setClave(e.target.value)}
                        />
                    )}

                    {evento.id_estado === 4 ? (
                        <button className="btn btn-success btn-sm" onClick={handleAsistencia}>
                            Marcar Asistencia
                        </button>
                    ) : (
                        <div className="alert alert-warning p-2 mt-2">
                            ⏳ El evento aún no ha comenzado.
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MarcarAsistencia;
