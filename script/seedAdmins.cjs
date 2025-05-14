// scripts/seedAdmins.cjs

// 1) Cargar dotenv apuntando al .env de la carpeta padre
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')  // Ajusta a '.env.local' si no lo renombraste
});

// 2) Log inicial para comprobar variables
console.log('🏁 Iniciando seedAdmins...');
console.log('  VITE_SUPABASE_URL =', process.env.VITE_SUPABASE_URL ? '✅' : '❌');
console.log('  SUPABASE_SERVICE_ROLE_KEY =', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');

const { createClient } = require('@supabase/supabase-js');

// 3) Validar de nuevo
if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables de entorno necesarias en .env');
  process.exit(1);
}

// 4) Cliente Supabase con privilegios
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const admins = [
    { registro: 10000001, nombre: 'admin1', correo: 'admin1@tu.dominio', fecha: '1980-01-01' },
    // si solo quieres probar 1, deja éste y comenta/elimina los demás
    /*
    { registro: 10000002, nombre: 'admin2', correo: 'admin2@tu.dominio', fecha: '1980-02-02' },
    */
  ];

  for (const a of admins) {
    console.log(`✏️  Creando Auth user: ${a.correo}`);
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email:          a.correo,
      password:       'Admin@123!',
      email_confirm:  true
    });
    if (authErr) {
      console.error('  ❌ Error en Auth:', authErr.message);
      continue;
    }
    console.log('  ✅ Auth user creado, UID =', authData.id);

    console.log(`↪️  Insertando perfil en public.usuario (registro=${a.registro})`);
    const { error: dbErr } = await supabase
      .from('usuario')
      .insert({
        id:               a.registro,
        nombre:           a.nombre,
        correo:           a.correo,
        fecha_nacimiento: a.fecha,
        id_tipo_usuario:  7
      });
    if (dbErr) {
      console.error('  ❌ Error en tabla usuario:', dbErr.message);
    } else {
      console.log('  ✅ Perfil insertado correctamente');
    }
  }
}

main()
  .then(() => {
    console.log('🎉 seedAdmins finalizado con éxito');
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 Error inesperado en seedAdmins:', err);
    process.exit(1);
  });
