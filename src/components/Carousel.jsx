import React, {useEffect, useState} from 'react';
import supabase from '../utils/supabaseClient';
import {Link} from 'react-router-dom';


const Carousel = () => {
    const [imagenes, setImagenes] = useState([]);

    useEffect(() => {
        const fetchImagenesCarrusel = async () => {
            const {data, error} = await supabase
                .from('carousel')
                .select('evento_id, evento (imagen_url, nombre)')
                .order('created_at', {ascending: true});

            if (error) {
                console.error('Error al obtener carrusel:', error);
            } else {
                setImagenes(data);
            }
        };

        fetchImagenesCarrusel();
    }, []);

    return (
        <div
            id="carouselExample"
            className="carousel slide"
            data-bs-ride="carousel"
            style={{maxWidth: '100%', margin: '0 auto'}}
        >
            <div className="carousel-inner">
                {imagenes.map((item, index) => (
                    <div
                        key={item.evento_id}
                        className={`carousel-item ${index === 0 ? 'active' : ''}`}
                        data-bs-interval="3000"
                    >
                        <Link to={`/evento/${item.evento_id}`}>
                            <img
                                src={item.evento.imagen_url}
                                className="d-block w-100"
                                style={{height: '400px', objectFit: 'cover'}}
                                alt={`Imagen del evento`}
                            />
                        </Link>
                        <div className="carousel-caption d-none d-md-block bg-dark bg-opacity-50 rounded p-2">
                            <h5>{item.evento.nombre}</h5>
                        </div>
                    </div>
                ))}

            </div>

            <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#carouselExample"
                data-bs-slide="prev"
            >
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Anterior</span>
            </button>
            <button
                className="carousel-control-next"
                type="button"
                data-bs-target="#carouselExample"
                data-bs-slide="next"
            >
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Siguiente</span>
            </button>
        </div>
    );
};

export default Carousel;
