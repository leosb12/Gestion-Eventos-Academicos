import React from 'react'

const HorarioCard = ({ dia, horaInicio, horaFin, modalidad }) => {
  return (
    <div className="col-12 col-sm-6 col-md-3">
      <div className="card text-center shadow-sm p-3">
        <div className="card-body">
          <h6 className="card-title">{dia}</h6>
          <p className="text-muted">{horaInicio} - {horaFin}</p>
          <p className="mb-1">{modalidad}</p>
        </div>
      </div>
    </div>
  )
}

export default HorarioCard
