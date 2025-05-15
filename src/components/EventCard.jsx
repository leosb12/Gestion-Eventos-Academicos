import React from 'react'
import { useNavigate } from 'react-router-dom'

const EventCard = ({ evento }) => {
const navigate = useNavigate()

const handleClick = () => {
    navigate(`/evento/${evento.id}`)
  }

return (
    <div className="col" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className="card h-100 shadow-sm bg-white p-2 rounded-5 text-center">
        <img
          src={evento.imagen_url || '/noDisponible.jpg'}
          className="card-img-top"
          alt={evento.nombre}
          style={{ objectFit: 'cover', height: '200px' }}
        />
        <div className="card-body d-flex flex-column">
          <h5 className="card-title">{evento.nombre}</h5>
        </div>
      </div>
    </div>
  )
}

export default EventCard
