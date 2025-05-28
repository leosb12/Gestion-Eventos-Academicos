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

            const {data: miembroData, error: errorMiembro} = await supabase
                .from('miembrosequipo')
                .select('id_equipo')
                .eq('id_usuario', usuarioId);

            if (errorMiembro || !miembroData?.length) return;

            const idEquipo = miembroData[0].id_equipo;

            const {data: equipo, error: errorEquipo} = await supabase
                .from('equipo')
                .select('id')
                .eq('id', idEquipo)
                .eq('id_evento', evento.id)
                .maybeSingle();

            if (!errorEquipo && equipo) {
                setEquipoId(equipo.id);
            }
        };

        obtenerEquipo();
    }, [usuarioId, evento]);

    const handleAsistencia = async () => {
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
                .select('id')
                .eq('id_equipo', equipoId)
                .eq('id_evento', evento.id)
                .not('url_informe', 'is', null);

            if (errorProyecto || !proyecto || proyecto.length === 0) {
                toast.error('Debes subir el informe final antes de marcar asistencia.');
                return;
            }
        }

        if (evento.id_tevento === 4) {
            if (clave.trim() !== 'CLAVE_ENTRADA') {
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
                    <button className="btn btn-success btn-sm" onClick={handleAsistencia}>
                        Marcar Asistencia
                    </button>
                </>
            )}
        </div>
    );
};

export default MarcarAsistencia;
