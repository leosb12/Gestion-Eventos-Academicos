import React from "react";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { useParams } from "react-router-dom";
import supabase from "../utils/supabaseClient";
import { toast } from "react-toastify";

export async function enviarCertificadosParaTodos(id_evento) {
  try {
    id_evento = typeof id_evento === 'object' ? id_evento.id : parseInt(id_evento);
    console.log("📨 Enviando certificados para evento:", id_evento);

    const { data: usuarios, error } = await supabase
      .from("inscripcionevento")
      .select("id_usuario")
      .eq("id_evento", id_evento);

    if (error) throw error;

    const session = await supabase.auth.getSession();
    const token = session.data?.session?.access_token;

    let enviados = 0;

    for (const { id_usuario } of usuarios) {
      const { data: datos, error: errDatos } = await supabase.rpc("datos_certificado", {
        id_usuario,
        id_evento,
      });

      if (errDatos || !datos || datos.length === 0) continue;

      const cert = datos[0];
      console.log("📋 Certificado para:", cert);
      const response = await fetch("/plantilla-certificado.docx");
      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
  delimiters: {
    start: '%%',
    end: '%%'
  }
});

      console.log("DATOS DEL CERTIFICADO:", cert);

      doc.setData({
  nombre: cert.nombre,
  tipoevento: cert.tipoevento,
  evento: cert.evento,
  fechafin: cert.fechafin
});


      doc.render();
      const out = doc.getZip().generate({ type: "blob" });

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(out);
      });

      await fetch("https://sgpnyeashmuwwlpvxbgm.supabase.co/functions/v1/enviar-certificado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: cert.correo,
          subject: `🎓 Certificado de Participación - ${cert.evento}`,
          html: `
            <h3>🎓 Certificado de Participación</h3>
            <p>Hola <strong>${cert.nombre}</strong>,</p>
            <p>Gracias por participar en el evento <strong>${cert.evento}</strong>.</p>
            <p>Tu certificado está adjunto o disponible según lo coordinado.</p>
            <br/>
            <p>— Equipo NotiFicct</p>
          `,
          filename: `certificado-${cert.nombre}.docx`,
          pdfBase64: base64,
        }),
      });

      enviados++;
    }

    toast.success(`🎉 Certificados enviados: ${enviados}`);
  } catch (e) {
    console.error("❌ Error al enviar certificados:", e);
    toast.error("Error al enviar certificados");
  }
}

export default function EnviarCertificado() {
  const { id: id_evento } = useParams();

  return (
    <div style={{ padding: "2rem" }}>
      <h3>Certificados</h3>
      <button
        onClick={() => enviarCertificadosParaTodos(id_evento)}
        className="btn btn-success"
      >
        Enviar certificados a todos
      </button>
    </div>
  );
}
