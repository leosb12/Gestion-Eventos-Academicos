import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {ToastContainer} from 'react-toastify';
import { Modal, Button } from 'react-bootstrap';

const DetalleEventoCreador = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [evento, setEvento] = useState(null);
    const [usuarioId, setUsuarioId] = useState(null);
    const [inscritos, setInscritos] = useState([]);
    const [asistencias, setAsistencias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [estados, setEstados] = useState([]);
    const [editando, setEditando] = useState(false);
    const [form, setForm] = useState({nombre: '', descripcion: '', fechainicio: '', fechafin: '', nuevaImagen: null});
    const [equipos, setEquipos] = useState([]);
    const [equipoExpandido, setEquipoExpandido] = useState(null);
    const [subSeccionesAbiertas, setSubSeccionesAbiertas] = useState({});
    const [tribunales, setTribunales] = useState([]);
    const [tribunalPorEquipo, setTribunalPorEquipo] = useState({});
    const [mentores, setMentores] = useState([]);
    const [mentorPorEquipo, setMentorPorEquipo] = useState({});
    const [rankingPorMateria, setRankingPorMateria] = useState({});
    const [materias, setMaterias] = useState([]);
    const [rankingPublicado, setRankingPublicado] = useState(false);
    const [showPreview, setShowPreview] = useState(false);   // controla el modal
    const [filaExpandida, setFilaExpandida] = useState({});
    const [niveles, setNiveles]           = useState([]);   // ← catálogos Basico/Intermedio/Avanzado
    const [nivelAbierto, setNivelAbierto] = useState({});  // controla los “dropdowns” de nivel


    useEffect(() => {
        // Cargar todos los usuarios tipo mentor (id_tipo_usuario = 8)
        supabase
            .from('usuario')
            .select('id, nombre')
            .eq('id_tipo_usuario', 8)
            .then(({data}) => setMentores(data || []));
    }, []);

    useEffect(() => {
        // carga todos los usuarios tipo tribunal (id_tipo_usuario = 3)
        supabase
            .from('usuario')
            .select('id, nombre')
            .eq('id_tipo_usuario', 3)
            .then(({data}) => setTribunales(data || []));
    }, []);

    useEffect(() => {
        const fetchData = async () => {
  const {data: authUser} = await supabase.auth.getUser();
  const correo = authUser?.user?.email;
  if (!correo) return navigate('/');

  const {data: usuario} = await supabase
    .from('usuario')
    .select('id')
    .eq('correo', correo)
    .maybeSingle();

  if (!usuario) return navigate('/');
  setUsuarioId(usuario.id);

  const [{data: eventoData, error: eventoError}, {data: estadosData}] = await Promise.all([
    supabase.from('evento').select('*').eq('id', id).maybeSingle(),
    supabase.from('estado').select('*')
  ]);

  if (eventoError || !eventoData || eventoData.id_usuario_creador !== usuario.id) {
    toast.error('No tienes permiso para ver este evento');
    return navigate('/');
  }

  setEvento(eventoData);
  setEstados(estadosData || []);
  setForm({
    nombre: eventoData.nombre,
    descripcion: eventoData.descripcion,
    fechainicio: eventoData.fechainicio,
    fechafin: eventoData.fechafin,
    nuevaImagen: null
  });

  // 🔥 CORRECTO: fuera del setForm
  const { data: rankingPub } = await supabase
    .from('publicacion_ranking')
    .select('*')
    .eq('id_evento', eventoData.id)
    .maybeSingle();
  setRankingPublicado(!!rankingPub);

  const { data: materiasData } = await supabase
    .from('materia')
    .select('id, nombre');
  setMaterias(materiasData || []);

  setLoading(false);
};

        fetchData();
    }, [id, navigate]);

    useEffect(() => {
        // Cargar todos los usuarios tipo mentor (id_tipo_usuario = 8)
        supabase
            .from('usuario')
            .select('id, nombre')
            .eq('id_tipo_usuario', 8)
            .then(({data}) => setMentores(data || []));
    }, []);

    useEffect(() => {
        if (!evento) return;

        const cargarInscritosOEquipos = async () => {
            if (evento.id_tevento === 2 || evento.id_tevento === 4) {
                const {data: equiposData} = await supabase
                    .from('equipo')
                    .select('id, nombre, id_lider')
                    .eq('id_evento', evento.id);

                const equiposCompletos = await Promise.all(equiposData.map(async (equipo) => {
                    const {data: lider} = await supabase
                        .from('usuario')
                        .select('nombre')
                        .eq('id', equipo.id_lider)
                        .maybeSingle();

                    const {data: miembros} = await supabase
                        .from('miembrosequipo')
                        .select('id_usuario')
                        .eq('id_equipo', equipo.id);

                    const idsMiembros = miembros.map(m => m.id_usuario);
                    const {data: usuarios} = await supabase
                        .from('usuario')
                        .select('id, nombre, correo')
                        .in('id', idsMiembros);

                    const {data: asistencias} = await supabase
                        .from('asistencia')
                        .select('id_usuario')
                        .eq('id_evento', evento.id);

                    const {data: proyecto} = await supabase
                        .from('proyecto')
                        .select('id, nombre, descripcion, url_informe')
                        .eq('id_equipo', equipo.id)
                        .maybeSingle();

                    return {
                        ...equipo,
                        nombre_lider: lider?.nombre,
                        miembros: usuarios,
                        asistencias: asistencias?.map(a => a.id_usuario) || [],
                        proyecto
                    };
                }));

                setEquipos(equiposCompletos);
            } else {
                const {data, error} = await supabase
                    .from('inscripcionevento')
                    .select('id_usuario')
                    .eq('id_evento', evento.id);

                if (error) {
                    toast.error('Error al cargar inscritos');
                    return;
                }

                const idsUsuarios = data.map(row => row.id_usuario);
                if (idsUsuarios.length === 0) {
                    setInscritos([]);
                    return;
                }

                const [{data: usuarios}, {data: asistencias}] = await Promise.all([
                    supabase.from('usuario').select('id, nombre, correo').in('id', idsUsuarios),
                    supabase.from('asistencia').select('id_usuario').eq('id_evento', evento.id)
                ]);

                setInscritos(usuarios);
                setAsistencias(asistencias?.map(a => a.id_usuario) || []);
            }
        };

        cargarInscritosOEquipos();
    }, [evento]);

    useEffect(() => {
        if (!equipos.length) return;

        const fetchTribunalesAsignados = async () => {
            const {data: asignaciones, error} = await supabase
                .from('tribunal')
                .select('id_proyecto, id_usuario');

            if (error) {
                console.error('Error cargando asignaciones de tribunal:', error);
                return;
            }

            // mapeo equipo.id → tribunalId
            const mapping = {};
            asignaciones.forEach(({id_proyecto, id_usuario}) => {
                // buscamos qué equipo tiene este proyecto
                const equipo = equipos.find(e => e.proyecto?.id === id_proyecto);
                if (equipo) mapping[equipo.id] = id_usuario;
            });

            setTribunalPorEquipo(mapping);
        };

        fetchTribunalesAsignados();
    }, [equipos]);
    useEffect(() => {
  if (
    !evento ||
    evento.id_estado !== 5 ||
    (evento.id_tevento !== 2 && evento.id_tevento !== 4)
  ) return;

  const obtenerRankingAgrupado = async () => {
  /* ────────── 1) Proyectos del evento ────────── */
  const { data: proyectos, error: errProy } = await supabase
    .from('proyecto')
    .select(`
      id,
      nombre,
      id_materia,
      equipo!inner(
        id,
        nombre,
        mentor_id,
        id_evento
      )
    `)
    .eq('equipo.id_evento', evento.id);

  if (errProy) {
    console.error(errProy);
    toast.error('No se pudieron cargar los proyectos');
    return;
  }

  /* ────────── 2) Mapeo equipo  →  nivel ────────── */
  const { data: nivelesEq, error: errNv } = await supabase
    .from('nivelgrupo')
    .select(`
      id_equipo,
      nivel: nivel ( id, nombre )
    `)
    .in('id_equipo', equipos.map(e => e.id));

  if (errNv) {
    console.error(errNv);
    toast.error('No se pudieron cargar los niveles');
    return;
  }

  const mapaNivel = {};                  // { idEquipo: {id, nombre} }
  nivelesEq.forEach(n => { mapaNivel[n.id_equipo] = n.nivel; });

  /* ────────── 3) Armamos Materia ➜ Nivel ➜ Proyectos ────────── */
  const agrupado = {};                   // { materia: { nivel: [proy] } }

  materias.forEach(mat => {
    const porMateria = proyectos.filter(p => p.id_materia === mat.id);
    if (!porMateria.length) return;

    const nivelesObj = {};

    porMateria.forEach(p => {
      const nivelInfo   = mapaNivel[p.equipo.id];           // ← de la tabla puente
      const nivelNom    = nivelInfo ? nivelInfo.nombre : 'Sin nivel';
      const mentorNom   = mentores.find(m => m.id === p.equipo?.mentor_id)?.nombre || null;
      const eqInfo      = equipos.find(eq => eq.id === p.equipo.id);
      const integrantes = eqInfo ? eqInfo.miembros.map(m => m.nombre) : [];

      const entry = {
        ...p,
        mentor:      mentorNom,
        integrantes,
        puntaje:     70 + Math.floor(Math.random() * 31)    // ⚠️ temporal
      };

      if (!nivelesObj[nivelNom]) nivelesObj[nivelNom] = [];
      nivelesObj[nivelNom].push(entry);
    });

    // Ordenar ranking dentro de cada nivel
    Object.values(nivelesObj).forEach(lista =>
      lista.sort((a, b) => b.puntaje - a.puntaje)
    );

    agrupado[mat.nombre] = nivelesObj;
  });

  setRankingPorMateria(agrupado);
};

  obtenerRankingAgrupado();
}, [evento, materias, mentores, equipos]);

    const eliminarEvento = async () => {
        const confirmar = window.confirm('¿Estás seguro de eliminar este evento?');
        if (!confirmar) return;

        const {error} = await supabase.from('evento').delete().eq('id', evento.id);
        if (error) toast.error('Error al eliminar el evento');
        else {
            toast.success('Evento eliminado correctamente');
            navigate('/mis-eventos');
        }
    };

    // ───────────────── helpers ranking ─────────────────
const publicarRanking = async () => {
  const { error } = await supabase
    .from('publicacion_ranking')
    .insert({ id_evento: evento.id });

  if (error) return toast.error('Error al publicar');
  toast.success('Ranking publicado');
  setRankingPublicado(true);
};

const eliminarRanking = async () => {
  const { error } = await supabase
    .from('publicacion_ranking')
    .delete()
    .eq('id_evento', evento.id);

  if (error) return toast.error('Error al eliminar');
  toast.success('Publicación eliminada');
  setRankingPublicado(false);
};
// ────────────────────────────────────────────────────

    const guardarCambios = async () => {
        let nuevaURL = evento.imagen_url;

        if (form.nuevaImagen) {
            const fileExt = form.nuevaImagen.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = fileName;

            const {error: uploadError} = await supabase.storage
                .from('event-images')
                .upload(filePath, form.nuevaImagen, {
                    contentType: form.nuevaImagen.type
                });

            if (uploadError) {
                toast.error("No se pudo subir la nueva imagen");
                return;
            }

            const {data: publicUrlData} = supabase.storage.from('event-images').getPublicUrl(filePath);
            nuevaURL = publicUrlData?.publicUrl;
        }

        const {error} = await supabase
            .from('evento')
            .update({
                nombre: form.nombre,
                descripcion: form.descripcion,
                fechainicio: form.fechainicio,
                fechafin: form.fechafin,
                imagen_url: nuevaURL
            })
            .eq('id', evento.id);

        if (error) {
            toast.error('Error al guardar cambios');
        }

        for (const [equipoId, tribunalId] of Object.entries(tribunalPorEquipo)) {
            if (!tribunalId) continue;
            const proyectoId = equipos.find(e => e.id === +equipoId).proyecto.id;
            const {error: tribunalError} = await supabase
                .from('tribunal')
                .upsert(
                    {id_proyecto: proyectoId, id_usuario: tribunalId},
                    {onConflict: ['id_proyecto']}
                );
            if (tribunalError) {
                toast.error(`Error al asignar tribunal al grupo ${equipoId}`);
                return;
            }
        }
        for (const [equipoId, mentorId] of Object.entries(mentorPorEquipo)) {
            const {error: mentorError} = await supabase
                .from('equipo')
                .update({mentor_id: mentorId})
                .eq('id', equipoId);

            if (mentorError) {
                toast.error(`Error al asignar mentor al equipo ${equipoId}`);
                return;
            }
        }


        toast.success('Cambios guardados');
        setEvento({...evento, ...form, imagen_url: nuevaURL});
        setEditando(false);


    };

    const cambiarEstado = async (nuevoEstado) => {
        const {error} = await supabase
            .from('evento')
            .update({id_estado: nuevoEstado})
            .eq('id', evento.id);

        if (error) toast.error('Error al cambiar estado');
        else {
            toast.success('Estado actualizado');
            setEvento(prev => ({...prev, id_estado: nuevoEstado}));
        }
    };

    if (loading || !evento) return <p className="text-center mt-5">Cargando...</p>;

    return (
        <>
            <Navbar/>
            <div className="container mt-4">
                {editando ? (
                    <>
                        <input className="form-control mb-2" value={form.nombre}
                               onChange={(e) => setForm(f => ({...f, nombre: e.target.value}))}/>
                        <textarea className="form-control mb-2" value={form.descripcion}
                                  onChange={(e) => setForm(f => ({...f, descripcion: e.target.value}))}/>
                        <div className="row mb-2">
                            <div className="col">
                                <input type="date" className="form-control" value={form.fechainicio}
                                       onChange={(e) => setForm(f => ({...f, fechainicio: e.target.value}))}/>
                            </div>
                            <div className="col">
                                <input type="date" className="form-control" value={form.fechafin}
                                       onChange={(e) => setForm(f => ({...f, fechafin: e.target.value}))}/>
                            </div>
                        </div>
                        <input type="file" accept="image/*" className="form-control mb-3"
                               onChange={(e) => setForm(f => ({...f, nuevaImagen: e.target.files[0]}))}/>
                        <button className="btn btn-success me-2" onClick={guardarCambios}>💾 Guardar</button>
                        <button className="btn btn-secondary" onClick={() => setEditando(false)}>Cancelar</button>
                    </>
                ) : (
                    <>
                        <h2 className="mb-3">{evento.nombre}</h2>
                        <p className="text-muted">{evento.fechainicio} - {evento.fechafin}</p>
                        <img
                            src={evento.imagen_url || '/noDisponible.jpg'}
                            alt="Imagen del evento"
                            className="img-fluid mb-3"
                            style={{maxHeight: '300px', objectFit: 'cover'}}
                        />
                        <p>{evento.descripcion}</p>
                        <div className="mb-3">
                            <label className="form-label">Estado del Evento</label>
                            <select
                                className="form-select"
                                value={evento.id_estado}
                                onChange={(e) => cambiarEstado(parseInt(e.target.value))}
                            >
                                {estados.map((estado) => (
                                    <option key={estado.id} value={estado.id}>{estado.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="d-flex gap-2 my-3">
                            <button className="btn btn-outline-warning" onClick={() => setEditando(true)}>
                                ✏️ Editar Evento
                            </button>
                            <button className="btn btn-outline-danger" onClick={eliminarEvento}>
                                🗑 Eliminar Evento
                            </button>
                        </div>
                    </>
                )}

                <hr/>

                {(evento.id_tevento === 2 || evento.id_tevento === 4) ? (
                    <>
                        <h4 className="mb-3">🧑‍🤝‍🧑 Grupos Inscritos</h4>
                        {equipos.length === 0 ? (
                            <p className="text-secondary">No hay equipos registrados aún.</p>
                        ) : (
                            <div className="accordion" id="equiposAccordion">
                                {equipos.map((equipo) => (
                                    <div className="accordion-item" key={equipo.id}>
                                        <h2 className="accordion-header">
                                            <button
                                                className={`accordion-button ${equipoExpandido === equipo.id ? '' : 'collapsed'}`}
                                                type="button"
                                                onClick={() => setEquipoExpandido(equipoExpandido === equipo.id ? null : equipo.id)}>
                                                {equipo.nombre} — Lider: {equipo.nombre_lider}
                                            </button>
                                        </h2>
                                        <div
                                            className={`accordion-collapse collapse ${equipoExpandido === equipo.id ? 'show' : ''}`}>
                                            <div className="accordion-body">
                                                <div className="mb-2">
                                                    <div className="accordion my-2"
                                                         id={`subAccordionMiembros${equipo.id}`}>
                                                        <div className="accordion-item">
                                                            <h2 className="accordion-header">
                                                                <button
                                                                    className={`accordion-button collapsed bg-light fw-semibold`}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setSubSeccionesAbiertas(prev => ({
                                                                            ...prev,
                                                                            [equipo.id]: {
                                                                                ...(prev[equipo.id] || {}),
                                                                                miembros: !(prev[equipo.id]?.miembros)
                                                                            }
                                                                        }))
                                                                    }>
                                                                    👥 Miembros del Equipo
                                                                </button>
                                                            </h2>
                                                            <div
                                                                className={`accordion-collapse collapse ${subSeccionesAbiertas[equipo.id]?.miembros ? 'show' : ''}`}>
                                                                <div className="accordion-body table-responsive">
                                                                    <table
                                                                        className="table table-sm table-bordered text-center align-middle">
                                                                        <thead className="table-secondary">
                                                                        <tr>
                                                                            <th>ID</th>
                                                                            <th>Nombre</th>
                                                                            <th>Correo</th>
                                                                            <th>Asistencia</th>
                                                                        </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                        {equipo.miembros.map((u) => (
                                                                            <tr key={u.id}>
                                                                                <td>{u.id}</td>
                                                                                <td>{u.nombre}</td>
                                                                                <td>{u.correo}</td>
                                                                                <td>
                                                                                    {equipo.asistencias.includes(u.id)
                                                                                        ? <span
                                                                                            className="badge bg-success">Asistió</span>
                                                                                        : <span
                                                                                            className="badge bg-danger">Falta</span>}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="accordion my-2"
                                                         id={`subAccordionProyecto${equipo.id}`}>
                                                        <div className="accordion-item">
                                                            <h2 className="accordion-header">
                                                                <button
                                                                    className={`accordion-button collapsed bg-light fw-semibold`}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setSubSeccionesAbiertas(prev => ({
                                                                            ...prev,
                                                                            [equipo.id]: {
                                                                                ...(prev[equipo.id] || {}),
                                                                                proyecto: !(prev[equipo.id]?.proyecto)
                                                                            }
                                                                        }))
                                                                    }>
                                                                    📄 Proyecto
                                                                </button>
                                                            </h2>
                                                            <div
                                                                className={`accordion-collapse collapse ${subSeccionesAbiertas[equipo.id]?.proyecto ? 'show' : ''}`}>
                                                                <div className="accordion-body">
                                                                    {equipo.proyecto ? (
                                                                        <>
                                                                            <p>
                                                                                <strong>Nombre:</strong> {equipo.proyecto.nombre}
                                                                            </p>
                                                                            <p>
                                                                                <strong>Descripción:</strong> {equipo.proyecto.descripcion}
                                                                            </p>
                                                                            {equipo.proyecto.url_informe ? (
                                                                                <a href={equipo.proyecto.url_informe}
                                                                                   className="btn btn-outline-primary"
                                                                                   target="_blank"
                                                                                   rel="noopener noreferrer">
                                                                                    Ver Proyecto
                                                                                </a>
                                                                            ) : (
                                                                                <p className="text-muted">❌ No se ha
                                                                                    subido el informe del proyecto.</p>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <p className="text-muted">❌ No se ha registrado
                                                                            un proyecto.</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="accordion my-2" id={`subAccordionTribunal${equipo.id}`}>
                                                    <div className="accordion-item">
                                                        <h2 className="accordion-header">
                                                            <button
                                                                className={`accordion-button collapsed bg-light fw-semibold`}
                                                                type="button"
                                                                onClick={() =>
                                                                    setSubSeccionesAbiertas(prev => ({
                                                                        ...prev,
                                                                        [equipo.id]: {
                                                                            ...(prev[equipo.id] || {}),
                                                                            tribunal: !prev[equipo.id]?.tribunal
                                                                        }
                                                                    }))
                                                                }>
                                                                👨‍⚖️ Tribunal
                                                            </button>
                                                        </h2>
                                                        <div
                                                            className={`accordion-collapse collapse ${subSeccionesAbiertas[equipo.id]?.tribunal ? 'show' : ''}`}>
                                                            <div className="accordion-body">
                                                                {editando ? (
                                                                    <>
                                                                        <label className="form-label">Asignar
                                                                            Tribunal:</label>
                                                                        <select
                                                                            className="form-select mb-3"
                                                                            value={tribunalPorEquipo[equipo.id] ?? ''}
                                                                            onChange={e =>
                                                                                setTribunalPorEquipo(prev => ({
                                                                                    ...prev,
                                                                                    [equipo.id]: +e.target.value
                                                                                }))
                                                                            }
                                                                        >
                                                                            <option value="">— No asignado —</option>
                                                                            {tribunales.map(t => (
                                                                                <option key={t.id} value={t.id}>
                                                                                    {t.nombre}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </>
                                                                ) : (
                                                                    <p className="mb-0">
                                                                        {tribunalPorEquipo[equipo.id]
                                                                            ? tribunales.find(t => t.id === tribunalPorEquipo[equipo.id])?.nombre
                                                                            : '— No asignado —'}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="accordion my-2" id={`subAccordionMentor${equipo.id}`}>
                                                    <div className="accordion-item">
                                                        <h2 className="accordion-header">
                                                            <button
                                                                className={`accordion-button collapsed bg-light fw-semibold`}
                                                                type="button"
                                                                onClick={() =>
                                                                    setSubSeccionesAbiertas(prev => ({
                                                                        ...prev,
                                                                        [equipo.id]: {
                                                                            ...(prev[equipo.id] || {}),
                                                                            mentor: !prev[equipo.id]?.mentor
                                                                        }
                                                                    }))
                                                                }>
                                                                🧑‍🏫 Mentor
                                                            </button>
                                                        </h2>
                                                        <div
                                                            className={`accordion-collapse collapse ${subSeccionesAbiertas[equipo.id]?.mentor ? 'show' : ''}`}>
                                                            <div className="accordion-body">
                                                                {editando ? (
                                                                    <>
                                                                        <label className="form-label">Asignar
                                                                            Mentor:</label>
                                                                        <select
                                                                            className="form-select mb-3"
                                                                            value={mentorPorEquipo[equipo.id] ?? ''}
                                                                            onChange={e =>
                                                                                setMentorPorEquipo(prev => ({
                                                                                    ...prev,
                                                                                    [equipo.id]: e.target.value ? parseInt(e.target.value) : null
                                                                                }))
                                                                            }
                                                                        >
                                                                            <option value="">— No asignado —</option>
                                                                            {mentores.map(m => (
                                                                                <option key={m.id} value={m.id}>
                                                                                    {m.nombre}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </>
                                                                ) : (
                                                                    <p className="mb-0">
                                                                        {mentorPorEquipo[equipo.id]
                                                                            ? mentores.find(m => m.id === mentorPorEquipo[equipo.id])?.nombre
                                                                            : '— No asignado —'}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <h4 className="mb-3">👥 Participantes Inscritos</h4>
                        {inscritos.length === 0 ? (
                            <p className="text-secondary">No hay inscritos todavía.</p>
                        ) : (
                            <div className="table-responsive shadow rounded">
                                <table className="table table-striped table-light align-middle">
                                    <thead className="table-primary text-center">
                                    <tr>
                                        <th scope="col">Registro</th>
                                        <th scope="col">Nombre</th>
                                        <th scope="col">Correo</th>
                                        <th scope="col">Asistencia</th>
                                    </tr>
                                    </thead>
                                    <tbody className="text-center">
                                    {inscritos.map((usuario) => (
                                        <tr key={usuario.id}>
                                            <td>{usuario.id}</td>
                                            <td>{usuario.nombre}</td>
                                            <td>{usuario.correo}</td>
                                            <td>
                                                {asistencias.includes(usuario.id) ? (
                                                    <span className="badge bg-success">Asistió</span>
                                                ) : (
                                                    <span className="badge bg-danger">Falta</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>


                        )}


                    </>

                )}
                <div className="mt-5 text-start bg-white border rounded-4 shadow-sm p-4"
                     style={{maxWidth: '360px'}}>
                    <h5 className="fw-bold mb-3">📲 Comparte este QR para que los participantes marquen
                        asistencia</h5>
                    <div className="d-flex justify-content-center">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?data=https://tu-app.com/asistencia/${evento.id}&size=200x200`}
                            alt="QR de asistencia"
                            className="img-fluid"
                            style={{maxWidth: '200px'}}
                        />
                    </div>
                    <p className="text-muted mt-3">Los participantes pueden escanear este código para registrar
                        su asistencia al evento.</p>
                </div>

{/* ░░░░░░░░░░  BLOQUE RANKING  ░░░░░░░░░░
     – Visible solo si el evento ES hack/fair   y está FINALIZADO  */}
{( (evento.id_tevento === 2 || evento.id_tevento === 4) &&
   evento.id_estado  === 5 ) && (
  <>
    {/* ────── botones cabecera ────── */}
    <button
      className="btn btn-outline-primary w-100 mt-4"
      onClick={() => setShowPreview(true)}
    >
      Vista previa del ranking
    </button>

    {!rankingPublicado ? (
      <button
        className="btn btn-success w-100 mt-2"
        onClick={publicarRanking}
      >
        ✅ Publicar ranking
      </button>
    ) : (
      <button
        className="btn btn-danger w-100 mt-2"
        onClick={eliminarRanking}
      >
        🗑 Quitar publicación
      </button>
    )}

    {/* ────── Modal ────── */}
    <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>📊 Vista previa del ranking</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Banner */}
        <div className="text-center mb-4">
          <img
            src={evento.imagen_url || '/noDisponible.jpg'}
            alt="banner evento"
            className="img-fluid rounded"
            style={{ maxHeight: 220, objectFit: 'cover' }}
          />
          <h5 className="mt-3 fw-semibold">{evento.nombre}</h5>
        </div>

        {/* CONTENIDO  Materia ➜ Nivel ➜ Proyectos */}
        {Object.entries(rankingPorMateria).map(([materia, niveles]) => (
          <div key={materia} className="mb-4">
            <h5 className="fw-bold text-primary mb-3">📚 {materia}</h5>

            {Object.entries(niveles).map(([nivel, proyectos]) => {
              /*  clave única Materia+Nivel para el accordion */
              const nivelKey   = `${materia}-${nivel}`;
              const abierto    = nivelAbierto[nivelKey];

              return (
                <div key={nivelKey} className="mb-3">
                  {/* Botón desplegable de NIVEL */}
                  <button
                    className="btn btn-link fw-semibold text-decoration-none px-0"
                    onClick={() =>
                      setNivelAbierto(prev => ({ ...prev, [nivelKey]: !prev[nivelKey] }))
                    }
                  >
                    {abierto ? '▾' : '▸'} Nivel <strong>{nivel}</strong>
                  </button>

                  {/* Tabla ranking PROYECTOS */}
                  {abierto && (
                    <div className="table-responsive mt-2">
                      <table className="table table-sm table-bordered text-center align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Proyecto</th>
                            <th>Equipo</th>
                            <th>Mentor</th>
                            <th>Puntaje</th>
                          </tr>
                        </thead>

                        <tbody>
                          {proyectos.map((p, i) => {
                            const openRow = filaExpandida[p.id];
                            const rowCls  =
                              i === 0 ? 'table-warning fw-bold'
                              : i === 1 ? 'table-secondary fw-bold'
                              : i === 2 ? 'table-info fw-bold'
                              : '';

                            return (
                              <React.Fragment key={p.id}>
                                {/* Fila principal */}
                                <tr className={rowCls}>
                                  <td>
                                    <button
                                      className="btn btn-sm btn-link p-0 me-1"
                                      onClick={() =>
                                        setFilaExpandida(prev => ({ ...prev, [p.id]: !prev[p.id] }))
                                      }
                                    >
                                      {openRow ? '▾' : '▸'}
                                    </button>
                                    {i + 1}
                                  </td>
                                  <td>{p.nombre}</td>
                                  <td>{p.equipo?.nombre || '—'}</td>
                                  <td>{p.mentor || '—'}</td>
                                  <td>{p.puntaje}</td>
                                </tr>

                                {/* Fila integrantes */}
                                {openRow && (
                                  <tr>
                                    <td colSpan={5} className="bg-light text-start">
                                      <strong>Integrantes:</strong>{' '}
                                      {p.integrantes.length
                                        ? p.integrantes.join(', ')
                                        : '— Sin integrantes —'}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowPreview(false)}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  </>
)}

</div> {/* ← cierra el <div className="container mt-4"> */}

<ToastContainer position="top-right" autoClose={3000} hideProgressBar />

        </>

    );
};

export default DetalleEventoCreador;