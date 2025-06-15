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
    tieneProyectos: false
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

      // Si es "todos los eventos"
      if (eventoSeleccionado === 'todos') {
        const { data: eventosData, error } = await supabase
          .from('evento')
          .select('id, id_tevento'); // Incluimos id_tevento para verificar el tipo de evento

        if (error) {
          toast.error('Error al obtener los eventos');
          console.error(error);
        } else {
          // Obtener las inscripciones totales desde la tabla inscripcionevento
          const { data: inscripcionesData } = await supabase
            .from('inscripcionevento')
            .select('id_usuario')
            .in('id_evento', eventosData.map((evento) => evento.id));

          numInscripciones = inscripcionesData.length;

          // Obtener los equipos asociados a todos los eventos
          const { data: equiposData } = await supabase
            .from('equipo')
            .select('id')
            .in('id_evento', eventosData.map((evento) => evento.id));

          if (equiposData) {
            numEquipos = equiposData.length;
            tieneEquipos = numEquipos > 0;
            setEstadisticas(prev => ({ ...prev, tieneEquipos }));
          }

          // Obtener la asistencia de todos los eventos
          const { data: asistenciaData } = await supabase
            .from('asistencia')
            .select('id_usuario')
            .in('id_evento', eventosData.map((evento) => evento.id));

          if (asistenciaData) {
            asistencia = asistenciaData.length;
          }

          // Obtener los proyectos registrados
          const { data: proyectosData } = await supabase
            .from('proyecto')
            .select('id')
            .eq('id_estado', 4); // Proyectos registrados (estado 4)

          if (proyectosData) {
            proyectosRegistrados = proyectosData.length;
            tieneProyectos = proyectosRegistrados > 0;
            setEstadisticas(prev => ({ ...prev, tieneProyectos }));
          }

          // Obtener equipos completos
          const { data: miembrosData } = await supabase
            .from('miembrosequipo')
            .select('id_usuario, id_equipo')
            .in('id_evento', eventosData.map((evento) => evento.id));

          if (Array.isArray(miembrosData)) {
            const equiposConMiembros = miembrosData.reduce((acc, miembro) => {
              acc[miembro.id_equipo] = (acc[miembro.id_equipo] || 0) + 1;
              return acc;
            }, {});

            equiposCompletos = Object.values(equiposConMiembros).filter(
              (miembros) => miembros === 6
            ).length;
          } else {
            equiposCompletos = 0;
          }

          // Calcular porcentaje de asistencia
          asistenciaPorcentaje = numEquipos ? (asistencia / numEquipos) * 100 : 0;
        }
      } else {
        // Para un evento específico
        const { data: eventoData, error } = await supabase
          .from('evento')
          .select('id, id_tevento') // Seleccionamos id_tevento para verificar el tipo de evento
          .eq('id', eventoSeleccionado);

        if (eventoData && eventoData.length > 0) {
          const evento = eventoData[0];
          const id_tevento = evento.id_tevento; // Esto es lo que necesitamos para verificar el tipo de evento

          // Obtener inscripciones
          const { data: inscripcionesData } = await supabase
            .from('inscripcionevento')
            .select('id_usuario')
            .eq('id_evento', eventoSeleccionado);

          if (inscripcionesData) {
            numInscripciones = inscripcionesData.length;
          }

          // Si el evento es de tipo hackathon o feria, procesamos las estadísticas de equipos y proyectos
          if (id_tevento === 4 || id_tevento === 2) {
            // Obtener proyectos registrados solo para Hackathon y Feria
            const { data: proyectosData } = await supabase
              .from('proyecto')
              .select('id')
              .eq('id_evento', eventoSeleccionado)
              .eq('id_estado', 4);

            if (proyectosData) {
              proyectosRegistrados = proyectosData.length;
              setEstadisticas(prev => ({ ...prev, tieneProyectos: proyectosRegistrados > 0 }));
            }

            // Obtener equipos completos solo para Hackathon y Feria
            const { data: miembrosData } = await supabase
              .from('miembrosequipo')
              .select('id_usuario, id_equipo')
              .eq('id_evento', eventoSeleccionado);

            if (Array.isArray(miembrosData)) {
              const equiposCompletosData = miembrosData.reduce((acc, miembro) => {
                acc[miembro.id_equipo] = (acc[miembro.id_equipo] || 0) + 1;
                return acc;
              }, {});

              equiposCompletos = Object.values(equiposCompletosData).filter(
                (miembros) => miembros === 6
              ).length;
            } else {
              equiposCompletos = 0;
            }
          } else {
            // Si el evento no es Hackathon ni Feria, no calculamos equipos y proyectos
            equiposCompletos = 0;
            proyectosRegistrados = 0;
          }

          // Obtener equipos registrados solo para Hackathon y Feria
          const { data: equiposData } = await supabase
            .from('equipo')
            .select('id')
            .eq('id_evento', eventoSeleccionado);

          if (equiposData) {
            numEquipos = equiposData.length;
            setEstadisticas(prev => ({ ...prev, tieneEquipos: numEquipos > 0 }));
          }

          // Calcular porcentaje de asistencia
          asistenciaPorcentaje = numEquipos ? (asistencia / numEquipos) * 100 : 0;
        }
      }

      // Actualizar las estadísticas finales
      setEstadisticas({
        numEquipos: numEquipos || 0,
        asistencia: asistencia || 0,
        equiposCompletos: equiposCompletos || 0,
        proyectosRegistrados: proyectosRegistrados || 0,
        asistenciaPorcentaje: asistenciaPorcentaje || 0,
        numInscripciones: numInscripciones || 0,
      });

    } catch (error) {
      toast.error('Ocurrió un error al cargar las estadísticas');
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

          {(eventoSeleccionado === 'todos' || eventoSeleccionado === 2 || eventoSeleccionado === 4) && (
            <>
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
