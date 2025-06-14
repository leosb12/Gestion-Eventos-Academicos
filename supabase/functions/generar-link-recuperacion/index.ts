import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { registro } = await req.json();
    if (!registro) return new Response("Falta número de registro", { status: 400 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: userRow, error } = await supabase
      .from("usuario")
      .select("correo")
      .eq("id", registro)
      .maybeSingle();

    if (error || !userRow) {
      return new Response("Usuario no encontrado", { status: 404 });
    }

    const { data, error: resetError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: userRow.correo,
      options: {
        redirectTo: "https://notificct.vercel.app/update-password"
      }
    });

    if (resetError || !data) {
      return new Response("No se pudo generar el enlace", { status: 500 });
    }

    // Enviar correo con función personalizada
    const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/enviar-correo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
      },
      body: JSON.stringify({
        to: userRow.correo,
        subject: "🔒 Recuperación de contraseña",
        html: `
          <h2>Recuperación de contraseña</h2>
          <p>Haz clic en el siguiente botón para restablecer tu contraseña:</p>
          <a href="${data.action_link}" style="
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border-radius: 5px;
            text-decoration: none;
          ">Restablecer contraseña</a>
          <p>Este enlace es válido por poco tiempo.</p>
        `
      }),
    });

    if (!response.ok) {
      return new Response("Error al enviar correo", { status: 500 });
    }

    return new Response("Correo enviado con éxito", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("Error interno", { status: 500 });
  }
});
