import React, {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import supabase from '../utils/supabaseClient.js'
import {toast, ToastContainer} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import HorarioCard from '../components/HorarioCard.jsx'
import {UserAuth} from '../context/AuthContext.jsx'
import MarcarAsistencia from '../components/MarcarAsistencia.jsx';
import EscanearQR from '../components/EscanearQR';
import SubirQR from '../components/SubirQR';
import GenerarQR from '../components/GenerarQR';


const DetalleEvento = () => {
    const {id} = useParams()
    const {user, tipoUsuario} = UserAuth()
    const navigate = useNavigate()


    const [evento, setEvento] = useState(null)
    const [horarios, setHorarios] = useState([])
    const [ampliada, setAmpliada] = useState(false)
    const [usuarioId, setUsuarioId] = useState(null)
    const [estaInscrito, setEstaInscrito] = useState(false)
    const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false)
    const [equiposIncompletos, setEquiposIncompletos] = useState([]);
    const [inscripcionCargando, setInscripcionCargando] = useState(true);
    const [refresco, setRefresco] = useState(0);
    const [miEquipo, setMiEquipo] = useState(null);
    const [subiendoInforme, setSubiendoInforme] = useState(false);
    const [asistenciaRegistrada, setAsistenciaRegistrada] = useState(null);
    const [mostrarEscaner, setMostrarEscaner] = useState(false);
    const [asistenciaVerificada, setAsistenciaVerificada] = useState(false);

    useEffect(() => {
        fetchEvento()
    }, [id])

    useEffect(() => {
        if (user?.email) {
            obtenerUsuarioId()
        }
    }, [user])

    useEffect(() => {
        if (evento && usuarioId) {
            verificarInscripcion()
        }
    }, [evento, usuarioId, refresco])

    const subirInformePDF = async (archivo) => {
        if (!archivo || archivo.type !== 'application/pdf') {
            toast.error('Archivo inválido. Debe ser PDF.');
            return;
        }

        setSubiendoInforme(true);

        try {
            const nombreLimpio = archivo.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
            const nombreArchivo = `informe_${Date.now()}_${nombreLimpio}`;

            const {data: storageData, error: storageError} = await supabase
                .storage
                .from('informes')
                .upload(nombreArchivo, archivo);

            if (storageError) throw storageError;

            const {data: urlData} = supabase
                .storage
                .from('informes')
                .getPublicUrl(nombreArchivo);

            const {error: updateError} = await supabase
                .from('proyecto')
                .update({url_informe: urlData.publicUrl})
                .eq('id', miEquipo.proyecto.id);

            if (updateError) throw updateError;

            toast.success('Informe subido correctamente.');
            setMiEquipo(prev => ({
                ...prev,
                proyecto: {...prev.proyecto, url_informe: urlData.publicUrl}
            }));
        } catch (err) {
            console.error(err);
            toast.error('Error al subir el informe.');
        } finally {
            setSubiendoInforme(false);
        }
    };

    useEffect(() => {
      console.log("🔍 Ejecutando efecto para obtener equipo");

      const obtenerMiEquipo = async () => {
        if (!evento || !usuarioId || !estaInscrito) {
          console.log("⛔ Evento, usuarioId o inscripción aún no están listos");
          return;
        }
        const tipo = parseInt(evento.id_tevento);
        if (tipo !== 2 && tipo !== 4) {
          console.log("ℹ️ El evento no es Feria ni Hackathon");
          return;
        }

        // 1) Obtengo el id_equipo
        const { data: miembro, error: errorMiembro } = await supabase
          .from("miembrosequipo")
          .select("id_equipo, equipo ( id_evento )")
          .eq("id_usuario", usuarioId);

        const miembroValido = miembro?.find(m => m.equipo?.id_evento === evento.id);
        if (!miembroValido) {
          setMiEquipo(null);
          return;
        }
        const idEquipo = miembroValido.id_equipo;

        // 2) Traigo datos de equipo
        const { data: equipo, error: errorEquipo } = await supabase
          .from("equipo")
          .select(`
            id,
            nombre,
            nivelgrupo (
              nivel:nivel!id (nombre)
            ),
            usuario:usuario!id_lider (nombre),
            miembrosequipo (
              id_usuario,
              usuario:usuario (nombre)
            )
          `)
          .eq("id", idEquipo)
          .eq("id_evento", evento.id)
          .maybeSingle();

        // 3) Traigo datos de proyecto
        const { data: proyecto, error: errorProyecto } = await supabase
          .from("proyecto")
          .select("id, url_informe")
          .eq("id_equipo", idEquipo)
          .maybeSingle();

        // 4) Si existe proyecto, compruebo si ya hay tribunal asignado
        let tribunalNombre = null;
        if (proyecto) {
          const { data: asigTribunal } = await supabase
            .from("tribunal")
            .select("id_usuario")
            .eq("id_proyecto", proyecto.id)
            .maybeSingle();

          if (asigTribunal?.id_usuario) {
            const { data: usuarioTribunal } = await supabase
              .from("usuario")
              .select("nombre")
              .eq("id", asigTribunal.id_usuario)
              .maybeSingle();
            tribunalNombre = usuarioTribunal?.nombre || null;
          }
        }

        // 5) Actualizo miEquipo en un solo set
        setMiEquipo({
          ...equipo,
          proyecto: proyecto || null,
          tribunalNombre,
        });
      };

      if (evento && usuarioId && estaInscrito) {
        obtenerMiEquipo();
      }
    }, [evento, usuarioId, estaInscrito]);



    useEffect(() => {
        if (evento && evento.id_tevento && !estaInscrito) {
            const tipo = parseInt(evento.id_tevento)
            if (tipo === 2 || tipo === 4) {
                fetchEquiposIncompletos(evento.id)
            }
        }
    }, [evento, estaInscrito])

    useEffect(() => {
      if (!usuarioId || !evento) return;

      const canal = supabase
        .channel('inscripcion_realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'inscripcionevento',
            filter: `id_usuario=eq.${usuarioId}`
          },
          async ({ new: insc }) => {
            if (insc.id_evento !== parseInt(id, 10)) return;

            // 🚀 obtengo token
            const session = await supabase.auth.getSession();
            const accessToken = session.data.session.access_token;

            const sendMail = (to, subject, html) =>
              fetch('https://sgpnyeashmuwwlpvxbgm.supabase.co/functions/v1/enviar-correo', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify({ to, subject, html })
              });

            // 1) ¿Este usuario está ya en un equipo?
            const { data: miembro } = await supabase
              .from('miembrosequipo')
              .select('id_equipo')
              .eq('id_usuario', insc.id_usuario)
              .maybeSingle();

            if (miembro?.id_equipo) {
              // --- FLUJO GRUPAL ---
              const { data: equipo } = await supabase
                .from('equipo')
                .select(`
                  nombre,
                  miembrosequipo (
                    usuario:usuario (correo, nombre)
                  )
                `)
                .eq('id', miembro.id_equipo)
                .maybeSingle();

              const teamName = equipo.nombre;
              const eventName = evento.nombre;

              for (const m of equipo.miembrosequipo) {
                await sendMail(
                  m.usuario.correo,
                  '🎉 ¡Tu equipo fue inscrito!',
                  `<h2>🎉 Inscripción exitosa</h2>
                  <p>Hola <strong>${m.usuario.nombre}</strong>,</p>
                  <p>Tu equipo <strong>${teamName}</strong> se ha inscrito al evento <strong>${eventName}</strong>.</p>`
                );
              }
            } else {
              // --- FLUJO INDIVIDUAL ---
              const { data: uData } = await supabase
                .from('usuario')
                .select('correo, nombre')
                .eq('id', insc.id_usuario)
                .maybeSingle();

              await sendMail(
                uData.correo,
                '🎉 ¡Inscripción Exitosa!',
                `<h2>🎉 Inscripción Exitosa</h2>
                 <p>Hola <strong>${uData.nombre}</strong>,</p>
                 <p>Te has inscrito al evento <strong>${evento.nombre}</strong>.</p>`
              );
            }

            setRefresco(prev => prev + 1);
          }
        )
        .subscribe();

      return () => supabase.removeChannel(canal);
    }, [usuarioId, evento, id]);

    const obtenerUsuarioId = async () => {
        const {data, error} = await supabase
            .from('usuario')
            .select('id')
            .eq('correo', user.email)
            .maybeSingle()

        if (error || !data) {
            toast.error('No se pudo identificar al usuario.')
            return
        }

        setUsuarioId(data.id)
    }

    const fetchEvento = async () => {
        const {data, error} = await supabase
            .from('evento')
            .select('*')
            .eq('id', id)
            .maybeSingle()

        if (error || !data) {
            toast.error('No se pudo cargar el evento.')
            navigate('/')
            return
        }

        setEvento(data)
        fetchHorariosEvento(data.id)
    }

    const fetchHorariosEvento = async (eventoId) => {
        const {data, error} = await supabase
            .from('horarioevento')
            .select(`
        id_evento ( id ),
        id_dia ( dia ),
        id_horario_inicio ( hora ),
        id_horario_fin ( hora ),
        id_modalidad ( nombre )
      `)
            .eq('id_evento', eventoId)

        if (!error) setHorarios(data)
    }

    const fetchEquiposIncompletos = async (eventoId) => {
        const {data: equipos, error} = await supabase
            .from('equipo')
            .select(`
            id,
            nombre,
            id_lider,
            usuario:usuario!id_lider (
                nombre
            ),
            nivelgrupo (
                id_nivel,
                nivel:nivel!id (
                    nombre
                )
            ),
            miembrosequipo (
                id_usuario
            )
        `)
            .eq('id_evento', eventoId)

        if (error) {
            toast.error('Error al cargar equipos.')
            return
        }

        const incompletos = (equipos || [])
            .map(eq => ({
                id: eq.id,
                nombre: eq.nombre,
                nivel: eq.nivelgrupo?.[0]?.nivel?.nombre || '-',
                cantidad: eq.miembrosequipo?.length || 0,
                lider: eq.usuario?.nombre || '-'
            }))
            .filter(eq => eq.cantidad < 6);

        setEquiposIncompletos(incompletos)
    }

    const verificarInscripcion = async () => {
        const {data, error} = await supabase
            .from('inscripcionevento')
            .select('id_evento')
            .eq('id_evento', id)
            .eq('id_usuario', usuarioId)

        if (!error) {
            setEstaInscrito(data.length > 0)
        }
        setInscripcionCargando(false);
    }
    useEffect(() => {
        const verificarAsistencia = async () => {
            if (!evento || !usuarioId) return;

            const {data: asistencia, error} = await supabase
                .from('asistencia')
                .select('*') // Usamos * porque no hay columna 'id'
                .eq('id_evento', evento.id)
                .eq('id_usuario', usuarioId)
                .maybeSingle();

            if (error) {
                console.error('❌ Error al verificar asistencia:', error);
                return;
            }

            setAsistenciaRegistrada(!!asistencia); // true si existe, false si no
            setAsistenciaVerificada(true); // marca que ya verificamos
        };

        verificarAsistencia();
    }, [evento, usuarioId, refresco]);

    const manejarInscripcion = async () => {
        if (!evento || !usuarioId) return;

        try {
            // Verificación adicional segura
            const {data: check, error: errorCheck} = await supabase
                .from('inscripcionevento')
                .select('id_evento')
                .eq('id_evento', id)
                .eq('id_usuario', usuarioId);

            if (errorCheck) {
                console.error(errorCheck);
                toast.error('No se pudo verificar la inscripción actual.');
                return;
            }

            const yaInscrito = Array.isArray(check) && check.length > 0;
            setEstaInscrito(yaInscrito);

            const tipoEvento = parseInt(evento?.id_tevento ?? 0);
            const estadoEvento = parseInt(evento?.id_estado ?? 0);

            if (estadoEvento !== 1) {
                toast.warning('El evento esta en curso');
                return;
            }

            if ((tipoEvento === 4 || tipoEvento === 2) && !yaInscrito) {
                toast.info('Redirigiendo a la inscripción por equipo...');
                navigate(`/inscribir-equipo/${id}`);
                return;
            }

            if (!yaInscrito) {
                const {error} = await supabase
                    .from('inscripcionevento')
                    .insert({id_evento: parseInt(id), id_usuario: usuarioId});

                if (!error) {
                    toast.success('Inscripción completada.');
                    setEstaInscrito(true);

                } else {
                    toast.error('Error al inscribirse al evento.');
                }
            } else {
                setMostrarModalCancelar(true);
            }
        } catch (err) {
            console.error('Error inesperado en manejo inscripción:', err);
            toast.error('Error inesperado al procesar la inscripción.');
        }
    };


    const confirmarCancelacion = async () => {
        try {
            const tipoEvento = parseInt(evento?.id_tevento ?? 0);

            if (tipoEvento === 2 || tipoEvento === 4) {
                // Buscar todos los equipos del usuario
                const {data: miembrosEquipo, error: errorMiembrosEquipo} = await supabase
                    .from('miembrosequipo')
                    .select('id_equipo')
                    .eq('id_usuario', usuarioId);

                if (errorMiembrosEquipo || !miembrosEquipo || miembrosEquipo.length === 0) {
                    throw new Error("No se encontró el equipo del usuario.");
                }

                let idEquipo = null;
                for (const m of miembrosEquipo) {
                    const {data: eqEvento} = await supabase
                        .from('equipo')
                        .select('id_evento')
                        .eq('id', m.id_equipo)
                        .maybeSingle();

                    if (eqEvento?.id_evento === parseInt(id)) {
                        idEquipo = m.id_equipo;
                        break;
                    }
                }

                if (idEquipo) {
                    const {data: equipo} = await supabase
                        .from('equipo')
                        .select('id, id_lider')
                        .eq('id', idEquipo)
                        .maybeSingle();

                    const {data: miembros} = await supabase
                        .from('miembrosequipo')
                        .select('id_usuario')
                        .eq('id_equipo', idEquipo);

                    const idsMiembros = miembros.map(m => m.id_usuario);

                    if (equipo.id_lider === usuarioId) {
                        await supabase.from('proyecto').delete().eq('id_equipo', idEquipo);
                        await supabase.from('asistencia').delete().in('id_usuario', idsMiembros).eq('id_evento', id);
                        await supabase.from('inscripcionevento').delete().in('id_usuario', idsMiembros).eq('id_evento', id);
                        await supabase.from('miembrosequipo').delete().eq('id_equipo', idEquipo);
                        await supabase.from('nivelgrupo').delete().eq('id_equipo', idEquipo);
                        await supabase.from('equipo').delete().eq('id', idEquipo);
                        toast.success('Se canceló la inscripción del equipo completo.');
                    } else {
                        await supabase.from('inscripcionevento').delete().match({id_evento: id, id_usuario: usuarioId});
                        await supabase.from('asistencia').delete().match({id_evento: id, id_usuario: usuarioId});
                        await supabase.from('miembrosequipo').delete().match({
                            id_usuario: usuarioId,
                            id_equipo: idEquipo
                        });
                        toast.success('Te has salido del equipo correctamente.');
                    }

                    await fetchEquiposIncompletos(evento.id);
                    setEstaInscrito(false);
                    setMostrarModalCancelar(false);
                    return;
                }
            }

            // Si no es feria ni hackatón o no tiene equipo:
            await supabase.from('inscripcionevento').delete().match({id_evento: id, id_usuario: usuarioId});
            await supabase.from('asistencia').delete().match({id_evento: id, id_usuario: usuarioId});
            toast.success('Cancelación completada correctamente.');
            setEstaInscrito(false);

        } catch (err) {
            console.error(err);
            toast.error('Error al cancelar la inscripción.');
        } finally {
            setMostrarModalCancelar(false);
        }
    };


    const unirseAEquipo = async (equipoId) => {
        try {
            // Validar que no esté ya inscrito
            const {data: yaInscrito, error: errorInscrito} = await supabase
                .from('inscripcionevento')
                .select('id_usuario')
                .eq('id_evento', id)
                .eq('id_usuario', usuarioId);

            if (errorInscrito) throw errorInscrito;
            if (yaInscrito.length > 0) {
                toast.info('Ya estás inscrito en este evento.');
                return;
            }

            // Verificar que el equipo aún exista
            const {data: equipoExistente, error: equipoError} = await supabase
                .from('equipo')
                .select('id')
                .eq('id', equipoId)
                .maybeSingle();

            if (equipoError) throw equipoError;
            if (!equipoExistente) {
                toast.error('El equipo ya no existe.');
                fetchEquiposIncompletos(evento.id); // Refresca lista visual
                return;
            }

            // Verificar cantidad de miembros actual
            const {data: miembrosActuales, error: errorMiembros} = await supabase
                .from('miembrosequipo')
                .select('id_usuario')
                .eq('id_equipo', equipoId);

            if (errorMiembros) throw errorMiembros;
            if ((miembrosActuales?.length ?? 0) >= 6) {
                toast.error('El equipo ya está completo.');
                fetchEquiposIncompletos(evento.id);
                return;
            }

            // Insertar en ambas tablas (inscripcionevento y miembrosequipo)
            const {error: inscError} = await supabase
                .from('inscripcionevento')
                .insert({id_evento: parseInt(id), id_usuario: usuarioId});

            if (inscError) throw inscError;

            const {error: miembroError} = await supabase
                .from('miembrosequipo')
                .insert({id_equipo: equipoId, id_usuario: usuarioId});

            if (miembroError) throw miembroError;

            toast.success('Te uniste al equipo exitosamente.');
            setEstaInscrito(true);
            fetchEquiposIncompletos(evento.id);
        } catch (error) {
            console.error(error);
            toast.error('Hubo un error al intentar unirte al equipo.');
        }

    };

    if (!evento) return <p className="text-center mt-5">Cargando evento...</p>


    return (
        <>
            <Navbar/>

            {mostrarModalCancelar && (
                <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirmar cancelación</h5>
                                <button type="button" className="btn-close"
                                        onClick={() => setMostrarModalCancelar(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>¿Estás seguro de cancelar tu inscripción al evento?</p>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary"
                                        onClick={() => setMostrarModalCancelar(false)}>No
                                </button>
                                <button className="btn btn-danger" onClick={confirmarCancelacion}>Sí, cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {ampliada && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center"
                    style={{zIndex: 1050}}
                    onClick={() => setAmpliada(false)}
                >
                    <img
                        src={evento.imagen_url}
                        alt="ampliada"
                        className="img-fluid rounded shadow-lg"
                        style={{maxHeight: '90vh', maxWidth: '90vw'}}
                    />
                </div>
            )}

            <div className="container mt-5">
                <div className="text-center mb-4">
                    <img
                        src={evento.imagen_url || '/noDisponible.jpg'}
                        alt={evento.nombre}
                        className="img-fluid rounded-4 shadow"
                        style={{maxWidth: '100%', height: 'auto', cursor: 'zoom-in'}}
                        onClick={() => setAmpliada(true)}
                    />
                </div>

                <div className="row">
                    <div className="col-md-7">
                        {evento.id_estado === 1 && (
                            <span className="badge bg-success fs-6 mb-2">Inscripción Abierta</span>
                        )}
                        {evento.id_estado === 2 && (
                            <span className="badge bg-secondary fs-6 mb-2">Inscripción Cerrada</span>
                        )}
                        {evento.id_estado === 3 && (
                            <span className="badge bg-warning text-dark fs-6 mb-2">Próximamente</span>
                        )}
                        {evento.id_estado === 4 && (
                            <span className="badge bg-primary fs-6 mb-2">En Curso</span>
                        )}
                        {evento.id_estado === 5 && (
                            <span className="badge bg-dark fs-6 mb-2">Finalizado</span>
                        )}
                        {evento.id_estado === 6 && (
                            <span className="badge bg-danger fs-6 mb-2">Cancelado</span>
                        )}
                        <h2 className="fw-bold">{evento.nombre}</h2>
                        <p className="mt-3">{evento.descripcion}</p>
                        {/* ✅ Bloque de asistencia si el usuario está inscrito */}
                        {estaInscrito && (
                            <div className="bg-white p-4 mt-4 mb-3 rounded-4 shadow-sm border d-inline-block">
                                <h5 className="fw-bold mb-3">Registro de Asistencia</h5>
                                {evento?.id_estado === 4 && (
                                    <>
                                        {!asistenciaVerificada ? (
                                            <p className="text-muted">Verificando asistencia...</p>
                                        ) : asistenciaRegistrada ? (
                                            <div className="alert alert-success mt-4" role="alert">
                                                ✅ Su asistencia ya ha sido registrada.
                                            </div>
                                        ) : (
                                            <div className="mt-4">
                                                <p className="fw-semibold">Registrar asistencia con QR:</p>

                                                {!mostrarEscaner ? (
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        onClick={() => setMostrarEscaner(true)}
                                                    >
                                                        Activar escáner
                                                    </button>
                                                ) : (
                                                    <EscanearQR
                                                        usuarioId={usuarioId}
                                                        deshabilitado={false}
                                                        onAsistenciaRegistrada={() => {
                                                            setAsistenciaRegistrada(true);
                                                            setMostrarEscaner(false);
                                                            setRefresco((prev) => prev + 1);
                                                        }}
                                                    />
                                                )}
                                                <SubirQR
                                                    usuarioId={usuarioId}
                                                    onAsistenciaRegistrada={() => {
                                                        setAsistenciaRegistrada(true);
                                                        setRefresco((prev) => prev + 1);
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                                {(tipoUsuario === 6 || tipoUsuario === 7) && evento?.id_estado === 4 && (
                                    <div className="mt-4 p-3 bg-light border rounded-4 shadow-sm">
                                        <h5 className="fw-bold mb-2">📲 QR para registrar asistencia</h5>
                                        <GenerarQR eventoId={evento.id} usuarioId={usuarioId}/>
                                    </div>
                                )}

                            </div>
                        )}


                        {miEquipo && (
                            <div className="bg-white p-4 mt-3 mb-3 rounded-4 shadow-sm border">
                                <h5 className="fw-bold mb-3">Mi Equipo</h5>
                                <p><strong>Nombre:</strong> {miEquipo.nombre}</p>
                                <p><strong>Nivel:</strong> {miEquipo.nivelgrupo?.[0]?.nivel?.nombre || '-'}</p>
                                <p><strong>Líder:</strong> {miEquipo.usuario?.nombre || '-'}</p>
                                <p><strong>Miembros:</strong></p>
                                <ul>
                                    {miEquipo.miembrosequipo.map((m, i) => (
                                        <li key={i}>{m.usuario?.nombre || `Usuario ${m.id_usuario}`}</li>
                                    ))}
                                </ul>
                                <p>
                                  <strong>Tribunal asignado:</strong>{' '}
                                  {miEquipo.tribunalNombre ?? '— Por designar —'}
                                </p>
                                {miEquipo?.proyecto?.url_informe ? (
                                    <div className="mt-3">
                                        <a
                                            href={miEquipo.proyecto.url_informe}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-primary"
                                        >
                                            Ver Informe PDF
                                        </a>
                                    </div>
                                ) : (
                                    <div className="mt-3">
                                        <label className="form-label">Subir Informe Final PDF:</label>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            className="form-control mb-2"
                                            onChange={(e) => subirInformePDF(e.target.files[0])}
                                        />
                                        {subiendoInforme && <p className="text-muted mt-2">Subiendo...</p>}
                                    </div>
                                )}


                            </div>
                        )}

                    </div>

                    <div className="col-md-5 d-flex align-items-start justify-content-center">
                        <section className="border rounded p-4 w-100 bg-white shadow-sm">
                            <div className="row row-cols-1 row-cols-sm-1 row-cols-md-2">
                                <div className="col">
                                    <p className="text-center fw-semibold mb-2">Empieza el:</p>
                                    <div className="text-center fs-5 mb-4">
                                        {evento.fechainicio?.split('-').reverse().join('/')}
                                    </div>
                                </div>
                                <div className="col">
                                    <p className="text-center fw-semibold mb-2">Termina el:</p>
                                    <div className="text-center fs-5 mb-4">
                                        {evento.fechafin?.split('-').reverse().join('/')}
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex justify-content-center">
                                {!inscripcionCargando && (
                                    <button
                                        className={`btn ${estaInscrito ? 'btn-secondary' : 'btn-primary'} px-4`}
                                        onClick={manejarInscripcion}
                                    >
                                        {estaInscrito ? 'Cancelar inscripción' : 'Inscribirse'}
                                    </button>
                                )}
                            </div>
                        </section>
                    </div>

                </div>

                <section className="d-flex justify-content-center align-items-start mt-3 p-3">
                    <div className="bg-white p-5 p-md-5 rounded-5 shadow" style={{maxWidth: '55rem', width: '100%'}}>
                        <h3 className="text-center fw-bold mb-4">Horarios del Evento</h3>
                        {horarios.length === 0 ? (
                            <p className="text-center text-muted">No hay horarios disponibles.</p>
                        ) : (
                            <div className="row g-4">
                                {horarios.map((h, index) => (
                                    <HorarioCard
                                        key={index}
                                        dia={h.id_dia?.dia || '-'}
                                        horaInicio={h.id_horario_inicio?.hora?.slice(0, 5) || '-'}
                                        horaFin={h.id_horario_fin?.hora?.slice(0, 5) || '-'}
                                        modalidad={h.id_modalidad?.nombre || '-'}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
                {!inscripcionCargando && (evento.id_tevento === 2 || evento.id_tevento === 4) && !estaInscrito && (
                    <section className="d-flex justify-content-center align-items-start mt-3 p-3">
                        <div className="bg-white p-5 p-md-5 rounded-5 shadow"
                             style={{maxWidth: '55rem', width: '100%'}}>
                            <h3 className="text-center fw-bold mb-4">Equipos con cupos disponibles</h3>
                            {equiposIncompletos.length === 0 ? (
                                <p className="text-center text-muted">No hay equipos con cupos disponibles.</p>
                            ) : (
                                <div className="row g-3">
                                    {equiposIncompletos.map((equipo, i) => (
                                        <div key={i} className="col-12 border rounded p-3 shadow-sm bg-light">
                                            <div
                                                className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center text-start text-md-start">
                                                <div className="flex-grow-1 mb-2 mb-md-0">
                                                    <p className="mb-1 text-nowrap d-flex">
                                                        <span className="fw-bold me-1">Equipo:</span>
                                                        <span>{equipo.nombre}</span>
                                                    </p>
                                                    <p className="mb-1 text-nowrap d-flex">
                                                        <span className="fw-bold me-1">Nivel:</span>
                                                        <span>{equipo.nivel}</span>
                                                    </p>
                                                    <p className="mb-1 text-nowrap d-flex">
                                                        <span className="fw-bold me-1">Miembros:</span>
                                                        <span>{equipo.cantidad} / 6</span>
                                                    </p>
                                                    <p className="mb-1 text-nowrap d-flex">
                                                        <span className="fw-bold me-1">Líder:</span>
                                                        <span>{equipo.lider}</span>
                                                    </p>
                                                </div>
                                                <div
                                                    className="w-100 w-md-auto d-flex align-items-md-center justify-content-center justify-content-md-end mt-3 mt-md-0">
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{width: '200px'}}
                                                        onClick={() => unirseAEquipo(equipo.id)}
                                                    >
                                                        Unirse al Equipo
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

            </div>
            <ToastContainer position="top-right" autoClose={3000}/>
        </>
    )
}

export default DetalleEvento
