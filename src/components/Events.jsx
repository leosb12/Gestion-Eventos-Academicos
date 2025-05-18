import React, {useEffect, useState} from 'react';
import supabase from '../utils/supabaseClient.js';
import EventCard from './EventCard.jsx';
import {toast} from 'react-toastify';

const Events = () => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        const {data, error} = await supabase
            .from('evento')
            .select('id, nombre, descripcion, imagen_url, fechainicio, fechafin')

            .order('fechainicio', {ascending: true});

        if (!error) {
            setEvents(data);
        } else {
            toast.error('Error al cargar los eventos');
        }
    };

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
