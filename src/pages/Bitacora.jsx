import React, { useEffect, useState } from 'react';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

const Bitacora = () => {
  const [logs, setLogs] = useState([]);
  const [verificado, setVerificado] = useState(false);
  const [filtro, setFiltro] = useState('');
  const navigate = useNavigate();

  // Verifica que sea admin
  useEffect(() => {
    const verificarPermiso = async () => {
      const { data: sessionData } = await supabase.auth.getUser();
      if (!sessionData?.user) return navigate('/');
      const correo = sessionData.user.email;
      const { data: usuario } = await supabase
        .from('usuario')
        .select('id_tipo_usuario')
        .eq('correo', correo)
        .single();
      if (usuario?.id_tipo_usuario !== 7) return navigate('/');
      setVerificado(true);
    };
    verificarPermiso();
  }, [navigate]);

  // Carga logs una vez verificado
  useEffect(() => {
    if (!verificado) return;
    (async () => {
      const { data } = await supabase
        .from('bitacora')
        .select('actor_email,accion,description,created_at')
        .order('created_at', { ascending: false });
      setLogs(data || []);
    })();
  }, [verificado]);

  if (!verificado) {
    return <p className="text-center mt-5">Verificando acceso…</p>;
  }

  // Filtra en memoria por email o descripción
  const filtered = logs.filter(
    l =>
      l.actor_email.toLowerCase().includes(filtro.toLowerCase()) ||
      l.description.toLowerCase().includes(filtro.toLowerCase())
  );

  // Decide color de badge según tipo
  const badgeVariant = accion => {
    if (accion.startsWith('INSERT')) return 'success';
    if (accion.startsWith('DELETE')) return 'danger';
    if (accion.startsWith('UPDATE')) return 'warning';
    return 'secondary';
  };

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="card shadow-sm rounded-2">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Bitácora de Actividades</h2>
            <input
              type="text"
              className="form-control w-auto"
              style={{ minWidth: 200 }}
              placeholder="Filtrar…"
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Descripción</th>
                    <th>Fecha y hora</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log, i) => (
                    <tr key={i}>
                      <td>{log.actor_email}</td>
                      <td>
                        <span
                          className={`badge bg-${badgeVariant(
                            log.accion
                          )} text-uppercase`}
                        >
                          {log.accion.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{log.description}</td>
                      <td>
                        {new Date(log.created_at).toLocaleString(undefined, {
                          hour12: false
                        })}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted">
                        No hay registros que mostrar
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Bitacora;