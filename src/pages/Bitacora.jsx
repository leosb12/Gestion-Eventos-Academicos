import React, { useEffect, useState, useMemo } from 'react';
import supabase from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function Bitacora() {
  const [logs, setLogs] = useState([]);
  const [verificado, setVerificado] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [rangeType, setRangeType] = useState('month');
  const [customDates, setCustomDates] = useState({ from: '', to: '' });
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function verificarPermiso() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/');
      setUserEmail(user.email);
      const { data: usuario } = await supabase
        .from('usuario')
        .select('id_tipo_usuario')
        .eq('correo', user.email)
        .single();
      if (usuario?.id_tipo_usuario !== 7) return navigate('/');
      setVerificado(true);
    }
    verificarPermiso();
  }, [navigate]);

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

  const filtered = useMemo(() => {
    const txt = search.toLowerCase();
    const today = new Date();
    let from, to;
    if (rangeType === 'week') {
      from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
      to = today;
    } else if (rangeType === 'month') {
      from = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      to = today;
    } else if (rangeType === 'custom') {
      from = customDates.from ? new Date(customDates.from) : null;
      to = customDates.to ? new Date(customDates.to) : null;
    }
    return logs.filter(log => {
      const date = new Date(log.created_at);
      const matchText = log.actor_email.toLowerCase().includes(txt) || log.description.toLowerCase().includes(txt);
      const matchAction = actionFilter === 'all' || log.accion.startsWith(actionFilter);
      const inRange = !from || !to || (date >= from && date <= to);
      return matchText && matchAction && inRange;
    });
  }, [logs, search, actionFilter, rangeType, customDates]);

  const badgeVariant = accion => {
    if (accion.startsWith('INSERT')) return 'success';
    if (accion.startsWith('DELETE')) return 'danger';
    if (accion.startsWith('UPDATE')) return 'warning';
    return 'secondary';
  };

  const getFilename = ext => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeEmail = userEmail.replace(/[@.]/g, '_');
    return `Bitacora_${safeEmail}_${timestamp}.${ext}`;
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(20);
    doc.setTextColor(54, 95, 145);
    doc.text('Bitácora de Actividades', pageWidth / 2, 60, { align: 'center' });
    autoTable(doc, {
      margin: { top: 90, left: 40, right: 40, bottom: 40 },
      headStyles: { fillColor: [54, 95, 145], textColor: 255, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 10, cellPadding: 10 },
      columnStyles: { description: { cellWidth: 180 }, created_at: { cellWidth: 100 } },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      head: [['Usuario', 'IP', 'Acción', 'Descripción', 'Fecha y hora']],
      body: filtered.map(l => [
        l.actor_email,
        l.actor_ip || '—',
        l.accion.replace('_', ' '),
        l.description,
        new Date(l.created_at).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
      ])
    });
    doc.save(getFilename('pdf'));
  };

  // Export Excel
  async function exportExcel() {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'TuApp';
    const ws = wb.addWorksheet('Bitácora', { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = [
      { header: 'Usuario', key: 'actor_email', width: 35 },
      { header: 'IP', key: 'actor_ip', width: 20 },
      { header: 'Acción', key: 'accion', width: 20 },
      { header: 'Descripción', key: 'description', width: 60 },
      { header: 'Fecha y hora', key: 'created_at', width: 30 }
    ];
    const headerRow = ws.getRow(1);
    headerRow.height = 24;
    headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
    filtered.forEach((l, i) => {
      const row = ws.addRow({
        actor_email: l.actor_email,
        actor_ip: l.actor_ip || '',
        accion: l.accion.replace('_', ' '),
        description: l.description,
        created_at: new Date(l.created_at).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
      });
      row.height = 20;
      row.eachCell((cell, colNumber) => {
        if (i % 2 === 0 && colNumber <= ws.columns.length) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
        }
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
    });
    ws.autoFilter = { from: 'A1', to: 'E1' };
    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), getFilename('xlsx'));
  }

  if (!verificado) return <p className="text-center mt-5">Verificando acceso…</p>;

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="card shadow-sm rounded-2">
          <div className="card-header bg-white">
            <h2 className="mb-3">Bitácora de Actividades</h2>
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <input
                className="form-control"
                placeholder="Buscar…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ minWidth: 200 }}
              />
              <select className="form-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                <option value="all">Todas las acciones</option>
                <option value="INSERT">Insert</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </select>
              <select className="form-select" value={rangeType} onChange={e => setRangeType(e.target.value)}>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="custom">Rango personalizado</option>
              </select>
              {rangeType === 'custom' && (
                <>
                  <input type="date" className="form-control" value={customDates.from} onChange={e => setCustomDates({ ...customDates, from: e.target.value })} />
                  <input type="date" className="form-control" value={customDates.to} onChange={e => setCustomDates({ ...customDates, to: e.target.value })} />
                </>
              )}
              <button className="btn btn-outline-primary fw-bold" onClick={exportPDF}>
                📄 PDF
              </button>
              <button className="btn btn-outline-success fw-bold" onClick={exportExcel}>
                📑 Excel
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive" style={{ maxHeight: '60vh' }}>
              <table className="table table-striped table-hover table-sm mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Usuario</th>
                    <th>IP</th>
                    <th>Acción</th>
                    <th>Descripción</th>
                    <th>Fecha y hora</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log, i) => (
                    <tr key={i}>
                      <td>{log.actor_email}</td>
                      <td>{log.actor_ip || '—'}</td>
                      <td>
                        <span className={`badge bg-${badgeVariant(log.accion)} text-uppercase`}>
                          {log.accion.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-truncate" style={{ maxWidth: 300 }}>{log.description}</td>
                      <td>{new Date(log.created_at).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">No hay registros que mostrar</td>
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
}
