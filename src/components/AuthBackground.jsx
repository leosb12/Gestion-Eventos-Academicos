const AuthBackground = ({ children }) => (
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
    {children}
  </section>
);

export default AuthBackground;