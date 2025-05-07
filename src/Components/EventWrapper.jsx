
const EventWrapper = ({ children, title }) => {
  return (
          <div className="container-fluid bg-white p-5 p-md-5 rounded-5 shadow w-100" style={{maxWidth: "55rem", width: "100%"}}>
              <div className="d-flex justify-content-center mb-4">
                  <img src="/Escudo_FICCT.png" alt="Logo FICCT" style={{height: "10rem", width: "auto"}}/>
              </div>
              <h1 className="text-center fs-2 fw-bold mb-4">{title}</h1>
              {children}
          </div>
  );
};

export default EventWrapper;