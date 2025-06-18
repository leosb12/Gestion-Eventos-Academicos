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

      const eventosExpandido = [];

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
            }
            actual.setDate(actual.getDate() + 1);
          }
        }
      }

      setEventos(eventosExpandido);
    };

    fetchEventos();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h2 className="fw-bold mb-3">📅 Calendario de Eventos</h2>
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
    </>
  );
}
