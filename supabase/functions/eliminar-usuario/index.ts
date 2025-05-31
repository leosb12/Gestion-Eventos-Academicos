import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // ✅ Manejo de preflight CORS
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

  // 🔐 Obtener token del header Authorization
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("No autorizado", {
      status: 401,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  const token = authHeader.split(" ")[1];

  // Cliente autenticado (usuario)
  const supabaseUser = createClient(supabaseUrl, supabaseServiceRole, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  // Cliente admin (service_role directo)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

  // ✅ Verificar usuario autenticado
  const { data: userSession, error: sessionError } = await supabaseUser.auth.getUser();
  if (sessionError || !userSession?.user) {
    return new Response("Sesión inválida", {
      status: 401,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  const correo = userSession.user.email;

  // 🔍 Verificar si es admin (tipo 7)
  const { data: usuario, error: errorUsuario } = await supabaseUser
    .from("usuario")
    .select("id_tipo_usuario")
    .eq("correo", correo)
    .single();

  if (errorUsuario || !usuario || usuario.id_tipo_usuario !== 7) {
    return new Response("No autorizado (se requiere tipo_usuario 7)", {
      status: 403,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // 🧾 Leer el cuerpo con el id del usuario a eliminar
  const body = await req.json();
  const id = body?.id_usuario;
  if (!id) {
    return new Response("Falta el ID del usuario a eliminar", {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // 🔍 Buscar correo del usuario a eliminar
  const { data: usuarioTarget, error: errorTarget } = await supabaseAdmin
    .from("usuario")
    .select("correo")
    .eq("id", id)
    .single();

  if (errorTarget || !usuarioTarget) {
    return new Response("No se encontró el usuario", {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  const correoUsuario = usuarioTarget.correo;

  // 🧾 Buscar UID en auth.users
  const { data: authUsers, error: errorAuth } = await supabaseAdmin.auth.admin.listUsers();
  if (errorAuth) {
    return new Response("Error al acceder a Auth", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  const match = authUsers.users.find(u => u.email === correoUsuario);
  if (!match) {
    return new Response("No se encontró el usuario en Auth", {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  const uid = match.id;

  // 🧨 Eliminar de auth.users
  const deleteRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${uid}`, {
    method: 'DELETE',
    headers: {
      'apikey': supabaseServiceRole,
      'Authorization': `Bearer ${supabaseServiceRole}`,
    }
  });

  if (!deleteRes.ok) {
    return new Response("Error al eliminar en Auth", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // 🧨 Eliminar de tabla usuario
  const { error: errorDelete } = await supabaseAdmin
    .from("usuario")
    .delete()
    .eq("id", id);

  if (errorDelete) {
    return new Response("Error al eliminar de la base", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  return new Response("✅ Usuario eliminado correctamente", {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*"
    }
  });
});
