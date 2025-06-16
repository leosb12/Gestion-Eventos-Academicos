import React, {useEffect, useState} from 'react';
import Navbar from '../components/Navbar';
import supabase from '../utils/supabaseClient';
import {UserAuth} from '../context/AuthContext.jsx';
import {obtenerURLInforme} from '../utils/obtenerURLInforme';

const MisProyectos = () => {
    const {session, tipoUsuario} = UserAuth();
    const [proyectos, setProyectos] = useState([]);
    const [mensaje, setMensaje] = useState('');
    const [archivos, setArchivos] = useState({});
    const [subiendo, setSubiendo] = useState({});
    const [pendientes, setPendientes] = useState([]);
    const [fechaLimite, setFechaLimite] = useState({});
    const [rechazoMotivo, setRechazoMotivo] = useState({});

    useEffect(() => {
        const cargarProyectos = async () => {
            setMensaje('');
            if (!session?.user?.email) return;

            const {data: usuario} = await supabase
                .from('usuario')
                .select('id')
                .eq('correo', session.user.email)
                .maybeSingle();

            if (!usuario) {
                setMensaje('No se pudo obtener tu usuario.');
                return;
            }

            const {data: miembros} = await supabase
                .from('miembrosequipo')
                .select('id_equipo')
                .eq('id_usuario', usuario.id);

            if (!miembros || miembros.length === 0) {
                setMensaje('No formas parte de ningún equipo.');
                return;
            }

            const equiposIds = miembros.map(m => m.id_equipo);

            const {data: proyectosData, error} = await supabase
                .from('proyecto')
                .select('id, nombre, descripcion, url_informe, id_estado_proyecto, equipo(nombre)')
                .in('id_equipo', equiposIds);

            if (error) {
                console.error('Error al obtener proyectos:', error);
                setMensaje('Error al obtener tus proyectos.');
                return;
            }

            setProyectos(proyectosData || []);
        };

        cargarProyectos();
    }, [session]);

    useEffect(() => {
        if (tipoUsuario === 6 || tipoUsuario === 7) {
            cargarPendientes();
        }
    }, [tipoUsuario]);

    const cargarPendientes = async () => {
        const {data} = await supabase
            .from('proyecto')
            .select('*, equipo(nombre)')
            .eq('id_estado_proyecto', 1);

        setPendientes(data || []);
    };

    const estadoTexto = (id_estado) => {
        switch (id_estado) {
            case 1:
                return '⏳ Pendiente de Revisión';
            case 2:
                return '✅ Aprobado';
            case 3:
                return '❌ Rechazado';
            default:
                return 'Desconocido';
        }
    };

    const handleArchivo = (idProyecto, archivo) => {
        setArchivos(prev => ({...prev, [idProyecto]: archivo}));
    };

    const subirArchivo = async (proyecto) => {
        const archivo = archivos[proyecto.id];
        if (!archivo) return;
        setSubiendo(prev => ({...prev, [proyecto.id]: true}));

        const nombreArchivo = `${Date.now()}_${archivo.name}`;

        const {error: errorUpload} = await supabase
            .storage
            .from('informes')
            .upload(nombreArchivo, archivo);

        if (!errorUpload) {
            await supabase
                .from('proyecto')
                .update({url_informe: nombreArchivo})
                .eq('id', proyecto.id);

            setProyectos(prev =>
                prev.map(p => p.id === proyecto.id ? {...p, url_informe: nombreArchivo} : p)
            );
        }

        setSubiendo(prev => ({...prev, [proyecto.id]: false}));
    };

    const aprobarProyecto = async (id) => {
        if (!fechaLimite[id]) {
            alert("Debes seleccionar una fecha límite.");
            return;
        }

        const {error} = await supabase
            .from('proyecto')
            .update({
                id_estado_proyecto: 2,
                fecha_limite: fechaLimite[id],
            })
            .eq('id', id);

        if (!error) {
            alert("Proyecto aprobado correctamente.");
            setPendientes(prev => prev.filter(p => p.id !== id));
        }
    };

    const rechazarProyecto = async (id) => {
        if (!rechazoMotivo[id]) {
            alert("Debes ingresar un motivo para rechazar.");
            return;
        }

        const {error} = await supabase
            .from('proyecto')
            .update({
                id_estado_proyecto: 3,
                motivo: rechazoMotivo[id],
            })
            .eq('id', id);

        if (!error) {
            alert("Proyecto rechazado correctamente.");
            setPendientes(prev => prev.filter(p => p.id !== id));
        }
    };

    return (
        <>
            <Navbar/>
            <div className="container mt-4">
                <h2>Mis Proyectos</h2>

                {mensaje && <div className="alert alert-info">{mensaje}</div>}

                {proyectos.map((proyecto) => (
                    <div key={proyecto.id} className="card p-4 mt-3 shadow-sm">
                        <h4 className="mb-3">Proyecto del equipo: <strong>{proyecto.equipo?.nombre}</strong></h4>
                        <p><strong>Nombre del proyecto:</strong> {proyecto.nombre}</p>
                        <p><strong>Descripción:</strong> {proyecto.descripcion}</p>
                        <p><strong>Estado:</strong> {estadoTexto(proyecto.id_estado_proyecto)}</p>

                        {proyecto.url_informe ? (
                            <div className="mt-3">
                                <a
                                    href={obtenerURLInforme(proyecto.url_informe)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-success"
                                >
                                    Ver informe PDF
                                </a>
                            </div>
                        ) : (
                            <div className="mt-4">
                                <label className="form-label"><strong>Subir Informe Final (PDF):</strong></label>
                                <input type="file" className="form-control mb-2" accept="application/pdf"
                                       onChange={(e) => handleArchivo(proyecto.id, e.target.files[0])}/>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => subirArchivo(proyecto)}
                                    disabled={subiendo[proyecto.id]}
                                >
                                    {subiendo[proyecto.id] ? 'Subiendo...' : 'Subir Informe'}
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {(tipoUsuario === 6 || tipoUsuario === 7) && (
                    <div className="mt-5">
                        <hr/>
                        <h3 className="mb-4">Organizador: Revisión de Proyectos</h3>

                        {pendientes.length === 0 ? (
                            <p>No hay proyectos pendientes de revisión.</p>
                        ) : (
                            pendientes.map((p) => (
                                <div key={p.id} className="card mb-3 p-3 shadow-sm">
                                    <h5>{p.nombre}</h5>
                                    <p><strong>Equipo:</strong> {p.equipo?.nombre || 'Sin nombre'}</p>
                                    <p><strong>Descripción:</strong> {p.descripcion}</p>
                                    <p>
                                        {p.url_informe ? (
                                            <a
                                                href={obtenerURLInforme(p.url_informe)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Ver archivo
                                            </a>
                                        ) : (
                                            <em>Sin archivo subido</em>
                                        )}
                                    </p>

                                    <div className="row g-2 mt-2">
                                        <div className="col-md-4">
                                            <label className="form-label">Fecha límite:</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                onChange={(e) =>
                                                    setFechaLimite(prev => ({...prev, [p.id]: e.target.value}))
                                                }
                                            />
                                        </div>
                                        <div className="col-md-4 align-self-end">
                                            <button className="btn btn-success w-100"
                                                    onClick={() => aprobarProyecto(p.id)}>
                                                ✅ Aprobar
                                            </button>
                                        </div>
                                        <div className="col-md-4 align-self-end">
                                            <input
                                                type="text"
                                                placeholder="Motivo de rechazo"
                                                className="form-control mb-2"
                                                onChange={(e) =>
                                                    setRechazoMotivo(prev => ({...prev, [p.id]: e.target.value}))
                                                }
                                            />
                                            <button className="btn btn-danger w-100"
                                                    onClick={() => rechazarProyecto(p.id)}>
                                                ❌ Rechazar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default MisProyectos;
