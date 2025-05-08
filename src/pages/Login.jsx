import AuthWrapper from "../components/AuthWrapper.jsx";
import Navbar from "../components/Navbar.jsx";
import AuthBackground from "../components/AuthBackground.jsx";
import {Link, useNavigate} from "react-router-dom";
import {useState} from "react";
import {UserAuth} from "../context/AuthContext.jsx";
import {toast, ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const {session, signInUser} = UserAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try{
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

  return (
  <>
    <Navbar/>
    <AuthBackground>
        <AuthWrapper title="INICIA SESIÓN">
          <form onSubmit={handleSignIn}>
            <div className="mb-3">
              <label className="form-label fs-5 fw-semibold">Registro:</label>
              <input
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control form-control-lg"
                  type="email"
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
        </AuthWrapper>
    </AuthBackground>
    <ToastContainer position="top-right" closeButton={false} hideProgressBar={true} autoClose={3000}/>
  </>
  );
};

export default Login;