import React from 'react';

const Horario = ({ horarios }) => {
  return (
    <div className="mt-4">
      <h4 className="fw-bold text-center">Horarios del Evento</h4>
      {horarios.length === 0 ? (
        <p className="text-center text-muted">No hay horarios disponibles.</p>
      ) : (
        <ul className="list-group list-group-flush">
          {horarios.map((bloque, i) => (
            <li key={i} className="list-group-item text-center">
              📅 {bloque.dia?.nombre || '-'} — 🕐 {bloque.inicio?.hora || '-'} a {bloque.fin?.hora || '-'} — Modalidad: {bloque.modalidad?.nombre || '-'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Horario;
