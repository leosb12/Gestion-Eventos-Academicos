import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { Card, Row, Col, ProgressBar, Form } from 'react-bootstrap';
import { UserAuth } from '../context/AuthContext.jsx';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js';

// Registro de los componentes necesarios de Chart.js
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

const Estadisticas = () => {
  const { id } = useParams();
  const { session, tipoUsuario } = UserAuth();
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(id || 'todos');
  const [estadisticas, setEstadisticas] = useState({
    numEquipos: 0,
    asistencia: 0,
    equiposCompletos: 0,
    proyectosRegistrados: 0,
    asistenciaPorcentaje: 0,
    numInscripciones: 0,
    promedioMiembros: 0,
    tieneEquipos: false,
    tieneProyectos: false,
    tipoEvento: null
  });

  // 1) Cargar lista de eventos (filtrando por organizador si toca)
useEffect(() => {
  const fetchEventos = async () => {
    try {
      let q = supabase.from('evento').select('*');

      if (tipoUsuario === 6) {
        const { data: usuario, error } = await supabase
          .from('usuario')
          .select('id')
          .eq('correo', session.user.email)
          .maybeSingle();

        if (error || !usuario) {
          toast.error('No se pudo obtener el ID del usuario autenticado');
          return;
        }

        q = q.eq('id_usuario_creador', usuario.id);
      }

      const { data, error } = await q;

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.warning('No hay eventos para mostrar');
      }

      setEventos(data || []);
    } catch (e) {
      console.error(e);
      toast.error('Error al obtener los eventos');
    }
  };

  fetchEventos();
}, [session.user.email, tipoUsuario]);

  // 2) Cargar todas las estadísticas cada vez que cambia eventoSeleccionado
