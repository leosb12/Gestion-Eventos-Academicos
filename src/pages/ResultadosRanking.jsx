import React, { useEffect, useState } from 'react';
import supabase            from '../utils/supabaseClient';
import Navbar              from '../components/Navbar';
import { Card, Badge }     from 'react-bootstrap';

/* ───────── helpers UI ───────── */
const MEDALS  = ['🥇', '🥈', '🥉'];
const BADGE   = { Básico: 'success', Intermedio: 'warning', Avanzado: 'danger' };
const EMPTY   = [];          // evita errores con nulls / undefined

/* ────────────────────────────── */
const ResultadosRanking = () => {
  const [cards,   setCards]   = useState([]);  // [{evento,fecha,isFeria,agrupado}]
  const [rowOpen, setRowOpen] = useState({});  // row.id → bool

  /* Toggle fila desplegable */
  const toggleRow = id => setRowOpen(p => ({ ...p, [id]: !p[id] }));

  /* ───── CARGA INICIAL ───── */
  useEffect(() => {
    (async () => {
      /* 1️⃣  Publicaciones oficiales */
      const { data: pubs } = await supabase
        .from('publicacion_ranking')
        .select('id_evento, fecha_publicacion')
        .order('fecha_publicacion', { ascending: false });

      if (!pubs?.length) return;

      const idsEvento = pubs.map(p => p.id_evento);

      /* 2️⃣  Catálogos base */
      const [{ data: eventos },
             { data: matRaw },
             { data: nivRaw }] = await Promise.all([
        supabase.from('evento') .select('*').in('id', idsEvento),
        supabase.from('materia').select('id, nombre'),
        supabase.from('nivel')  .select('id, nombre')
      ]);

      const matNom = Object.fromEntries((matRaw || EMPTY).map(m => [m.id, m.nombre]));
      const nivNom = Object.fromEntries((nivRaw || EMPTY).map(n => [n.id, n.nombre]));

      /* 3️⃣  Mentores (tipo_usuario = 8) */
      const { data: mentorRaw } = await supabase
        .from('usuario')
        .select('id, nombre')
        .eq('id_tipo_usuario', 8);
      const mentorNom = Object.fromEntries((mentorRaw || EMPTY).map(m => [m.id, m.nombre]));

      /* 4️⃣  Procesar evento por evento */
      const tarjetas = await Promise.all(
        (eventos || EMPTY).map(async ev => {
          const isFeria = ev.id_tevento === 2;   // Feria: Materia ▸ Nivel
          const isHack  = ev.id_tevento === 4;   // Hackatón: solo Nivel (sin “Proyecto”)

          /* Equipos del evento */
          const { data: eqs } = await supabase
            .from('equipo')
            .select('id, nombre, mentor_id')
            .eq('id_evento', ev.id);

          const eqIds = (eqs || EMPTY).map(e => e.id);
          if (!eqIds.length) {
            return {
              evento: ev,
              fecha : pubs.find(p => p.id_evento === ev.id)?.fecha_publicacion,
              agrupado: {},
              isFeria
            };
          }

          /* Niveles por equipo */
          const { data: nivEq } = await supabase
            .from('nivelgrupo')
            .select('id_equipo, id_nivel')
            .in('id_equipo', eqIds);
          const nivelPorEq = Object.fromEntries(
            (nivEq || EMPTY).map(r => [r.id_equipo, nivNom[r.id_nivel] || 'Sin nivel'])
          );

          /* Integrantes por equipo */
          const { data: memb } = await supabase
            .from('miembrosequipo')
            .select('id_equipo, usuario:usuario(id, nombre)')
            .in('id_equipo', eqIds);
          const intPorEq = {};
          (memb || EMPTY).forEach(r => {
            if (!intPorEq[r.id_equipo]) intPorEq[r.id_equipo] = [];
            intPorEq[r.id_equipo].push(r.usuario?.nombre || '—');
          });

          /* Puntajes reales */
          const { data: evals } = await supabase
            .from('evaluacion')
            .select('id_equipo, puntaje')
            .in('id_equipo', eqIds);
          const puntajeEq = Object.fromEntries(
            (evals || EMPTY).map(e => [e.id_equipo, e.puntaje])
          );

          /* Map rápido equipo → objeto */
          const eqById = Object.fromEntries((eqs || EMPTY).map(e => [e.id, e]));

          /* ── AGRUPADO ──────────────────────────
             Feria  → { materia: { nivel: [rows] } }
             Hack   → { nivel  : [rows] }
          */

          const agrupado = {};

          /* Feria: requiere proyectos */
          if (isFeria) {
            const { data: projs } = await supabase
              .from('proyecto')
              .select('*')
              .in('id_equipo', eqIds);

            (projs || EMPTY).forEach(p => {
              const eq     = eqById[p.id_equipo] || {};
              const nivel  = nivelPorEq[eq.id]    || 'Sin nivel';
              const materia = matNom[p.id_materia] || 'Sin materia';

              const row = {
                id: p.id,                               // único para toggle
                proyecto: p.nombre,
                equipo  : eq.nombre,
                mentor  : mentorNom[eq.mentor_id] || '—',
                integrantes: intPorEq[eq.id] || EMPTY,
                puntaje    : puntajeEq[eq.id] ?? 0
              };

              if (!agrupado[materia])              agrupado[materia]       = {};
              if (!agrupado[materia][nivel])       agrupado[materia][nivel]= [];
              agrupado[materia][nivel].push(row);
            });

            /* ordenar desc */
            Object.values(agrupado).forEach(nivObj =>
              Object.values(nivObj).forEach(lst => lst.sort((a, b) => b.puntaje - a.puntaje))
            );
          }

          /* Hackatón: SIN proyectos (solo equipo) */
          if (isHack) {
            (eqs || EMPTY).forEach(eq => {
              const nivel = nivelPorEq[eq.id] || 'Sin nivel';

              const row = {
                id   : eq.id,
                proyecto: null,                      // columna oculta
                equipo  : eq.nombre,
                mentor  : mentorNom[eq.mentor_id] || '—',
                integrantes: intPorEq[eq.id] || EMPTY,
                puntaje    : puntajeEq[eq.id] ?? 0
              };

              if (!agrupado[nivel]) agrupado[nivel] = [];
              agrupado[nivel].push(row);
            });

            /* ordenar desc */
            Object.values(agrupado).forEach(lst => lst.sort((a, b) => b.puntaje - a.puntaje));
          }

          return {
            evento: ev,
            fecha : pubs.find(p => p.id_evento === ev.id)?.fecha_publicacion,
            agrupado,
            isFeria
          };
        })
      );

      setCards(tarjetas);
    })();
  }, []);

  /* ───── RENDER ───── */
  return (
    <>
      <Navbar />
      <div className="container my-4">
        <h2 className="mb-4 text-center">🏆 Resultados publicados</h2>

        {cards.length === 0 && (
          <p className="text-center text-muted">No hay rankings publicados todavía.</p>
        )}

        {cards.map(({ evento, fecha, agrupado, isFeria }) => (
          <Card key={evento.id} className="mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <strong>{evento.nombre}</strong>{' '}
              <small className="fst-italic">
                (publicado {fecha ? new Date(fecha).toLocaleDateString() : '—'})
              </small>
            </Card.Header>

            <Card.Body>
              {/* Imagen / banner */}
              <div className="text-center mb-4">
                <img
                  src={evento.imagen_url || '/noDisponible.jpg'}
                  alt="banner evento"
                  className="img-fluid rounded"
                  style={{ maxHeight: 220, objectFit: 'cover' }}
                />
              </div>

              {Object.keys(agrupado).length === 0 && (
                <p className="text-muted">Sin datos de equipos.</p>
              )}

              {/* Hackatón → solo niveles */}
              {!isFeria &&
                Object.entries(agrupado).map(([nivel, lista]) => (
                  <SectionNivel
                    key={nivel}
                    nivel={nivel}
                    lista={lista}
                    rowOpen={rowOpen}
                    toggleRow={toggleRow}
                    hasProyecto={false}
                  />
                ))}

              {/* Feria → Materia ▸ Nivel */}
              {isFeria &&
                Object.entries(agrupado).map(([materia, nivObj]) => (
                  <div key={materia} className="mb-4" style={{ borderLeft: '4px solid #0d6efd' }}>
                    <h5 className="fw-semibold ps-2 mb-3">📚 {materia}</h5>
                    {Object.entries(nivObj).map(([nivel, lista]) => (
                      <SectionNivel
                        key={nivel}
                        nivel={nivel}
                        lista={lista}
                        rowOpen={rowOpen}
                        toggleRow={toggleRow}
                        hasProyecto={true}
                        indent
                      />
                    ))}
                  </div>
                ))}
            </Card.Body>
          </Card>
        ))}
      </div>
    </>
  );
};

