import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer/mod.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Solo POST permitido", { status: 405 });
  }

  try {
    const { to, subject, html, fromName = "NotiFicct" } = await req.json();

    if (!to || !subject || !html) {
      return new Response("Faltan campos requeridos", { status: 400 });
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.resend.com",
        port: 465,
        tls: true,
        auth: {
          username: Deno.env.get("SMTP_USER")!,
          password: Deno.env.get("SMTP_PASS")!,
        },
      },
    });

    await client.send({
      from: `NotiFicct <noreply@notificct.dpdns.org>`,
      to,
      subject,
      content: html,
      html,
    });

    await client.close();

    return new Response("Correo enviado", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    console.error("❌ Error al enviar correo:", e);
    return new Response("Error al enviar correo", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});

