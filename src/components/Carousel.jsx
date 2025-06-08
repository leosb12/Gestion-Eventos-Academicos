// src/components/Carousel.jsx
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../utils/supabaseClient'

const Carousel = () => {
  const [imagenes, setImagenes] = useState([])

  useEffect(() => {
    const fetchImagenes = async () => {
      const { data, error } = await supabase
        .from('carousel')
        .select('evento_id, evento (imagen_url, nombre)')
        .order('created_at', { ascending: true })

      if (!error && data) {
        setImagenes(data)
        // preload
        data.forEach(item => {
          const img = new Image()
          img.src = item.evento.imagen_url
        })
      }
    }
    fetchImagenes()
  }, [])

  return (
    <div id="carouselExample" className="carousel slide" data-bs-ride="carousel">
      {/* indicadores */}
      <div className="carousel-indicators">
        {imagenes.map((_, i) => (
          <button
            key={i}
            type="button"
            data-bs-target="#carouselExample"
            data-bs-slide-to={i}
            className={i === 0 ? 'active' : ''}
            aria-current={i === 0}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* slides */}
      <div className="carousel-inner">
        {imagenes.map((item, i) => (
          <div
            key={item.evento_id}
            className={`carousel-item${i === 0 ? ' active' : ''}`}
          >
            <Link to={`/evento/${item.evento_id}`} className="d-block">
              <img
                src={item.evento.imagen_url}
                srcSet={`
                  ${item.evento.imagen_url}?w=600 600w,
                  ${item.evento.imagen_url}?w=800 800w,
                  ${item.evento.imagen_url}?w=1400 1400w,
                  ${item.evento.imagen_url}?w=2000 2000w
                `}
                sizes="(max-width: 576px) 100vw,
                       (max-width: 768px) 100vw,
                       100vw"
                className="d-block carousel-img"
                alt={item.evento.nombre}
                loading="lazy"
              />
            </Link>
            <div className="carousel-caption d-none d-md-block">
              <h5>{item.evento.nombre}</h5>
            </div>
          </div>
        ))}
      </div>

      {/* controles prev/next */}
      <button
        className="carousel-control-prev"
        type="button"
        data-bs-target="#carouselExample"
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true" />
        <span className="visually-hidden">Anterior</span>
      </button>
      <button
        className="carousel-control-next"
        type="button"
        data-bs-target="#carouselExample"
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true" />
        <span className="visually-hidden">Siguiente</span>
      </button>
    </div>
  )
}

export default Carousel
