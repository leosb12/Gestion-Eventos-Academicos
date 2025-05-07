import Navbar from "../Components/Navbar.jsx";
import AuthBackground from "../Components/AuthBackground.jsx";
import AuthWrapper from "../Components/AuthWrapper.jsx";
import InputField from "../Components/InputField.jsx";
import {Link} from "react-router-dom";


const Register = () => {
    return (
     <>
    <Navbar/>
    <AuthBackground>
        <AuthWrapper title="INICIA SESIÓN">
          <form>
            <InputField label="Nombre:" placeholder="Ingrese su nombre" />
            <InputField label="Registro:" placeholder="Ingrese su registro" />
            <InputField label="Correo:" placeholder="Ingrese su correo" />
            <InputField label="Contraseña:" type="password" placeholder="Ingrese su contraseña" />
            <div className="d-grid mb-3">
              <button className="btn btn-primary py-2 fs-5" type="submit">
                Registrarse
              </button>
            </div>
            <div className="text-center">
              <span className="d-block mb-1">¿Ya tienes cuenta?</span>
              <Link className="fs-5 text-decoration-none fw-semibold" href="#" to={"/iniciar-sesion"}>
                Inicia sesión
              </Link>
            </div>
          </form>
        </AuthWrapper>
    </AuthBackground>
  </>
    );
};

export default Register;