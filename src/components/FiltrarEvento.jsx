import React, {useEffect, useState} from 'react';
import supabase from '../utils/supabaseClient';

const FiltroEventos = ({onFiltroChange}) => {
    const [categorias, setCategorias] = useState([]);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [formData, setFormData] = useState({
        categoria: '',
        ubicacion: '',
        fechaInicio: '',
        fechaFin: ''
    });

    useEffect(() => {
        const fetchFiltros = async () => {
            const {data: tipos, error: errorTipos} = await supabase.from('tipoevento').select();
            const {data: lugares, error: errorUbicacion} = await supabase.from('ubicacion').select();

            if (!errorTipos) setCategorias(tipos);
            if (!errorUbicacion) setUbicaciones(lugares);
        };

        fetchFiltros();
    }, []);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const aplicarFiltros = () => {
        onFiltroChange(formData);
    };

    return (
        <div className="container my-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                {/* Botón que muestra/oculta el filtro */}
                <div className="text-center my-3">
                    <button
                        className="btn btn-outline-secondary d-flex align-items-center justify-content-center mx-auto"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#filtroEventos"
                        aria-expanded="false"
                        aria-controls="filtroEventos"
                    >
                        <i className="bi bi-funnel me-2"></i>
                        <span className="d-none d-sm-inline">Filtrar eventos</span>
                    </button>
                </div>
            </div>

            {/* Panel de filtros */}
            <div className="collapse mt-3" id="filtroEventos">
                <div className="card card-body">
                    <form className="row g-3">
                        {/* Categoría */}
                        <div className="col-md-3">
                            <label className="form-label">Categoría</label>
                            <select
                                className="form-select"
                                name="categoria"
                                value={formData.categoria}
                                onChange={handleChange}
                            >
                                <option value="">Todas</option>
                                {categorias.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Fecha Inicio */}
                        <div className="col-md-3">
                            <label className="form-label">Fecha Inicio</label>
                            <input
                                type="date"
                                className="form-control"
                                name="fechaInicio"
                                value={formData.fechaInicio}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Fecha Fin */}
                        <div className="col-md-3">
                            <label className="form-label">Fecha Fin</label>
                            <input
                                type="date"
                                className="form-control"
                                name="fechaFin"
                                value={formData.fechaFin}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Ubicación */}
                        <div className="col-md-3">
                            <label className="form-label">Ubicación</label>
                            <select
                                className="form-select"
                                name="ubicacion"
                                value={formData.ubicacion}
                                onChange={handleChange}
                            >
                                <option value="">Todas</option>
                                {ubicaciones.map(ubi => (
                                    <option key={ubi.id} value={ubi.id}>{ubi.lugar}</option>
                                ))}
                            </select>
                        </div>

                        {/* Botón aplicar */}
                        <div className="col-12 text-end">
                            <button type="button" className="btn btn-primary" onClick={aplicarFiltros}>
                                Aplicar Filtros
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FiltroEventos;
