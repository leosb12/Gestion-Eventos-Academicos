import Navbar from "../components/Navbar.jsx";
import AuthBackground from "../components/AuthBackground.jsx";
import Wrapper from "../components/Wrapper.jsx";
import {Link, useNavigate} from "react-router-dom";
import {useState} from "react";
import {UserAuth} from "../context/AuthContext.jsx";
import {toast, ToastContainer} from "react-toastify";
import supabase from "../utils/supabaseClient.js";
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [register, setRegister] = useState("");
    const [date, setDate] = useState("");
    const [loading, setLoading] = useState(false);

    const {session, signUpNewUser} = UserAuth();
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!name || !register || !date || !email || !password) {
                throw new Error("Por favor, complete todos los campos.");
            }

            if (!/^\d+$/.test(register)) {
                throw new Error("El registro debe contener solo números.");
            }

            const {data: usuarioExistente, error: fetchError} = await supabase
                .from("usuario")
                .select("*")
                .or(`id.eq.${register},correo.eq.${email}`)
                .maybeSingle();

            if (fetchError) {
                throw new Error("Error al verificar existencia del usuario.");
            }

            if (usuarioExistente) {
                throw new Error("Ya existe un usuario con ese registro o correo.");
            }

            const result = await signUpNewUser(email, password);

            if (!result.success) {
                if (result.error?.message?.includes("User already registered")) {
                    throw new Error("El correo ya está registrado.");
                }
                throw new Error(result.error?.message || "Hubo un error al registrarse.");
            }

            const {
                data: {user},
                error: userError
            } = await supabase.auth.getUser();

            if (userError) {
                throw new Error("Error al obtener el usuario autenticado.");
            }

            const {error: insertError} = await supabase.from("usuario").insert({
                id: register,
                nombre: name,
                correo: user.email,
                id_tipo_usuario: 1,
                fecha_nacimiento: date,
            });

            if (insertError) {
                throw new Error("Error al insertar usuario en la base de datos.");
            }

            const {error: loginError} = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (loginError) {
                throw new Error("Usuario creado, pero hubo un problema al iniciar sesión automáticamente.");
            }
                   const session = await supabase.auth.getSession();
                    const accessToken = session.data.session.access_token;
                    const { data: usuarioData, error: errorNombre } = await supabase
                      .from('usuario')
                      .select('nombre')
                      .eq('correo', user.email)
                      .maybeSingle();
                    const nombreUsuario = usuarioData?.nombre || 'Usuario';

                    await fetch('https://sgpnyeashmuwwlpvxbgm.supabase.co/functions/v1/enviar-correo', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                      },
                      body: JSON.stringify({
                        to: user.email,
                        subject: '🎉 ¡Registro Exitoso!',
                        html: `<h2 style="color:#007bff;">✅ ¡Bienvenido a NotiFicct!</h2><p>Hola <strong>${nombreUsuario}</strong>,</p><p>Tu registro en la plataforma <strong>NotiFicct</strong> ha sido exitoso. A partir de ahora, podrás participar en eventos, gestionar tu perfil y mantenerte informado de todas las actividades académicas.</p><h4 style="margin-top: 1.5rem;">🔐 ¿Qué puedes hacer ahora?</h4><ul><li>📅 Inscribirte a eventos desde tu panel de usuario.</li><li>📝 Completar tu perfil y actualizar tus datos.</li><li>📨 Recibir notificaciones importantes directamente en tu correo.</li></ul><p>Puedes iniciar sesión ahora mismo desde el siguiente enlace:</p><p>👉 <a href="https://notificct.dpdns.org/iniciar-sesion" target="_blank" style="color:#007bff; font-weight:bold;">Iniciar Sesión</a></p><p style="color:#666;font-size:0.9em;">Este es un mensaje automático. Por favor, no respondas a este correo.</p>`
                      })
                    });

            toast.success("Bienvenido, te has registrado correctamente.");
            navigate("/");

        } catch (error) {
            toast.error(error.message || "Ha ocurrido un error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar/>
            <AuthBackground>
                <Wrapper title="REGISTRO">
                    <form onSubmit={handleSignup}>
                        <div>
                            <label className="form-label fs-5 fw-semibold">Nombre:</label>
                            <input
                                onChange={(e) => setName(e.target.value)}
                                className="form-control form-control-lg"
                                type="text"
                                placeholder="Ingrese su nombre"
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fs-5 fw-semibold">Registro:</label>
                            <input
                                onChange={(e) => setRegister(e.target.value)}
                                className="form-control form-control-lg"
                                type="text"
                                placeholder="Ingrese su registro"
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fs-5 fw-semibold">Fecha de Nacimiento:</label>
                            <input
                                onChange={(e) => setDate(e.target.value)}
                                className="form-control form-control-lg"
                                type="date"
                            />
                        </div>
                        <div>
                            <label className="form-label fs-5 fw-semibold">Correo:</label>
                            <input
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-control form-control-lg"
                                type="email"
                                placeholder="Ingrese su correo"
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fs-5 fw-semibold">Contraseña:</label>
                            <input
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-control form-control-lg"
                                type="password"
                                placeholder="Ingrese su contraseña"
                            />
                        </div>
                        <div className="d-grid mb-3">
                            <button className="btn btn-primary py-2 fs-5" type="submit" disabled={loading}>
                                {loading ? "Registrando..." : "Registrarse"}
                            </button>
                        </div>
                        <div className="text-center">
                            <span className="d-block mb-1">¿Ya tienes cuenta?</span>
                            <Link className="fs-5 text-decoration-none fw-semibold" to={"/iniciar-sesion"}>
                                Inicia sesión
                            </Link>
                        </div>
                    </form>
                </Wrapper>
            </AuthBackground>
            <ToastContainer position="top-right" closeButton={false} hideProgressBar={true} autoClose={3000}/>
        </>
    );
};

export default Register;
