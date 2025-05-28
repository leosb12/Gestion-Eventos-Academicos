import React, {useState, useEffect} from 'react';
import supabase from '../utils/supabaseClient';
import {toast} from 'react-toastify';

const MarcarAsistencia = ({evento, usuarioId}) => {
    const [clave, setClave] = useState('');
    const [equipoId, setEquipoId] = useState(null);

    useEffect(() => {
        const obtenerEquipo = async () => {
            if (!usuarioId || !evento?.id) return;

            // Obtener ID del equipo al que pertenece el usuario en este evento
            const {data, error} = await supabase
                .from('miembrosequipo')
                .select('id_equipo')
                .eq('id_usuario', usuarioId);

            if (error || !data?.length) {
                console.warn('No se encontró equipo.');
                return;
            }

            // Verificar que ese equipo pertenece al evento actual
            const {data: equipo} = await supabase
                .from('equipo')
                .select('id')
                .eq('id', data[0].id_equipo)
                .eq('id_evento', evento.id)
                .maybeSingle();

            if (equipo) {
                setEquipoId(equipo.id);
            }
        };

        obtenerEquipo();
    }, [usuarioId, evento]);

    const handleAsistencia = async () => {
        if (!evento || !usuarioId) return;

        // Validar requisito de informe final para Feria Expositiva (id_tevento = 2)
        if (evento.id_tevento === 2) {
            const {data: proyecto, error} = await supabase
                .from('proyecto')
                .select('id')
                .eq('id_equipo', equipoId)
                .eq('id_evento', evento.id)
                .not('url_informe', 'is', null);

            if (error || !proyecto?.length) {
                toast.error('Debes subir el informe final antes de marcar asistencia.');
                return;
            }
        }

        // Validar clave para Hackatón (id_tevento = 4)
        if (evento.id_tevento === 4) {
            if (clave.trim() !== 'CLAVE_ENTRADA') {
                toast.error('Clave incorrecta.');
                return;
            }
        }

        // Registrar asistencia
        const {error: insertError} = await supabase.from('asistencia').insert({
            id_evento: evento.id,
            id_usuario: usuarioId,
            fecha: new Date().toISOString().split('T')[0],
        });

        if (insertError) {
            toast.error('Error al registrar la asistencia.');
        } else {
            toast.success('Asistencia registrada con éxito.');
        }
    };

    return (
        <div className="text-center">
            {evento.id_tevento === 4 ? (
                <>
                    <input
                        type="password"
                        className="form-control mb-2"
                        placeholder="Ingresa la clave"
                        value={clave}
                        onChange={(e) => setClave(e.target.value)}
                    />
                    <button className="btn btn-primary btn-sm" onClick={handleAsistencia}>
                        Validar Clave
                    </button>
                </>
            ) : (
                <button className="btn btn-success btn-sm" onClick={handleAsistencia}>
                    Marcar Asistencia
                </button>
            )}
        </div>
    );
};

export default MarcarAsistencia;
