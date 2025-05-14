import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../utils/supabaseClient";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Detectar si viene con token en la URL
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token")) {
      setMessage("Esta página ya no es válida o el enlace expiró.");
    }
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage("Hubo un error al actualizar la contraseña.");
    } else {
      setMessage("✅ Contraseña actualizada con éxito.");
      setTimeout(() => {
        navigate("/iniciar-sesion");
      }, 3000);
    }
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">Cambiar contraseña</h2>
      {message && <div className="alert alert-info">{message}</div>}
      <form onSubmit={handleUpdatePassword}>
        <input
          className="form-control form-control-lg mb-3"
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn btn-primary" type="submit">
          Guardar nueva contraseña
        </button>
      </form>
    </div>
  );
}