/* ═════ sub-componentes ═════ */
const SectionNivel = ({ nivel, lista, rowOpen, toggleRow, hasProyecto, indent = false }) => (
  <div className="mb-4">
    <h6 className={`fw-semibold mb-2 ${indent ? 'ps-2' : ''}`}>
      <Badge bg={BADGE[nivel] || 'secondary'} className="me-2">
        {nivel}
      </Badge>
    </h6>
    <Tabla lista={lista} rowOpen={rowOpen} toggleRow={toggleRow} hasProyecto={hasProyecto} />
  </div>
);

const Tabla = ({ lista, rowOpen, toggleRow, hasProyecto }) => (
  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
    <table className="table table-sm table-bordered text-center align-middle mb-0">
      <thead className="table-light sticky-top">
        <tr>
          <th style={{ width: 55 }}>#</th>
          {hasProyecto && <th>Proyecto</th>}
          <th>Equipo</th>
          <th>Mentor</th>
          <th style={{ width: 85 }}>Puntaje</th>
        </tr>
      </thead>
      <tbody>
        {lista.map((row, idx) => {
          const open  = rowOpen[row.id];
          const medal = MEDALS[idx] || '';
          const cls =
            idx === 0
              ? 'table-warning fw-bold'
              : idx === 1
              ? 'table-secondary fw-bold'
              : idx === 2
              ? 'table-info fw-bold'
              : '';

          return (
            <React.Fragment key={row.id}>
              <tr className={cls}>
                <td>
                  <button
                    className="btn btn-sm btn-link p-0 me-1"
                    onClick={() => toggleRow(row.id)}
                  >
                    {open ? '▾' : '▸'}
                  </button>
                  {medal} {idx + 1}
                </td>

                {hasProyecto && <td>{row.proyecto || '—'}</td>}
                <td>{row.equipo}</td>
                <td>{row.mentor}</td>
                <td>{row.puntaje}</td>
              </tr>

              {open && (
                <tr>
                  <td colSpan={hasProyecto ? 5 : 4} className="bg-light text-start">
                    <strong>Integrantes:</strong>{' '}
                    {row.integrantes.length ? row.integrantes.join(', ') : '— Sin integrantes —'}
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default ResultadosRanking;
