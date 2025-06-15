import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { Card, Row, Col, ProgressBar, Form } from 'react-bootstrap';
import { UserAuth } from '../context/AuthContext.jsx';

const Estadisticas = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
    tieneEquipos: false,
    tieneProyectos: false,
    tipoEvento: null
  });

  // Obtener eventos
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        let query = supabase.from('evento').select('*');
        if (tipoUsuario === 6) { // Organizador, solo sus eventos
          query = query.eq('id_usuario_creador', session.user.id);
        }

        const { data, error } = await query;

        if (error) {
          toast.error('Error al obtener los eventos');
          console.error(error);
        } else {
          setEventos(data || []); // Asegúrate de que sea un array
          console.log('Eventos:', data); // Imprimir eventos para verificar
          if (data.length === 0) {
            toast.warning('No hay eventos para mostrar');
          }
        }
      } catch (error) {
        toast.error('Ocurrió un error al cargar los eventos');
        console.error(error);
      }
    };

    fetchEventos();
  }, [tipoUsuario, session.user.id]);

  // Obtener estadísticas
  useEffect(() => {
  const fetchEstadisticas = async () => {
    try {
      let numEquipos = 0;
      let asistencia = 0;
      let equiposCompletos = 0;
      let proyectosRegistrados = 0;
      let asistenciaPorcentaje = 0;
      let numInscripciones = 0;
      let tieneEquipos = false;
      let tieneProyectos = false;
      let tipoEvento = null;

      if (eventoSeleccionado === 'todos') {
        const { data: eventosData, error } = await supabase
          .from('evento')
          .select('id, id_tevento');

        if (error) throw error;

        const ids = eventosData.map(e => e.id);
        const tipos = eventosData.map(e => e.id_tevento);

        const isGrupo = tipos.some(t => t === 2 || t === 4);

        // Total inscripciones
        const { data: inscripciones } = await supabase
          .from('inscripcionevento')
          .select('id_usuario')
          .in('id_evento', ids);
        numInscripciones = inscripciones?.length || 0;

        // Total asistencia
        const { data: asistencias } = await supabase
          .from('asistencia')
          .select('id_usuario')
          .in('id_evento', ids);
        asistencia = asistencias?.length || 0;

        // Equipos
        const { data: equipos } = await supabase
          .from('equipo')
          .select('id')
          .in('id_evento', ids);
        numEquipos = equipos?.length || 0;
        tieneEquipos = numEquipos > 0;

        // Proyectos
        const { data: proyectos } = await supabase
          .from('proyecto')
          .select('id')
          .eq('id_estado', 4)
          .in('id_evento', ids);
        proyectosRegistrados = proyectos?.length || 0;
        tieneProyectos = proyectosRegistrados > 0;

        // Equipos completos
        const { data: miembros } = await supabase
          .from('miembrosequipo')
          .select('id_equipo')
          .in('id_evento', ids);

        if (miembros) {
          const conteo = {};
          miembros.forEach(({ id_equipo }) => {
            conteo[id_equipo] = (conteo[id_equipo] || 0) + 1;
          });
          equiposCompletos = Object.values(conteo).filter(n => n === 6).length;
        }

        asistenciaPorcentaje = numInscripciones > 0
 ? parseFloat(((asistencia / numInscripciones) * 100).toFixed(2))
  : 0;

        tipoEvento = null; // importante para evitar filtrado por tipo individual

      } else {
        const { data: eventoData } = await supabase
          .from('evento')
          .select('id_tevento')
          .eq('id', eventoSeleccionado)
          .maybeSingle();

        tipoEvento = eventoData?.id_tevento || null;

        const { data: inscripciones } = await supabase
          .from('inscripcionevento')
          .select('id_usuario')
          .eq('id_evento', eventoSeleccionado);
        numInscripciones = inscripciones?.length || 0;

        const { data: asistencias } = await supabase
          .from('asistencia')
          .select('id_usuario')
          .eq('id_evento', eventoSeleccionado);
        asistencia = asistencias?.length || 0;

        if (tipoEvento === 2 || tipoEvento === 4) {
          const { data: proyectos } = await supabase
            .from('proyecto')
            .select('id')
            .eq('id_evento', eventoSeleccionado)
            .eq('id_estado', 4);
          proyectosRegistrados = proyectos?.length || 0;
          tieneProyectos = proyectosRegistrados > 0;

          const { data: miembros } = await supabase
            .from('miembrosequipo')
            .select('id_equipo')
            .eq('id_evento', eventoSeleccionado);

          if (miembros) {
            const conteo = {};
            miembros.forEach(({ id_equipo }) => {
              conteo[id_equipo] = (conteo[id_equipo] || 0) + 1;
            });
            equiposCompletos = Object.values(conteo).filter(n => n === 6).length;
          }

          const { data: equipos } = await supabase
            .from('equipo')
            .select('id')
            .eq('id_evento', eventoSeleccionado);
          numEquipos = equipos?.length || 0;
          tieneEquipos = numEquipos > 0;
        }

        asistenciaPorcentaje = numInscripciones > 0
? parseFloat(((asistencia / numInscripciones) * 100).toFixed(2))
  : 0;

      }

      setEstadisticas({
        numEquipos,
        asistencia,
        equiposCompletos,
        proyectosRegistrados,
        asistenciaPorcentaje,
        numInscripciones,
        tieneEquipos,
        tieneProyectos,
        tipoEvento,
      });

    } catch (error) {
      toast.error('Error cargando estadísticas');
      console.error(error);
    }
  };

  fetchEstadisticas();
}, [eventoSeleccionado]);

  // Función para manejar el cambio de evento seleccionado
  const handleChangeEvento = (e) => {
    setEventoSeleccionado(e.target.value);
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 className="my-4">Estadísticas del Evento</h1>

        <Form.Group className="mb-4">
          <Form.Label>Seleccionar Evento</Form.Label>
          <Form.Control as="select" value={eventoSeleccionado} onChange={handleChangeEvento}>
            <option value="todos">Todos los eventos</option>
            {eventos.map((evento) => (
              <option key={evento.id} value={evento.id}>
                {evento.nombre}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        <Row>
          <Col md={4} className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>Total Inscripciones</Card.Title>
                <Card.Text>{estadisticas.numInscripciones} inscripciones</Card.Text>
              </Card.Body>
            </Card>
          </Col>

            {(eventoSeleccionado === 'todos' || estadisticas.tipoEvento === 2 || estadisticas.tipoEvento === 4) && (
  <>
    {/* Equipos */}
    {estadisticas.tieneEquipos && (
      <Col md={4} className="mb-4">
        <Card>
          <Card.Body>
            <Card.Title>Número de Equipos</Card.Title>
            <Card.Text>{estadisticas.numEquipos}</Card.Text>
          </Card.Body>
        </Card>
      </Col>
    )}

    {/* Equipos Completos */}
    {estadisticas.tieneEquipos && (
      <Col md={4} className="mb-4">
        <Card>
          <Card.Body>
            <Card.Title>Equipos Completos</Card.Title>
            <Card.Text>{estadisticas.equiposCompletos} equipos completos</Card.Text>
            <ProgressBar
              now={(estadisticas.equiposCompletos / estadisticas.numEquipos) * 100}
              label={`${Math.round((estadisticas.equiposCompletos / estadisticas.numEquipos) * 100)}%`}
            />
          </Card.Body>
        </Card>
      </Col>
    )}

    {/* Proyectos */}
    {estadisticas.tieneProyectos && (
      <Col md={4} className="mb-4">
        <Card>
          <Card.Body>
            <Card.Title>Proyectos Registrados</Card.Title>
            <Card.Text>{estadisticas.proyectosRegistrados} proyectos</Card.Text>
          </Card.Body>
        </Card>
      </Col>
    )}
  </>
)}

          <Col md={4} className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>Asistencia Total</Card.Title>
                <Card.Text>{estadisticas.asistencia} personas</Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4} className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>Porcentaje de Asistencia</Card.Title>
                <Card.Text>{estadisticas.asistenciaPorcentaje}%</Card.Text>
                <ProgressBar
                  now={estadisticas.asistenciaPorcentaje}
                  label={`${estadisticas.asistenciaPorcentaje}%`}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <ToastContainer />
      </div>
    </>
  );
};

export default Estadisticas;
