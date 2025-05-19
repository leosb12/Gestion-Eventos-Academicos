import React, {useEffect, useState} from 'react';
import supabase from '../utils/supabaseClient';
import {UserAuth} from '../context/AuthContext';
import EventCard from '../components/EventCard';
import Navbar from '../components/Navbar';
import {toast} from 'react-toastify';

const EventosInscritos = () => {
    const {user} = UserAuth();
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEventosInscritos = async () => {
            if (!user || !user.email) return;

            // Paso 1: buscar el ID real del usuario en la tabla 'usuario'
            const {data: usuarioData, error: usuarioError} = await supabase
                .from('usuario')
                .select('id')
                .eq('correo', user.email)
                .maybeSingle();

            if (usuarioError || !usuarioData) {
                toast.error('No se pudo obtener el usuario.');
                setLoading(false);
                return;
            }

            const usuarioId = usuarioData.id;

            // Paso 2: obtener inscripciones a eventos de ese usuario
            const {data: inscripciones, error: inscripcionError} = await supabase
                .from('inscripcionevento')
                .select('id_evento')
                .eq('id_usuario', usuarioId);

            if (inscripcionError) {
                toast.error('Error al obtener inscripciones.');
                setLoading(false);
                return;
            }

            const idsEventos = inscripciones.map(ins => ins.id_evento);

            if (idsEventos.length === 0) {
                setEventos([]);
                setLoading(false);
                return;
            }

            // Paso 3: buscar eventos
            const {data: eventosData, error: eventosError} = await supabase
                .from('evento')
                .select('*')
                .in('id', idsEventos);

            if (eventosError) {
                toast.error('Error al obtener eventos.');
            } else {
                setEventos(eventosData);
            }

            setLoading(false);
        };

        fetchEventosInscritos();
    }, [user]);

    return (
        <>
            <Navbar/>
            <div className="container my-5">
                <h2 className="mb-4">Eventos Inscritos</h2>
                {loading ? (
                    <p>Cargando eventos...</p>
                ) : eventos.length === 0 ? (
                    <p>No estás inscrito en ningún evento.</p>
                ) : (
                    <div className="row row-cols-1 row-cols-md-3 g-4">
                        {eventos.map(evento => (
                            <EventCard key={evento.id} evento={evento}/>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default EventosInscritos;
