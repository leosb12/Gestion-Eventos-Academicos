import InputField from "../Components/InputField.jsx";
import AuthWrapper from "../Components/AuthWrapper.jsx";
import Navbar from "../Components/Navbar.jsx";
import AuthBackground from "../Components/AuthBackground.jsx";
import {Link} from "react-router-dom";

const Login = () => {
  return (
  <>
    <Navbar/>
    <AuthBackground>
        <AuthWrapper title="INICIA SESIÓN">
          <form>
            <InputField label="Registro:" placeholder="Ingrese su registro" />
            <InputField label="Contraseña:" type="password" placeholder="Ingrese su contraseña" />
            <div className="d-grid mb-3">
              <button className="btn btn-primary py-2 fs-5" type="submit">
                Iniciar Sesión
              </button>
            </div>
            <div className="text-center">
              <span className="d-block mb-1">¿No tienes cuenta?</span>
              <Link className="fs-5 text-decoration-none fw-semibold" href="#" to={"/registro"}>
                Registrarse
              </Link>
            </div>
          </form>
        </AuthWrapper>
    </AuthBackground>
  </>
  );
};

export default Login;