import { useState, useEffect } from "react";
import supabase from "../utils/supabaseClient";

export default function BuscadorEventos() {
  const [termino, setTermino] = useState("");
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    const buscarEventos = async () => {
      const texto = termino.trim();
      if (texto.length < 3) {
        setResultados([]);
        return;
      }

      const { data, error } = await supabase
        .from("evento")
        .select("*")
        .or(`nombre.ilike.${texto}%,nombre.ilike.% ${texto}%`);

      if (!error) {
        setResultados(data);
      }
    };

    buscarEventos();
  }, [termino]);

  return (
    <div className="position-relative d-flex align-items-center">
      <span className="fs-5 me-2" role="img" aria-label="Buscar">
        🔍
      </span>
      <input
        type="text"
        className="px-2 py-1 rounded"
        placeholder="Buscar evento..."
        value={termino}
        onChange={(e) => setTermino(e.target.value)}
        style={{
          width: "200px",
          backgroundColor: "white",
          color: "black",
          border: "1px solid #ccc",
        }}
      />

      {resultados.length > 0 && (
        <div
          className="position-absolute mt-2 shadow-sm"
          style={{
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 999,
            backgroundColor: "white",
            borderRadius: "6px",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          <ul className="list-unstyled m-0 p-0">
            {resultados.map((evento) => (
              <li key={evento.id}>
                <a
                  href={`/evento/${evento.id}`}
                  className="d-block px-3 py-2 text-dark text-decoration-none"
                  style={{ transition: "background 0.2s ease" }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "#f1f1f1")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {evento.nombre}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
