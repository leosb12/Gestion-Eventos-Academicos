import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import supabase from '../utils/supabaseClient';

const Carousel = () => {
    const [imagenes, setImagenes] = useState([]);

    useEffect(() => {
        const fetchImagenesCarrusel = async () => {
            const {data, error} = await supabase
                .from('carousel')
                .select('evento_id, evento (imagen_url, nombre)')
                .order('created_at', {ascending: true});

            if (!error && data) {
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
            style={{
                maxWidth: '100%',
                height: '400px',
                overflow: 'hidden',
                margin: '0 auto'
            }}
        >
            <div className="carousel-inner h-100">
                {imagenes.map((item, index) => (
                    <div
                        key={item.evento_id}
                        className={`carousel-item h-100 ${index === 0 ? 'active' : ''}`}
                        data-bs-interval="3000"
                        style={{position: 'relative'}}
                    >
                        <Link to={`/evento/${item.evento_id}`}>
                            <img
                                src={item.evento.imagen_url}
                                className="d-block w-100 h-100"
                                style={{objectFit: 'cover'}}
                                alt="Imagen del evento"
                            />
                            {/* ✅ Texto centrado en medio de la imagen */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    background: 'rgba(0, 0, 0, 0.5)',
                                    color: 'white',
                                    padding: '10px 20px',
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    textShadow: '2px 2px 4px black',
                                    borderRadius: '8px',
                                }}
                            >
                                {item.evento.nombre}
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

            {/* Controles del carrusel */}
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