useEffect(() => {
  const fetchEstadisticas = async () => {
    try {
      let idUsuarioNumerico = null;

      // Si es organizador, obtenemos su ID numérico desde la tabla usuario
      if (tipoUsuario === 6) {
  const { data: usuario, error } = await supabase
    .from('usuario')
    .select('id')
    .eq('correo', session.user.email)
    .maybeSingle();

  if (error || !usuario) {
    throw new Error('No se pudo obtener el ID del usuario autenticado');
  }

  idUsuarioNumerico = usuario.id;
}

      let numEquipos = 0;
      let asistencia = 0;
      let equiposCompletos = 0;
      let proyectosRegistrados = 0;
      let numInscripciones = 0;
      let tieneEquipos = false;
      let tieneProyectos = false;
      let asistenciaPorcentaje = 0;
      let promedioMiembros = 0;
      let tipoEvento = null;

      if (eventoSeleccionado === 'todos') {
  let q = supabase.from('evento').select('id, id_tevento');

  // ✅ si es organizador, obtener su ID numérico por correo
  if (tipoUsuario === 6) {
    const { data: usuario, error } = await supabase
      .from('usuario')
      .select('id')
      .eq('correo', session.user.email)
      .maybeSingle();

    if (error || !usuario) {
      console.error(error);
      toast.error('No se pudo obtener el ID del usuario autenticado');
      return;
    }

    q = q.eq('id_usuario_creador', usuario.id);
  }
        const { data: eventosData, error: errE } = await q;
        if (errE) throw errE;
        const idsEventos = (eventosData || []).map(e => e.id);

        if (idsEventos.length === 0) {
          setEstadisticas({
            numEquipos: 0,
            asistencia: 0,
            equiposCompletos: 0,
            proyectosRegistrados: 0,
            asistenciaPorcentaje: 0,
            numInscripciones: 0,
            promedioMiembros: 0,
            tieneEquipos: false,
            tieneProyectos: false,
            tipoEvento: null
          });
          return;
        }

        const { data: insc } = await supabase
          .from('inscripcionevento')
          .select('id_usuario')
          .in('id_evento', idsEventos);
        numInscripciones = insc?.length || 0;

        const { data: asis } = await supabase
          .from('asistencia')
          .select('id_usuario')
          .in('id_evento', idsEventos);
        asistencia = asis?.length || 0;

        const { data: eq } = await supabase
          .from('equipo')
          .select('id')
          .in('id_evento', idsEventos);
        numEquipos = eq?.length || 0;
        tieneEquipos = numEquipos > 0;

        const idsEquipos = eq?.map(e => e.id) || [];
        const { data: proj } = await supabase
  .from('proyecto')
  .select('id')
  .in('id_equipo', idsEquipos)
  .not('url_informe', 'is', null);
proyectosRegistrados = proj?.length || 0;
tieneProyectos = proyectosRegistrados > 0;

        const { data: md } = await supabase
          .from('miembrosequipo')
          .select('id_equipo')
          .in('id_equipo', idsEquipos);
        const miembrosData = md || [];
        if (miembrosData.length) {
          const counts = {};
          miembrosData.forEach(({ id_equipo }) => {
            counts[id_equipo] = (counts[id_equipo] || 0) + 1;
          });
          equiposCompletos = Object.values(counts).filter(c => c === 6).length;
          promedioMiembros = parseFloat((miembrosData.length / numEquipos).toFixed(2));
        }

      } else {
        const { data: ev } = await supabase
          .from('evento')
          .select('id_tevento, id_usuario_creador')
          .eq('id', eventoSeleccionado)
          .maybeSingle();

        if (!ev) throw new Error('Evento no encontrado');

        if (tipoUsuario === 6 && ev.id_usuario_creador !== idUsuarioNumerico) {
          toast.error('No tienes permiso para ver este evento');
          return;
        }

        tipoEvento = ev?.id_tevento || null;

        const { data: insc } = await supabase
          .from('inscripcionevento')
          .select('id_usuario')
          .eq('id_evento', eventoSeleccionado);
        numInscripciones = insc?.length || 0;

        const { data: asis } = await supabase
          .from('asistencia')
          .select('id_usuario')
          .eq('id_evento', eventoSeleccionado);
        asistencia = asis?.length || 0;

        if (tipoEvento === 2 || tipoEvento === 4) {
          const { data: eq } = await supabase
            .from('equipo')
            .select('id')
            .eq('id_evento', eventoSeleccionado);
          const idsEquipos = eq?.map(e => e.id) || [];
          numEquipos = idsEquipos.length;
          tieneEquipos = numEquipos > 0;

const { data: proj } = await supabase
  .from('proyecto')
  .select('id')
  .in('id_equipo', idsEquipos)
  .not('url_informe', 'is', null);
proyectosRegistrados = proj?.length || 0;
tieneProyectos = proyectosRegistrados > 0;

          const { data: md } = await supabase
            .from('miembrosequipo')
            .select('id_equipo')
            .in('id_equipo', idsEquipos);
          const miembrosData = md || [];
          if (miembrosData.length) {
            const counts = {};
            miembrosData.forEach(({ id_equipo }) => {
              counts[id_equipo] = (counts[id_equipo] || 0) + 1;
            });
            equiposCompletos = Object.values(counts).filter(c => c === 6).length;
            promedioMiembros = parseFloat((miembrosData.length / numEquipos).toFixed(2));
          }
        }
      }

      asistenciaPorcentaje = numInscripciones
        ? parseFloat(((asistencia / numInscripciones) * 100).toFixed(2))
        : 0;

      if (tipoEvento === 2 || tipoEvento === 4 || eventoSeleccionado === 'todos') {
        tieneProyectos = true;
        proyectosRegistrados = proyectosRegistrados || 0;
      }

      setEstadisticas({
        numEquipos,
        asistencia,
        equiposCompletos,
        proyectosRegistrados,
        asistenciaPorcentaje,
        numInscripciones,
        promedioMiembros,
        tieneEquipos,
        tieneProyectos,
        tipoEvento
      });
    } catch (err) {
      console.error(err);
      toast.error('Error cargando estadísticas');
    }
  };

  fetchEstadisticas();
}, [eventoSeleccionado, session.user.id, tipoUsuario]);

  // Datos para los gráficos de pastel
  const asistenciaData = {
    labels: ['Asistencia', 'No Asistencia'],
    datasets: [{
      data: [estadisticas.asistenciaPorcentaje, 100 - estadisticas.asistenciaPorcentaje],
      backgroundColor: ['#36A2EB', '#FF6384'],
    }],
  };

  const completos = estadisticas.equiposCompletos;
  const incompletos = estadisticas.numEquipos - estadisticas.equiposCompletos;

