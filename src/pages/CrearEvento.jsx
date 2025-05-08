import React from 'react';
import Navbar from "../components/Navbar.jsx";
import AuthBackground from "../components/AuthBackground.jsx";
import {Link} from "react-router-dom";
import EventWrapper from "../components/EventWrapper.jsx";

const CrearEvento = () => {
    return (
        <>
            <Navbar/>
            <AuthBackground>
                <EventWrapper title="CREAR EVENTO">
                    <form>
                        <div>
                            <label className="form-label fs-5 fw-semibold">Registro:</label>
                                  <input
                                     // onChange={(e) => setEmail(e.target.value)}
                                      className="form-control form-control-lg"
                                      type="email"
                                      placeholder="Ingrese su registro"
                                  />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fs-5 fw-semibold">Descripción del Evento:</label>
                            <textarea
                                className="form-control form-control-lg"
                                name="Descripción"
                                id="description"
                                placeholder="Digite una descripción">
                          </textarea>
                        </div>

                        <div className="row row-cols-1 row-cols-md-2 mb-3">
                            <div className="col mb-3">
                                <label className="form-label fs-5 fw-semibold me-3">Fecha Inicio:</label>
                                <input className="form-control form-control-lg me-3" type="date" name="" id=""/>
                            </div>
                            <div className="col">
                                <label className="form-label fs-5 fw-semibold me-3">Fecha Fin:</label>
                                <input className="form-control form-control-lg" type="date" name="" id=""/>
                            </div>
                        </div>

                        <div className="row row-cols-1 row-cols-md-2">
                            <div className="col">
                                <label className="form-label fs-5 fw-semibold me-3">Ubicación:</label>
                                <div className="input-group mb-3">
                                    <select className="form-select" id="inputGroupSelect01">
                                        <option value="1">Campus Universitario</option>
                                        <option value="2">Auditorio</option>
                                        <option value="3">Parqueo</option>
                                        <option value="2">Biblioteca</option>
                                    </select>
                                </div>
                            </div>
                            <div className="col">
                                <label className="form-label fs-5 fw-semibold me-3">Tipo de Evento:</label>
                                <div className="input-group mb-3">
                                    <select className="form-select p-2" id="inputGroupSelect01">
                                        <option value="1">Conferencia</option>
                                        <option value="2">Feria Expositiva</option>
                                        <option value="3">Taller</option>
                                        <option value="2">Hackathon</option>
                                        <option value="3">Cursos</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex justify-content-center mt-4 mb-3">
                            <button className="btn btn-primary py-2 px-5 fs-5" type="submit">CREAR</button>
                        </div>
                    </form>
                </EventWrapper>
            </AuthBackground>
        </>
    );
};

export default CrearEvento;