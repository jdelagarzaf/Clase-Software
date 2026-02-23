import React, { useEffect } from 'react'
import Message from './Message'

const SimpleForm = () => {
    const [formState, setFormState] = React.useState({
        matricula: '',
        nombre: '',
        apellidos: '',
        edad: '',
        universidad: '',
        carrera: '',
        

    });
    const [submittedData, setSubmittedData] = React.useState(null);
    const { matricula, nombre, apellidos, edad, universidad, carrera } = formState;
    const onInputChange = ({ target }) => {
        const { name, value } = target;
        setFormState({...formState, [name]: value });
    }

    const onSubmit = (event) => {
        event.preventDefault();
        setSubmittedData({
            matricula,
            nombre,
            apellidos,
            universidad,
            carrera,
        });
    }

    useEffect(() => {
        console.log('useEffect called!')
    }, [])

    useEffect(() => {
        console.log('formState changed!')
    }, [formState])

    return (
        <section className="form-card">
            <h1 className="form-title">Formulario</h1>

            <form className="form-layout" autoComplete="off" onSubmit={onSubmit}>
                <input type="hidden" defaultValue="123456" />

                <input
                    type="text"
                    className="form-control"
                    placeholder="Matrícula"
                    name="matricula"
                    value={matricula}
                    onChange={onInputChange}
                />

                <div className="form-row">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Nombre"
                        name="nombre"
                        value={nombre}
                        onChange={onInputChange}
                    />
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Apellidos"
                        name="apellidos"
                        value={apellidos}
                        onChange={onInputChange}
                    />
                </div>

                <input
                    type="number"
                    className="form-control"
                    placeholder="Edad"
                    name="edad"
                    value={edad}
                    onChange={onInputChange}
                />

                <div className="form-row">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Universidad"
                        name="universidad"
                        value={universidad}
                        onChange={onInputChange}
                    />
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Carrera"
                        name="carrera"
                        value={carrera}
                        onChange={onInputChange}
                    />
                </div>

                <button type="submit">Enviar</button>
            </form>

            {
                submittedData && (
                    <div className="form-result">
                        <p>Matrícula: {submittedData.matricula}</p>
                        <p>Nombre: {submittedData.nombre}</p>
                        <p>Apellidos: {submittedData.apellidos}</p>
                        <p>Universidad: {submittedData.universidad}</p>
                        <p>Carrera: {submittedData.carrera}</p>
                    </div>
                )
            }

            {
                    (nombre === 'secret') && <Message />
            }
        </section>
    )
}

export default SimpleForm