

const InputField = ({ label, type = "text", placeholder }) => {
  return (
    <div className="mb-3">
      <label className="form-label fs-5 fw-semibold">{label}</label>
      <input className="form-control form-control-lg" type={type} placeholder={placeholder} />
    </div>
  );
};

export default InputField;
