import { createContext,  useEffect, useState, useContext } from "react";
import supabase from "../utils/supabaseClient.js";
import {toast} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const AuthContext = createContext();

export const AuthContextProvider = ({children}) => {
    const [session, setSession] = useState(undefined);

    //registrar
    const signUpNewUser = async (email, password) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password
          });

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

    //Login
    const signInUser = async(email, password) => {
        try{
            const {data, error} = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            if (error){
                toast.error("Contraseña incorrecta");
                return {success: false, error: error.message};
            }
            toast.success("Usuario iniciado con exito: "+ data);
            return {success: true, data};
        } catch (error){
            toast.error("Un error ha ocurrido: " + error.message )
            return {success: false, error: error.message};
        }
    }

    useEffect(() => {
        supabase.auth.getSession().then(({data: {session}}) => {
            setSession(session);
        });

        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        })
    },[]);

    //cerrar sesion

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

    return (
        <AuthContext.Provider value={{session, signUpNewUser, signInUser, signOut}}>
        {children}
        </AuthContext.Provider>
    );
};

export const UserAuth = () => {
    return useContext(AuthContext)
}