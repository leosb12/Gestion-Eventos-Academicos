import React, {useEffect, useRef, useState} from 'react';
import {Html5Qrcode} from 'html5-qrcode';
import {toast} from 'react-toastify';
import supabase from '../utils/supabaseClient';

const EscanearQR = ({usuarioId, onAsistenciaRegistrada}) => {
    const html5QrCodeRef = useRef(null);
    const [scannerDetenido, setScannerDetenido] = useState(false);

    useEffect(() => {
        const iniciarScanner = async () => {
            if (!html5QrCodeRef.current) {
                html5QrCodeRef.current = new Html5Qrcode("qr-reader");
            }

            try {
                await html5QrCodeRef.current.start(
                    {facingMode: "environment"},
                    {fps: 10, qrbox: {width: 250, height: 250}},
                    async (decodedText) => {
                        try {
                            const data = JSON.parse(decodedText);
                            const evento_id = data.evento_id;

                            const {data: insc} = await supabase
                                .from('inscripcionevento')
                                .select('*')
                                .eq('id_evento', evento_id)
                                .eq('id_usuario', usuarioId)
                                .maybeSingle();

                            if (!insc) {
                                toast.error("No estás inscrito en este evento.");
                                return;
                            }

                            const {data: yaExiste} = await supabase
                                .from('asistencia')
                                .select('*')
                                .eq('id_evento', evento_id)
                                .eq('id_usuario', usuarioId)
                                .maybeSingle();

                            if (yaExiste) {
                                toast.info("Ya registraste asistencia.");
                                return;
                            }

                            const {error} = await supabase
                                .from('asistencia')
                                .insert({
                                    id_evento: evento_id,
                                    id_usuario: usuarioId,
                                    fecha: new Date().toISOString().split("T")[0],
                                });

                            if (error) throw error;

                            toast.success("✅ Asistencia registrada correctamente");

                            await html5QrCodeRef.current.stop();
                            setScannerDetenido(true); // ✅
                            setTimeout(() => {
                                onAsistenciaRegistrada?.(); // ✅
                            }, 100);
                        } catch (err) {
                            toast.error("QR inválido o error al registrar.");
                            console.error(err);
                        }
                    }
                );
            } catch (error) {
                console.error("Error al iniciar la cámara:", error);
                const dispositivos = await Html5Qrcode.getCameras().catch(() => []);
                if (!dispositivos || dispositivos.length === 0) {
                    toast.error("No se encontró ninguna cámara disponible.");
                }
            }
        };

        iniciarScanner();

        return () => {
            if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch(() => {
                });
            }
        };
    }, [usuarioId]);

    return !scannerDetenido ? (
        <div id="qr-reader" style={{width: "100%"}}/>
    ) : null;
};

export default EscanearQR;


