import React from "react";
import { Link } from "react-router-dom";
import Wrapper from "../components/Wrapper.jsx";
import AuthBackground from "../components/AuthBackground.jsx";
import Navbar from "../components/Navbar.jsx";

const NotFound = () => {
  return (
    <>
      <section
        className="d-flex justify-content-center align-items-center min-vh-100 p-3"
        style={{
          backgroundImage: "url('/img/ficct.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Wrapper title="Error 404">
          <div className="text-center">
            <p className="fs-5 mb-4">
              Lo sentimos, la página que buscas no existe o ha sido movida.
            </p>
            <Link to="/" className="btn btn-outline-primary fs-5">
              Volver al inicio
            </Link>
          </div>
        </Wrapper>
      </section>
    </>
  );
};

export default NotFound;
