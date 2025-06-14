// src/pages/Login.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import AuthBackground from '../components/AuthBackground.jsx';
import Wrapper from '../components/Wrapper.jsx';
import { UserAuth } from '../context/AuthContext.jsx';
import supabase from '../utils/supabaseClient.js';
import { getCorreoCache, setCorreoCache } from '../utils/cacheUser.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [registro, setRegistro] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { signInUser } = UserAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones
    if (!registro || !password) {
      toast.error('Por favor, rellena todos los campos.');
      setLoading(false);
      return;
    }
    const registroInt = Number(registro);
    if (isNaN(registroInt) || !Number.isInteger(registroInt) || registroInt < 0) {
      toast.error('Por favor, ingresa un número de registro válido.');
      setLoading(false);
      return;
    }

    // Obtener email desde caché o DB
    let email = getCorreoCache(registroInt);
    if (!email) {
      const { data, error } = await supabase
        .from('usuario')
        .select('correo')
        .eq('id', registroInt)
        .maybeSingle();
      if (error || !data) {
        toast.error('Registro no encontrado.');
        setLoading(false);
        return;
      }
      email = data.correo;
      setCorreoCache(registroInt, email);
    }

    // Intento de login
    const result = await signInUser(email, password);
    setLoading(false);

    if (result.success) {
      // Redirige al home ("/") en vez de dashboard
      navigate('/');
    } else {
      // signInUser ya muestra toast de error
    }
  };

const handleResetPassword = async () => {
    if (!registro) {
      toast.error('Primero escribe tu número de registro');
      return;
    }

    const registroInt = Number(registro);
    if (isNaN(registroInt) || !Number.isInteger(registroInt) || registroInt < 0) {
      toast.error('Registro inválido.');
      return;
    }

    // Construir el fetch a tu función Edge
    try {
      setLoading(true);
      const response = await fetch(
        'https://sgpnyeashmuwwlpvxbgm.supabase.co/functions/v1/generar-link-recuperacion',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registro: registroInt }),
        }
      );

      if (!response.ok) {
        const texto = await response.text();
        throw new Error(texto || 'Error desconocido');
      }

      toast.success('Te enviamos un correo para restablecer tu contraseña.');
    } catch (err) {
      console.error(err);
      toast.error('Error al enviar correo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Navbar />
      <AuthBackground>
        <Wrapper title="INICIA SESIÓN">
          <form onSubmit={handleSignIn}>
            <div className="mb-3">
              <label className="form-label fs-5 fw-semibold">Registro:</label>
              <input
                type="text"
                className="form-control form-control-lg"
                value={registro}
                onChange={(e) => setRegistro(e.target.value)}
                placeholder="Ingrese su registro"
              />
            </div>
            <div className="mb-3">
              <label className="form-label fs-5 fw-semibold">Contraseña:</label>
              <input
                type="password"
                className="form-control form-control-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
              />
            </div>

            <div className="mb-3 text-end">
              <button
                  type="button"
                    onClick={handleResetPassword}
                  className="btn btn-link text-decoration-none text-primary fs-6"
                    >
                   ¿Olvidaste tu contraseña?
                </button>
                </div>


            <div className="d-grid mb-3">
              <button
                type="submit"
                className="btn btn-primary py-2 fs-5"
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Iniciar Sesión'}
              </button>
            </div>
            <div className="text-center">
              <span className="d-block mb-1">¿No tienes cuenta?</span>
              <Link to="/registro" className="fs-5 text-decoration-none fw-semibold">
                Regístrate
              </Link>
            </div>
          </form>
        </Wrapper>
      </AuthBackground>
      <ToastContainer position="top-right" closeButton={false} hideProgressBar autoClose={3000} />
    </>
  );
};

export default Login;
