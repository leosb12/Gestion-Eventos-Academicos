import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';

const EventosPorTipo = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [eventos, setEventos] = useState([]);
    const [tipoNombre, setTipoNombre] = useState('');

    useEffect(() => {
        const fetchEventosPorTipo = async () => {
            const {data: tipoData} = await supabase
                .from('tipoevento')
                .select('nombre')
                .eq('id', id)
                .single();
            if (tipoData) setTipoNombre(tipoData.nombre);

            const {data: eventosData} = await supabase
                .from('evento')
                .select('*')
                .eq('id_tevento', id);
            if (eventosData) setEventos(eventosData);
        };

        fetchEventosPorTipo();
    }, [id]);

    const formatearFecha = (fechaStr) => {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-BO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <>
            <Navbar/>
            <div className="container my-4">
                <h2 className="mb-4">Categoría: {tipoNombre}</h2>
                {eventos.length === 0 ? (
                    <p>No hay eventos disponibles de esta categoría.</p>
                ) : (
                    <div className="row row-cols-1 row-cols-md-3 g-4">
                        {eventos.map((evento) => (
                            <div key={evento.id} className="col">
                                <div
                                    className="card h-100 shadow-sm border-0"
                                    onClick={() => navigate(`/evento/${evento.id}`)}
                                    style={{cursor: 'pointer', borderRadius: '20px'}}
                                >
                                    <img
                                        src={
                                            evento.imagen_url
                                                ? evento.imagen_url
                                                : 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/480px-No_image_available.svg.png'
                                        }
                                        className="card-img-top"
                                        alt={`Imagen de ${evento.nombre}`}
                                        style={{
                                            height: '200px',
                                            objectFit: 'cover',
                                            borderTopLeftRadius: '20px',
                                            borderTopRightRadius: '20px'
                                        }}
                                    />
                                    <div className="card-body text-center">
                                        <h5 className="card-title">{evento.nombre}</h5>
                                        <p className="card-text">{evento.descripcion}</p>
                                        <p className="text-muted small">
                                            {formatearFecha(evento.fechainicio)} - {formatearFecha(evento.fechafin)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default EventosPorTipo;
