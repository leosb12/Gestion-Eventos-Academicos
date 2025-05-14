import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import supabase from "../utils/supabaseClient.js";
import Wrapper from "../components/Wrapper.jsx";
import Navbar from "../components/Navbar.jsx";
import AuthBackground from "../components/AuthBackground.jsx";

const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("Contraseña actualizada correctamente.");
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <AuthBackground>
        <Wrapper title="Restablecer Contraseña">
          <form onSubmit={handleUpdatePassword}>
            <div className="mb-3">
              <label className="form-label fs-5 fw-semibold">Nueva contraseña:</label>
              <input
                type="password"
                className="form-control form-control-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la nueva contraseña"
              />
            </div>
            <div className="d-grid mb-3">
              <button disabled={loading} className="btn btn-success fs-5" type="submit">
                Guardar contraseña
              </button>
            </div>
          </form>
        </Wrapper>
      </AuthBackground>
    </>
  );
};

export default UpdatePassword;
