import Navbar from "../components/Navbar.jsx";
import AuthBackground from "../components/AuthBackground.jsx";
import AuthWrapper from "../components/AuthWrapper.jsx";
import {Link, useNavigate} from "react-router-dom";
import {useState} from "react";
import {UserAuth} from "../context/AuthContext.jsx";
import {toast, ToastContainer} from "react-toastify";
import supabase from "../utils/supabaseClient.js";
import 'react-toastify/dist/ReactToastify.css';


const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [register, setRegister] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const {session, signUpNewUser} = UserAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try{
      const result = await signUpNewUser(email, password);

      if (result.success) {
          const {
          data: { user },
          error: userError
        } = await supabase.auth.getUser();

        if (userError) throw toast.error(userError.message);

        const { error: insertError } = await supabase.from("usuario").insert({
          id: register,
          nombre: name,
          correo: user.email,
          id_tipo_usuario: 1,
          fecha_nacimiento: date,
        });

        if (insertError) {
          throw insertError;
        }
        navigate("/iniciar-sesion");
      }
    } catch (error) {
      toast.error("Ha ocurrido un error")
    } finally {
      setLoading(false);
    }
  };

    return (
     <>
    <Navbar/>
    <AuthBackground>
        <AuthWrapper title="REGISTRO">
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
              <label className="form-label fs-5 fw-semibold">Registro: </label>
              <input
                  onChange={(e) => setRegister(e.target.value)}
                  className="form-control form-control-lg"
                  type="text"
                  placeholder="Ingrese su registro"
              />
            </div>
            <div className="mb-3">
              <label className="form-label fs-5 fw-semibold">Fecha de Nacimiento: </label>
              <input
                  onChange={(e) => setDate(e.target.value)}
                  className="form-control form-control-lg"
                  type="date"
                  placeholder="Ingrese su fecha de nacimiento"
              />
            </div>
            <div>
            <label className="form-label fs-5 fw-semibold">Correo: </label>
              <input
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control form-control-lg"
                  type="email"
                  placeholder="Ingrese su correo"
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
            <div className="d-grid mb-3">
              <button className="btn btn-primary py-2 fs-5" type="submit">
                Registrarse
              </button>
            </div>
            <div className="text-center">
              <span className="d-block mb-1">¿Ya tienes cuenta?</span>
              <Link className="fs-5 text-decoration-none fw-semibold" href="#" to={"/iniciar-sesion"}>
                Inicia sesion
              </Link>
            </div>
          </form>
        </AuthWrapper>
    </AuthBackground>
    <ToastContainer position="top-right" closeButton={false} hideProgressBar={true}  autoClose={3000}/>
  </>
    );
};

export default Register;