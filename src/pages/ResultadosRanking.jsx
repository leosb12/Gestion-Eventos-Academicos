import React, { useEffect, useState } from 'react';
import supabase            from '../utils/supabaseClient';
import Navbar              from '../components/Navbar';
import { Card, Badge }     from 'react-bootstrap';

/* ───────── helpers UI ───────── */
const medals  = ['🥇','🥈','🥉'];
const bColor  = { Básico:'success', Intermedio:'warning', Avanzado:'danger' };
const EMPTY   = [];

/* ────────────────────────────── */
const ResultadosRanking = () => {
  const [cards, setCards]   = useState([]);   // [{evento,fecha,isFeria,agrupado}]
  const [rowOpen,setRowOpen]= useState({});   // p.id → bool

  const toggleRow = id => setRowOpen(p=>({...p,[id]:!p[id]}));

  /* ───── carga inicial ───── */
  useEffect(() => {
    (async () => {
      /* 1️⃣ publicaciones ya oficiales */
      const { data: pubs } = await supabase
        .from('publicacion_ranking')
        .select('id_evento, fecha_publicacion')
        .order('fecha_publicacion',{ascending:false});

      if(!pubs?.length) return;

      /* 2️⃣ catálogos */
      const idsEvento = pubs.map(p=>p.id_evento);
      const [{data:eventos},{data:mats},{data:nivs}] = await Promise.all([
        supabase.from('evento') .select('*').in('id',idsEvento),
        supabase.from('materia').select('id,nombre'),
        supabase.from('nivel')  .select('id,nombre')
      ]);
      const matNom = Object.fromEntries((mats||EMPTY).map(m=>[m.id,m.nombre]));
      const nivNom = Object.fromEntries((nivs||EMPTY).map(n=>[n.id,n.nombre]));

      /* 3️⃣ mentores (pueden no existir) */
      const { data: mentors } = await supabase
        .from('usuario')
        .select('id,nombre')
        .eq('id_tipo_usuario',8);
      const mentorNom = Object.fromEntries((mentors||EMPTY).map(m=>[m.id,m.nombre]));

      /* 4️⃣ procesar evento por evento */
      const tarjetas = await Promise.all(
        (eventos||EMPTY).map(async ev => {
          /* equipos del evento */
          const { data:eqs } = await supabase
            .from('equipo')
            .select('id,nombre,mentor_id')
            .eq('id_evento',ev.id);

          const eqIds = (eqs||EMPTY).map(e=>e.id);
          if(!eqIds.length) return {
            evento:ev, fecha:pubs.find(p=>p.id_evento===ev.id)?.fecha_publicacion,
            agrupado:{}, isFeria:false
          };

          /* proyectos de *esos* equipos */
          const { data:projs } = await supabase
            .from('proyecto')
            .select('*')
            .in('id_equipo',eqIds);

          /* ¿Hay alguna materia real?  (≠ null) */
          const isFeria = projs?.some(pr=>pr.id_materia !== null && pr.id_materia !== undefined);

          /* niveles por equipo */
          const { data:nivEq } = await supabase
            .from('nivelgrupo')
            .select('id_equipo,id_nivel')
            .in('id_equipo',eqIds);
          const nivPorEq = Object.fromEntries(
            (nivEq||EMPTY).map(r=>[r.id_equipo, nivNom[r.id_nivel] ?? 'Sin nivel'])
          );

          /* integrantes por equipo */
          const { data:memb } = await supabase
            .from('miembrosequipo')
            .select('id_equipo, usuario:usuario(id,nombre)')
            .in('id_equipo',eqIds);

          const intPorEq={};
          (memb||EMPTY).forEach(r=>{
            if(!intPorEq[r.id_equipo]) intPorEq[r.id_equipo]=[];
            intPorEq[r.id_equipo].push(r.usuario?.nombre ?? '—');
          });

          const eqById = Object.fromEntries((eqs||EMPTY).map(e=>[e.id,e]));

          /* ─── AGRUPADO ───
             Feria   → { materia: { nivel: [rows] } }
             Hack    → { nivel  : [rows] }
          */
          const agrupado = {};

          (projs||EMPTY).forEach(p=>{
            const eq     = eqById[p.id_equipo] || {};
            const nivel  = nivPorEq[eq.id]      || 'Sin nivel';
            const row = {
              ...p,
              equipo:       eq,
              mentor:       mentorNom[eq.mentor_id] ?? '—',
              integrantes:  intPorEq[eq.id] || EMPTY,
              puntaje:      70+Math.floor(Math.random()*31)  // temporal
            };

            if(isFeria){
              const materia = matNom[p.id_materia] ?? 'Sin materia';
              if(!agrupado[materia])                agrupado[materia]       = {};
              if(!agrupado[materia][nivel])         agrupado[materia][nivel]= [];
              agrupado[materia][nivel].push(row);
            }else{ // hack
              if(!agrupado[nivel]) agrupado[nivel]=[];
              agrupado[nivel].push(row);
            }
          });

          /* ordenar desc. puntaje */
          if(isFeria){
            Object.values(agrupado).forEach(obj =>
              Object.values(obj).forEach(lst => lst.sort((a,b)=>b.puntaje-a.puntaje))
            );
          }else{
            Object.values(agrupado).forEach(lst => lst.sort((a,b)=>b.puntaje-a.puntaje));
          }

          return {
            evento: ev,
            fecha : pubs.find(p=>p.id_evento===ev.id)?.fecha_publicacion,
            agrupado, isFeria
          };
        })
      );

      setCards(tarjetas);
    })();
  },[]);

  /* ───── render ───── */
  return (
    <>
      <Navbar/>
      <div className="container my-4">
        <h2 className="mb-4 text-center">🏆 Resultados publicados</h2>

        {cards.length===0 &&
          <p className="text-center text-muted">No hay rankings publicados todavía.</p>
        }

        {cards.map(({evento,fecha,agrupado,isFeria})=>(
          <Card key={evento.id} className="mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <strong>{evento.nombre}</strong>{' '}
              <small className="fst-italic">
                (publicado {fecha ? new Date(fecha).toLocaleDateString() : '—'})
              </small>
            </Card.Header>

            <Card.Body>
              <div className="text-center mb-4">
                <img
                  src={evento.imagen_url || '/noDisponible.jpg'}
                  alt="banner evento"
                  className="img-fluid rounded"
                  style={{maxHeight:220,objectFit:'cover'}}
                />
              </div>

              {Object.keys(agrupado).length===0 && (
                <p className="text-muted">Sin datos de proyectos.</p>
              )}

              {/* Hackatón → solo niveles */}
              {!isFeria && Object.entries(agrupado).map(([nivel,lst])=>(
                <SectionNivel
                  key={nivel}
                  nivel={nivel}
                  lista={lst}
                  rowOpen={rowOpen}
                  toggleRow={toggleRow}
                />
              ))}

              {/* Feria → Materia ▸ Nivel */}
              {isFeria && Object.entries(agrupado).map(([materia,nivObj])=>(
                <div key={materia} className="mb-4" style={{borderLeft:'4px solid #0d6efd'}}>
                  <h5 className="fw-semibold ps-2 mb-3">📚 {materia}</h5>
                  {Object.entries(nivObj).map(([nivel,lst])=>(
                    <SectionNivel
                      key={nivel}
                      nivel={nivel}
                      lista={lst}
                      rowOpen={rowOpen}
                      toggleRow={toggleRow}
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

/* ───────── sub-componentes ───────── */
const SectionNivel = ({nivel,lista,rowOpen,toggleRow,indent=false})=>(
  <div className="mb-4">
    <h6 className={`fw-semibold mb-2 ${indent?'ps-2':''}`}>
      <Badge bg={bColor[nivel]||'secondary'} className="me-2">{nivel}</Badge>
    </h6>
    <Tabla lista={lista} rowOpen={rowOpen} toggleRow={toggleRow}/>
  </div>
);

const Tabla = ({lista,rowOpen,toggleRow})=>(
  <div style={{maxHeight:400,overflowY:'auto'}}>
    <table className="table table-sm table-bordered text-center align-middle mb-0">
      <thead className="table-light sticky-top">
        <tr>
          <th style={{width:55}}>#</th><th>Proyecto</th><th>Equipo</th>
          <th>Mentor</th><th style={{width:85}}>Puntaje</th>
        </tr>
      </thead>
      <tbody>
        {lista.map((p,idx)=>{
          const open   = rowOpen[p.id];
          const medal  = medals[idx]||'';
          const rowCls =
            idx===0?'table-warning fw-bold':
            idx===1?'table-secondary fw-bold':
            idx===2?'table-info fw-bold':'';

          return (
            <React.Fragment key={p.id}>
              <tr className={rowCls}>
                <td>
                  <button
                    className="btn btn-sm btn-link p-0 me-1"
                    onClick={()=>toggleRow(p.id)}
                  >
                    {open?'▾':'▸'}
                  </button>
                  {medal} {idx+1}
                </td>
                <td>{p.nombre}</td>
                <td>{p.equipo?.nombre ?? '—'}</td>
                <td>{p.mentor}</td>
                <td>{p.puntaje}</td>
              </tr>

              {open && (
                <tr>
                  <td colSpan={5} className="bg-light text-start">
                    <strong>Integrantes:</strong>{' '}
                    {p.integrantes.length ? p.integrantes.join(', ') : '— Sin integrantes —'}
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
