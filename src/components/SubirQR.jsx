// src/components/SubirQR.jsx
import React, {useRef} from 'react';
import {toast} from 'react-toastify';
import jsQR from 'jsqr';
import supabase from '../utils/supabaseClient';

const SubirQR = ({usuarioId, onAsistenciaRegistrada}) => {
    const fileInputRef = useRef();

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (!code) {
                toast.error('❌ No se detectó un código QR válido.');
                return;
            }

            try {
                const data = JSON.parse(code.data);
                const evento_id = parseInt(data.evento_id);

                // Verificar inscripción (idéntico a EscanearQR)
                const {data: insc} = await supabase
                    .from('inscripcionevento')
                    .select('*')
                    .eq('id_evento', evento_id)
                    .eq('id_usuario', usuarioId)
                    .maybeSingle();

                if (!insc) {
                    toast.error("❌ No estás inscrito en este evento.");
                    return;
                }

                // Verificar si ya tiene asistencia
                const {data: yaExiste} = await supabase
                    .from('asistencia')
                    .select('*')
                    .eq('id_evento', evento_id)
                    .eq('id_usuario', usuarioId)
                    .maybeSingle();

                if (yaExiste) {
                    toast.info("ℹ️ Ya registraste asistencia.");
                    return;
                }

                // Insertar asistencia
                const {error} = await supabase
                    .from('asistencia')
                    .insert({
                        id_evento: evento_id,
                        id_usuario: usuarioId,
                        fecha: new Date().toISOString().split("T")[0],
                    });

                if (error) throw error;

                toast.success("✅ Asistencia registrada correctamente");
                onAsistenciaRegistrada?.();
            } catch (err) {
                console.error(err);
                toast.error("QR inválido o error al registrar asistencia.");
            }
        };
    };

    return (
        <div className="mt-3">
            <label className="form-label fw-semibold">O subir imagen del QR:</label>
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="form-control"
            />
        </div>
    );
};

export default SubirQR;

