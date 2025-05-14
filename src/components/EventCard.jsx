import React from 'react'

const EventCard = ({ evento }) => (
  <div className="col">
    <div className="card h-100 shadow-sm">
      {evento.imagen_url && (
        <img
          src={evento.imagen_url}
          className="card-img-top"
          alt={evento.nombre}
          style={{ objectFit: 'cover', height: '200px' }}
        />
      )}
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{evento.nombre}</h5>
      </div>
    </div>
  </div>
)

export default EventCard