const equiposCompletosData = {
  labels: ['Completos', 'Incompletos'],
  datasets: [{
    data: (completos === 0 && incompletos === 0)
      ? [0, 1] // Evita que el gráfico se rompa: muestra todo como incompletos
      : [completos, incompletos],
    backgroundColor: ['#4BC0C0', '#FF6384'],
  }],
};


  return (
    <>
      <Navbar />
      <div className="container">
        <h1 className="my-4">Estadísticas de Evento</h1>

        <Form.Group className="mb-4">
          <Form.Label>Seleccionar Evento</Form.Label>
          <Form.Control
            as="select"
            value={eventoSeleccionado}
            onChange={e => setEventoSeleccionado(e.target.value)}
          >
            <option value="todos">Todos los eventos</option>
            {eventos.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.nombre}</option>
            ))}
          </Form.Control>
        </Form.Group>

        <Row className="justify-content-center">
          {/* Total Inscripciones y Asistencia Total */}
          <Col md={6} className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>Total Inscripciones</Card.Title>
                <Card.Text>{estadisticas.numInscripciones} inscripciones</Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>Asistencia Total</Card.Title>
                <Card.Text>{estadisticas.asistencia} personas</Card.Text>
              </Card.Body>
            </Card>
          </Col>

          {/* Gráficos de Asistencia */}
          <Col md={6} className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>Porcentaje de Asistencia</Card.Title>
                <Card.Text>{estadisticas.asistenciaPorcentaje}%</Card.Text>
                <ProgressBar
                  now={estadisticas.asistenciaPorcentaje}
                  label={`${estadisticas.asistenciaPorcentaje}%`}
                />
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Pie data={asistenciaData} />
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Equipos Completos y Total Equipos */}
          {(estadisticas.tipoEvento === 2 || estadisticas.tipoEvento === 4 || eventoSeleccionado === 'todos') && (
  <>
    <Col md={6} className="mb-4">
      <Card>
        <Card.Body>
          <Card.Title>Equipos Completos</Card.Title>
          <Card.Text>{estadisticas.equiposCompletos} equipos completos</Card.Text>
          <ProgressBar
            now={
              estadisticas.numEquipos > 0
                ? (estadisticas.equiposCompletos / estadisticas.numEquipos) * 100
                : 0
            }
            label={
              estadisticas.numEquipos > 0
                ? `${Math.round((estadisticas.equiposCompletos / estadisticas.numEquipos) * 100)}%`
                : '0%'
            }
          />
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Pie data={equiposCompletosData} />
          </div>
        </Card.Body>
      </Card>
    </Col>

    <Col md={6} className="mb-4">
      <Card>
        <Card.Body>
          <Card.Title>Total Equipos</Card.Title>
          <Card.Text>{estadisticas.numEquipos} equipos</Card.Text>
        </Card.Body>
      </Card>
    </Col>
  </>
)}
         {/* Promedio de Integrantes por Equipo */}
          {(estadisticas.tipoEvento === 2 || estadisticas.tipoEvento === 4 || eventoSeleccionado === 'todos') && (
            <Col md={6} className="mb-4">
              <Card>
                <Card.Body>
                  <Card.Title>Promedio de Integrantes por Equipo</Card.Title>
                  <Card.Text>{estadisticas.promedioMiembros} integrantes</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          )}
          {/* Proyectos Registrados */}
          {estadisticas.tieneProyectos && (
            <Col md={6} className="mb-4">
              <Card>
                <Card.Body>
                  <Card.Title>Proyectos Con Informe</Card.Title>
                  <Card.Text>{estadisticas.proyectosRegistrados || 0} proyectos</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>

        <ToastContainer />
      </div>
    </>
  );
};

export default Estadisticas;
