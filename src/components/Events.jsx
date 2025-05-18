import React, {useEffect, useState} from 'react';
import supabase from '../utils/supabaseClient.js';
import EventCard from './EventCard.jsx';
import {toast} from 'react-toastify';

const Events = ({filtros}) => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchEventos = async () => {
            let query = supabase.from('evento').select('id, nombre, descripcion, imagen_url, fechainicio, fechafin');

            if (filtros.categoria) query = query.eq('id_tevento', filtros.categoria);
            if (filtros.ubicacion) query = query.eq('id_ubicacion', filtros.ubicacion);
            if (filtros.fechaInicio) query = query.gte('fechainicio', filtros.fechaInicio);
            if (filtros.fechaFin) query = query.lte('fechafin', filtros.fechaFin);

            const {data, error} = await query;

            if (!error) {
                setEvents(data);
            } else {
                toast.error('Error al cargar los eventos');
            }
        };

        fetchEventos();
    }, [filtros]); // ✅ se actualiza cuando cambia algún filtro

    return (
        <section className="container my-5">
            <div className="row row-cols-1 row-cols-md-3 g-4">
                {events.map(evt => (
                    <EventCard key={evt.id} evento={evt}/>
                ))}
            </div>
        </section>
    );
};

export default Events;
