import React from 'react';
import {useNavigate} from 'react-router-dom';

const EventCard = ({evento}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/evento/${evento.id}`);
    };

    const formatearFecha = (fechaStr) => {
        if (!fechaStr) return null;
        const fecha = new Date(fechaStr);
        return isNaN(fecha) ? null : fecha.toLocaleDateString('es-BO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const fechaInicio = formatearFecha(evento.fechainicio);
    const fechaFin = formatearFecha(evento.fechafin);

    const descripcionLimitada = (texto, limite) => {
        if (!texto) return '';
        return texto.length > limite ? texto.slice(0, limite) + '...' : texto;
    };

    return (
        <div className="col" onClick={handleClick} style={{cursor: 'pointer'}}>
            <div className="card h-100 shadow-sm bg-white p-2 rounded-4 text-center">
                <img
                    src={evento.imagen_url || '/noDisponible.jpg'}
                    className="card-img-top"
                    alt={evento.nombre}
                    style={{objectFit: 'cover', height: '200px', borderRadius: '12px'}}
                />
                <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{evento.nombre}</h5>
                    <p className="card-text">
                        {descripcionLimitada(evento.descripcion, 200)}
                    </p>
                    {fechaInicio && fechaFin && (
                        <p className="text-muted small mb-0">
                            {fechaInicio} - {fechaFin}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventCard;
