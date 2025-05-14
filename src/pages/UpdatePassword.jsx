import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import supabase from "../utils/supabaseClient";
import Wrapper from "../components/Wrapper";
import Navbar from "../components/Navbar";
import AuthBackground from "../components/AuthBackground";
import 'react-toastify/dist/ReactToastify.css';

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token")) {
      setMessage("Este enlace ya no es válido.");
    }
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error("Error al actualizar la contraseña.");
    } else {
      toast.success("Contraseña actualizada con éxito.");
      setTimeout(() => {
        navigate("/iniciar-sesion");
      }, 3000);
    }
  };

  return (
    <>
      <Navbar />
      <AuthBackground>
        <Wrapper title="Actualizar Contraseña">
          {message && <p className="text-danger text-center">{message}</p>}
          <form onSubmit={handleUpdatePassword}>
            <div className="mb-3">
              <label className="form-label fs-5 fw-semibold">Nueva contraseña:</label>
              <input
                type="password"
                className="form-control form-control-lg"
                placeholder="Ingrese su nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="d-grid">
              <button className="btn btn-primary fs-5 py-2" type="submit">
                Actualizar Contraseña
              </button>
            </div>
          </form>
        </Wrapper>
      </AuthBackground>
      <ToastContainer position="top-right" hideProgressBar={true} autoClose={3000} limit={1} />
    </>
  );
}

