import React, { createContext, useEffect, useState, useContext } from "react";
import supabase from "../utils/supabaseClient.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [tipoUsuario, setTipoUsuario] = useState(null);

  const signUpNewUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        toast.error("Hubo un error al registrarse: " + error.message);
        return { success: false, error: error.message };
      }
      toast.success("Usuario registrado con éxito.");
      return { success: true, data };
    } catch (error) {
      toast.error("Error inesperado al registrarse: " + error.message);
      return { success: false, error: error.message };
    }
  };

  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error("Contraseña incorrecta");
        return { success: false, error: error.message };
      }
      toast.success("Usuario iniciado con éxito.");
      return { success: true, data };
    } catch (error) {
      toast.error("Un error ha ocurrido: " + error.message);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Error al cerrar sesión: " + error.message);
        return { success: false, error: error.message };
      }
      toast.success("Sesión cerrada con éxito.");
      return { success: true };
    } catch (error) {
      toast.error("Error inesperado al cerrar sesión: " + error.message);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    const getSessionAndTipoUsuario = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
          .from('usuario')
          .select('id_tipo_usuario')
          .eq('correo', user.email)
          .maybeSingle();

        if (!error && data) {
          setTipoUsuario(data.id_tipo_usuario);
        } else {
          setTipoUsuario(null);
        }
      } else {
        setTipoUsuario(null);
      }
    };

    getSessionAndTipoUsuario();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      getSessionAndTipoUsuario();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      tipoUsuario,
      signUpNewUser,
      signInUser,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
