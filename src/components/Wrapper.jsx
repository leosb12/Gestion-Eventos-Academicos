
const Wrapper = ({ children, title }) => {
  return (
          <div className="bg-white p-4 p-md-5 rounded-5 shadow" style={{ maxWidth: "25rem", width: "100%" }}>
            <div className="d-flex justify-content-center mb-4">
              <img src="/Escudo_FICCT.png" alt="Logo FICCT" style={{ height: "10rem", width: "auto" }} />
            </div>
            <h1 className="text-center fs-2 fw-bold mb-4">{title}</h1>
            {children}
          </div>
  );
};

export default Wrapper;