import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import supabase from "../utils/supabaseClient";
import esLocale from "@fullcalendar/core/locales/es";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const diasMap = {
  1: 0, // domingo
  2: 1, // lunes
  3: 2, // martes
  4: 3, // miércoles
  5: 4, // jueves
  6: 5, // viernes
  7: 6, // sábado
};

export default function CalendarioEventos() {
  const [eventos, setEventos] = useState([]);
  const [proximos, setProximos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEventos = async () => {
      const { data: eventosData, error: err1 } = await supabase
        .from("evento")
        .select("id, nombre, fechainicio, fechafin");

      const { data: horarios, error: err2 } = await supabase
        .from("horarioevento")
        .select("id_evento, id_dia, id_horario_inicio(hora), id_horario_fin(hora)");

      if (err1 || err2) {
        console.error("Error cargando eventos u horarios:", err1 || err2);
        return;
      }

      const hoy = new Date();
      const eventosExpandido = [];
      const proximosRaw = [];

      for (const evento of eventosData) {
        const inicio = new Date(evento.fechainicio);
        const fin = new Date(evento.fechafin);
        const relacionados = horarios.filter((h) => h.id_evento === evento.id);

        for (const h of relacionados) {
          const diaSemana = diasMap[h.id_dia];
          const actual = new Date(inicio);

          while (actual <= fin) {
            if (actual.getDay() === diaSemana) {
              const fechaISO = actual.toISOString().split("T")[0];
              const horaInicio = h.id_horario_inicio.hora.slice(0, 5);
              const horaFin = h.id_horario_fin.hora.slice(0, 5);
              eventosExpandido.push({
                title: `${evento.nombre}\n${horaInicio} – ${horaFin}`,
                date: fechaISO,
                extendedProps: {
                  eventoId: evento.id
                }
              });

              if (actual >= hoy) {
                proximosRaw.push({
                  id: evento.id,
                  nombre: evento.nombre,
                  fecha: fechaISO,
                  horaInicio,
                  horaFin
                });
              }
            }
            actual.setDate(actual.getDate() + 1);
          }
        }
      }

      setEventos(eventosExpandido);
      setProximos(proximosRaw.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).slice(0, 5));
    };

    fetchEventos();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h2 className="fw-bold mb-3">📅 Calendario de Eventos</h2>
        <p className="text-muted mb-3" style={{ marginTop: "-8px" }}>
            Haz clic sobre un evento para ver más detalles.
        </p>

        <div className="row">
          <div className="col-md-8">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={esLocale}
              events={eventos}
              height="auto"
              eventContent={(arg) => {
                const [nombre, horario] = arg.event.title.split("\n");
                return (
                  <div style={{ whiteSpace: 'pre-line', fontSize: "0.85em" }}>
                    <strong>{nombre}</strong>
                    <div>{horario}</div>
                  </div>
                );
              }}
              eventClick={(info) => {
                const id = info.event.extendedProps.eventoId;
                if (id) navigate(`/evento/${id}`);
              }}
            />
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title fw-bold">📌 Próximos Eventos</h5>
                {proximos.length === 0 && <p className="text-muted">No hay eventos próximos.</p>}
                {proximos.map((ev, index) => (
                  <div key={index} className="card border mb-3">
                    <div className="card-body">
                      <h6 className="card-title fw-bold">{ev.nombre}</h6>
                      <p className="mb-1"><i className="bi bi-calendar-event" /> {ev.fecha}</p>
                      <p className="mb-1"><i className="bi bi-clock" /> {ev.horaInicio} – {ev.horaFin}</p>
                      <button
                        className="btn btn-dark btn-sm mt-2"
                        onClick={() => navigate(`/evento/${ev.id}`)}
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
