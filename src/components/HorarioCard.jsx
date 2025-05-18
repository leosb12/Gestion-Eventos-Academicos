import React from 'react';

const HorarioCard = ({ dia, horaInicio, horaFin, modalidad }) => {
  return (
    <div className="col-12">
      <div className="border rounded-4 p-3 shadow-sm bg-light">
        <p className="mb-1">
          <strong>📅 Día:</strong> {dia}
        </p>
        <p className="mb-1">
          <strong>🕐 Horario:</strong> {horaInicio} a {horaFin}
        </p>
        <p className="mb-0">
          <strong>🎓 Modalidad:</strong> {modalidad}
        </p>
      </div>
    </div>
  );
};

export default HorarioCard;
