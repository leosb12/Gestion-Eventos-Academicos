import React from 'react';
import {useNavigate} from 'react-router-dom';

const EventCard = ({evento}) => {
    const navigate = useNavigate();

    console.log("🟦 Evento desde padre:", evento);

    const handleClick = () => {
        navigate(`/evento/${evento.id}`);
    };

    const formatearFecha = (fechaStr) => {
        if (!fechaStr) return '';
        const [year, month, day] = fechaStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const fechaInicio = formatearFecha(evento.fechainicio);
    const fechaFin = formatearFecha(evento.fechafin);

    const descripcionLimitada = (texto, limite) => {
        if (!texto) return '';
        return texto.length > limite ? texto.slice(0, limite) + '...' : texto;
    };

    const estadoColor = {
        1: 'success',
        2: 'secondary',
        3: 'info',
        4: 'primary',
        5: 'dark',
        6: 'danger'
    };

    const estadoNombre = {
        1: 'Inscripción Abierta',
        2: 'Inscripción Cerrada',
        3: 'Próximamente',
        4: 'En Curso',
        5: 'Finalizado',
        6: 'Cancelado'
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
                        {descripcionLimitada(evento.descripcion, 100)}
                    </p>
                    {fechaInicio && fechaFin && (
                        <p className="text-muted small mb-1">
                            {fechaInicio} - {fechaFin}
                        </p>
                    )}
                    {evento.id_estado && (
                        <div className="d-flex justify-content-center mt-2">
    <span className={`px-3 py-1 rounded-pill text-white bg-${estadoColor[evento.id_estado]}`}
          style={{fontSize: '0.85rem', fontWeight: 500}}>
      {estadoNombre[evento.id_estado] || 'Desconocido'}
    </span>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default EventCard;
