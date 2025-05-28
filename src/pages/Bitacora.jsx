import React, { useEffect, useState } from 'react';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

const Bitacora = () => {
  const [logs, setLogs] = useState([]);
  const [verificado, setVerificado] = useState(false);
  const [filtro, setFiltro] = useState('');
  const navigate = useNavigate();

  // 1️⃣ Verifica que sea admin
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

  // 2️⃣ Carga logs una vez verificado
  useEffect(() => {
    if (!verificado) return;
    (async () => {
      const { data } = await supabase
        .from('bitacora')
        .select('actor_email,actor_ip,accion,description,created_at')
        .order('created_at', { ascending: false });
      setLogs(data || []);
    })();
  }, [verificado]);

  if (!verificado) {
    return <p className="text-center mt-5">Verificando acceso…</p>;
  }

  // 3️⃣ Filtra en memoria por email o descripción
  const filtered = logs.filter(
    l =>
      l.actor_email.toLowerCase().includes(filtro.toLowerCase()) ||
      l.description.toLowerCase().includes(filtro.toLowerCase())
  );

  // 4️⃣ Decide color de badge según tipo de acción
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
              placeholder="Filtrar por usuario o descripción…"
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
          </div>
          <div className="card-body p-0">
            <div className="table-responsive" style={{ maxHeight: '60vh' }}>
              <table className="table table-striped table-hover table-sm mb-0">
                <thead className="bg-light">
                  <tr>
                    <th scope="col" className="fw-semibold text-uppercase fs-6">Usuario</th>
                    <th scope="col" className="fw-semibold text-uppercase fs-6">IP</th>
                    <th scope="col" className="fw-semibold text-uppercase fs-6">Acción</th>
                    <th scope="col" className="fw-semibold text-uppercase fs-6">Descripción</th>
                    <th scope="col" className="fw-semibold text-uppercase fs-6">Fecha y hora</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log, i) => (
                    <tr key={i}>
                      <td className="fw-medium">{log.actor_email}</td>
                      <td className="text-nowrap">{log.actor_ip || '—'}</td>
                      <td>
                        <span className={`badge bg-${badgeVariant(log.accion)} text-uppercase`}>
                          {log.accion.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-truncate" style={{ maxWidth: 300 }}>
                        {log.description}
                      </td>
                      <td className="text-nowrap">
                        {new Date(log.created_at).toLocaleString(undefined, {
                          hour12: false
                        })}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">
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
