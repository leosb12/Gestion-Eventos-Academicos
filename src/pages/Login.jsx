import Wrapper from "../components/Wrapper.jsx";
import Navbar from "../components/Navbar.jsx";
import AuthBackground from "../components/AuthBackground.jsx";
import {Link, useNavigate} from "react-router-dom";
import {useState} from "react";
import {UserAuth} from "../context/AuthContext.jsx";
import {toast, ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import supabase from "../utils/supabaseClient.js";
import {getCorreoCache, setCorreoCache} from "../utils/cacheUser.js";

const Login = () => {
  const [register, setRegister] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const {session, signInUser} = UserAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try{
      if (!register || !password) {
        toast.error("Por favor, rellena todos los campos.");
        return;
      }
      const registerToInteger= Number(register);

      if (isNaN(registerToInteger) || !Number.isInteger(registerToInteger) || registerToInteger < 0) {
        toast.error("Por favor, ingresa un número de registro válido.");
        return;
      }

      let email = getCorreoCache(registerToInteger);

      if (!email) {
          const { data, error } = await supabase
            .from('usuario')
            .select('correo')
            .eq('id', registerToInteger)
            .maybeSingle();

          if (error || !data) {
              toast.error("Registro no encontrado");
              return {success: false, error: error}
          }

          email = data.correo;
          setCorreoCache(registerToInteger, email);
      }

      const result = await signInUser(email, password);

      if (result.success) {
          navigate("/dashboard");
      }
    } catch (error) {
      toast.error("Ha ocurrido un error" + error.message)
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
  if (!register) {
    toast.error("Primero escribe tu número de registro");
    return;
  }

  const registerToInteger = Number(register);

  if (isNaN(registerToInteger) || !Number.isInteger(registerToInteger) || registerToInteger < 0) {
    toast.error("Registro inválido.");
    return;
  }

  let email = getCorreoCache(registerToInteger);

  if (!email) {
    const { data, error } = await supabase
      .from("usuario")
      .select("correo")
      .eq("id", registerToInteger)
      .maybeSingle();

    if (error || !data) {
      toast.error("Registro no encontrado.");
      return;
    }

    email = data.correo;
    setCorreoCache(registerToInteger, email);
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://notificct.vercel.app/update-password", // o tu dominio en producción
  });

  if (error) {
    toast.error("No se pudo enviar el correo: " + error.message);
  } else {
    toast.success("Te enviamos un correo para restablecer tu contraseña.");
  }
};


  return (
  <>
    <Navbar/>
    <AuthBackground>
        <Wrapper title="INICIA SESIÓN">
          <form onSubmit={handleSignIn}>
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
              <label className="form-label fs-5 fw-semibold">Contraseña: </label>
              <input
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control form-control-lg"
                  type="password"
                  placeholder="Ingrese su contraseña"
              />
            </div>

            <div className="mb-3 text-end">
              <button
                  type="button"
                    onClick={handleResetPassword}
                  className="btn btn-link text-decoration-none text-primary fs-6"
                    >
                   ¿Olvidaste tu contraseña?
                </button>
                </div>


            <div className="d-grid mb-3">
              <button disabled={loading} className="btn btn-primary py-2 fs-5" type="submit">
                Iniciar Sesión
              </button>
            </div>
            <div className="text-center">
              <span className="d-block mb-1">¿No tienes cuenta?</span>
              <Link className="fs-5 text-decoration-none fw-semibold" href="#" to={"/registro"}>
                Registrate
              </Link>
              {error && <p className="text-red-600 text-center pt-4">{error.message}</p>}
            </div>
          </form>
        </Wrapper>
    </AuthBackground>
    <ToastContainer position="top-right" closeButton={false} hideProgressBar={true} limit={1} autoClose={3000}/>
  </>
  );
};

export default Login;