import React, { useEffect, useState } from "react";
import supabase from "../utils/supabaseClient";
import { toast } from "react-toastify";
import { enviarCertificadosParaTodos } from "../utils/enviarCertificados";
import Navbar from "../components/Navbar";

export default function PaginaCertificados() {
  const [eventos, setEventos] = useState([]);
  const [participantes, setParticipantes] = useState({});
  const [expandedEvento, setExpandedEvento] = useState(null);

  useEffect(() => {
    const fetchEventosFinalizados = async () => {
      const { data, error } = await supabase
        .from("evento")
        .select("id, nombre, id_tevento, tipoevento:tipoevento(nombre)")
        .eq("id_estado", 5);

      if (!error) setEventos(data);
    };
    fetchEventosFinalizados();
  }, []);

  const toggleExpand = async (eventoId) => {
    if (expandedEvento === eventoId) {
      setExpandedEvento(null);
      return;
    }
    setExpandedEvento(eventoId);
    const { data, error } = await supabase
      .from("inscripcionevento")
      .select("id_usuario")
      .eq("id_evento", eventoId);

    if (!error) {
      const participantesData = await Promise.all(
        data.map(async ({ id_usuario }) => {
          const { data: userData } = await supabase.rpc("datos_certificado", {
            id_usuario,
            id_evento: eventoId,
          });
          return userData?.[0]?.nombre || `Usuario ${id_usuario}`;
        })
      );
      setParticipantes((prev) => ({ ...prev, [eventoId]: participantesData }));
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <h2 className="mb-4 fw-bold text-primary">🎓 Enviar Certificados</h2>
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Evento</th>
                <th>Tipo Evento</th>
                <th>Participantes</th>
                <th style={{ width: "180px" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((evento) => (
                <tr key={evento.id}>
                  <td>{evento.nombre}</td>
                  <td>{evento.tipoevento?.nombre || "-"}</td>
                  <td>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => toggleExpand(evento.id)}
                    >
                      {expandedEvento === evento.id ? "Ocultar" : "Ver"} Participantes
                    </button>
                    {expandedEvento === evento.id && (
                      <ul className="mt-2 mb-0 ps-3">
                        {(participantes[evento.id] || []).map((nombre, idx) => (
                          <li key={idx}>{nombre}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-success"
                      onClick={() => handleEnviar(evento.id)}
                    >
                      Enviar certificados
                    </button>
                  </td>
                </tr>
              ))}
              {eventos.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center text-muted">
                    No hay eventos finalizados disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
