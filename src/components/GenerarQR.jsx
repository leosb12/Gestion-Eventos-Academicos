import React, {useRef} from 'react';
import QRCode from 'react-qr-code'; // ✅ Librería correcta

const GenerarQR = ({eventoId}) => {
    const qrRef = useRef();

    const payload = JSON.stringify({
        evento_id: eventoId,
        timestamp: new Date().toISOString()
    });

    const descargarQR = () => {
        const svg = qrRef.current;
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const img = new Image();
        const svgBlob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);

            const pngUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = pngUrl;
            link.download = `qr_evento_${eventoId}.png`;
            link.click();
        };

        img.src = url;
    };

    return (
        <div className="text-center mt-3">
            <h5 className="fw-bold">QR de Asistencia</h5>
            <div className="bg-white p-3 rounded" style={{display: 'inline-block'}}>
                <QRCode ref={qrRef} value={payload} size={256}/>
            </div>
            <p className="text-muted mt-2">Escanéalo para registrar asistencia</p>
            <button onClick={descargarQR} className="btn btn-outline-primary mt-2">
                Descargar QR
            </button>
        </div>
    );
};

export default GenerarQR;



