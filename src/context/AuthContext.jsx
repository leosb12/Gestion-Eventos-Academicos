import { createContext,  useEffect, useState, useContext } from "react";
import supabase from "../utils/supabaseClient.js";
import {toast} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const AuthContext = createContext();

export const AuthContextProvider = ({children}) => {
    const [session, setSession] = useState(undefined);

    //registrar
    const signUpNewUser = async (email, password) => {
        const {data, error} = await supabase.auth.signUp({
            email: email,
            password: password

        });

        if(error) {
            toast.error("Hubo un error al iniciar sesión: "+ error.message);
            return {success: false, error: error};
        }
        return {success: true, data};
    };

    //Login
    const signInUser = async(email, password) => {
        try{
            const {data, error} = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            if (error){
                toast.error("Ocurrio un error al iniciar sesion: " + error.message);
                return {success: false, error: error.message};
            }
            toast.success("Usuario iniciado con exito: "+ data);
            return {success: true, data};
        } catch (error){
            toast.error("Un error ha ocurrido: " + error.message )
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

    const signOut = () => {
        const {error} = supabase.auth.signOut();
        if (error){
            toast.error("Ha habido un error: "+ error.message);
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