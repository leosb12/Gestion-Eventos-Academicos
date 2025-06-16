// functions/enviar-notificaciones/index.ts

import { serve }       from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPA_URL    = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SEND_PATH   = `${SUPA_URL}/functions/v1/enviar-correo`;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Only POST", { status: 405 });
  }

  // Init Supabase with Service Role
  const supabase = createClient(SUPA_URL, SERVICE_KEY);

  // 1) Coger pendientes
  const { data: pendientes, error } = await supabase
    .from("notificaciones_usuarios")
    .select(`
      usuario_id,
      notificacion_id,
      texto,
      fecha_envio,
      usuario:usuario_id (correo,nombre),
      notificacion: notificacion_id!notificaciones (mensaje, asunto)
    `)
    .is("texto", null)
    .lte("fecha_envio", new Date().toISOString());

  if (error) {
    console.error("Error al leer pendientes:", error);
    return new Response("Error interno", { status: 500 });
  }

  if (!pendientes || pendientes.length === 0) {
    return new Response("No pendientes", { status: 204 });
  }

  // 2) Por cada pendiente, renderizar y llamar a tu función de envío
  for (const row of pendientes) {
    const { usuario, notificacion } = row;

    // Renderizar texto (puedes añadir más replaces si tienes más variables)
    const rendered = notificacion.mensaje
      .replace(/{{nombre}}/g, usuario.nombre);

    // Llamar a /enviar-correo
    try {
      const resp = await fetch(SEND_PATH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // tu función de enviar-correo ya valida Service Role via apikey+Auth
          "apikey":        SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({
          to:      usuario.correo,
          subject: notificacion.asunto,
          html:    `<p>${rendered}</p>`
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error("Error SMTP:", text);
        continue; // seguimos con los demás
      }

      // 3) Marcar como enviado guardando el texto
      await supabase
        .from("notificaciones_usuarios")
        .update({ texto: rendered })
        .match({
          usuario_id:      row.usuario_id,
          notificacion_id: row.notificacion_id
        });

    } catch (e) {
      console.error("Fallo al enviar correo para", usuario.correo, e);
      // no abortamos toda la función; procesamos el siguiente
    }
  }

  return new Response("Proceso completado", { status: 200 });
});
