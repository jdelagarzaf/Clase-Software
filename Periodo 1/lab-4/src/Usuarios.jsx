import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Table,
  Button,
  Container,
  FormGroup,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";

const baseForm = {
  id: "",
  nombre: "",
  empresa: "",
  edad: "",
  pais: "",
  contacto: "",
};

const data = [
  { id: 1, nombre: "Jorge Carranza", empresa: "Tec", edad: 22, pais: "Mexico", contacto: "jorge.carranza@tec.mx" },
  { id: 2, nombre: "Ramon Velez", empresa: "Banorte", edad: 30, pais: "Mexico", contacto: "ramon.velez@banorte.com" },
  { id: 3, nombre: "Hugo Sanchez", empresa: "Real Madrid", edad: 28, pais: "Mexico", contacto: "hugo.sanchez@realmadrid.es" },
  { id: 4, nombre: "Rafael Marquez", empresa: "Barcelona", edad: 35, pais: "Mexico", contacto: "rafael.marquez@barcelona.es" },
  { id: 5, nombre: "Carlos Alcaraz", empresa: "Mallorca", edad: 21, pais: "Mexico", contacto: "carlos.alcaraz@mallorca.es" },
  { id: 6, nombre: "N. Djokovic", empresa: "Serbia", edad: 34, pais: "Serbia", contacto: "n.djokovic@serbia.rs" },
  { id: 7, nombre: "Sergio Perez", empresa: "Cadillac", edad: 25, pais: "Mexico", contacto: "sergio.perez@cadillac.com" },
  { id: 8, nombre: "Max Verstapen", empresa: "Oracle Red Bull Racing", edad: 24, pais: "Holanda", contacto: "max.verstapen@oracle-red-bull.com" },
  { id: 9, nombre: "Carlos Sainz", empresa: "Williams Racing", edad: 26, pais: "Espana", contacto: "carlos.sainz@williams.com" },
];

class AppUsuarios extends React.Component {
  state = {
    data,
    modalActualizar: false,
    modalInsertar: false,
    form: { ...baseForm },
  };

  mostrarModalActualizar = (dato) => {
    this.setState({
      form: { ...dato },
      modalActualizar: true,
    });
  };

  cerrarModalActualizar = () => {
    this.setState({ modalActualizar: false, form: { ...baseForm } });
  };

  mostrarModalInsertar = () => {
    this.setState({
      modalInsertar: true,
      form: { ...baseForm },
    });
  };

  cerrarModalInsertar = () => {
    this.setState({ modalInsertar: false, form: { ...baseForm } });
  };

  editar = (dato) => {
    const arreglo = this.state.data.map((registro) => (registro.id === dato.id ? { ...dato } : registro));
    this.setState({ data: arreglo, modalActualizar: false, form: { ...baseForm } });
  };

  eliminar = (dato) => {
    const opcion = window.confirm(`Estas seguro que deseas eliminar el elemento ${dato.id}?`);
    if (opcion) {
      const arreglo = this.state.data.filter((registro) => registro.id !== dato.id);
      this.setState({ data: arreglo, modalActualizar: false });
    }
  };

  insertar = () => {
    const nextId = this.obtenerSiguienteId();
    const valorNuevo = { ...this.state.form, id: nextId };
    this.setState((prevState) => ({
      modalInsertar: false,
      data: [...prevState.data, valorNuevo],
      form: { ...baseForm },
    }));
  };

  handleChange = (e) => {
    this.setState({
      form: {
        ...this.state.form,
        [e.target.name]: e.target.value,
      },
    });
  };

  obtenerSiguienteId = () => {
    const ids = this.state.data.map((item) => item.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  };

  render() {
    const nextId = this.obtenerSiguienteId();
    const totalUsuarios = this.state.data.length;
    const totalPaises = new Set(this.state.data.map((usuario) => usuario.pais)).size;
    const promedioEdad = totalUsuarios
      ? Math.round(
          this.state.data.reduce((acumulado, usuario) => acumulado + Number(usuario.edad || 0), 0) / totalUsuarios
        )
      : 0;

    return (
      <main className="usuarios-page">
        <Container className="usuarios-shell">
          <section className="usuarios-hero">
            <p className="usuarios-kicker">Lab 4</p>
            <h1 className="usuarios-title">Directorio de Usuarios</h1>
            <p className="usuarios-subtitle">
              Gestiona registros de manera rapida desde una interfaz clara y adaptable.
            </p>
          </section>

          <section className="usuarios-metrics" aria-label="Resumen">
            <article className="metric-card">
              <p className="metric-label">Total de usuarios</p>
              <p className="metric-value">{totalUsuarios}</p>
            </article>
            <article className="metric-card">
              <p className="metric-label">Paises activos</p>
              <p className="metric-value">{totalPaises}</p>
            </article>
            <article className="metric-card">
              <p className="metric-label">Promedio de edad</p>
              <p className="metric-value">{promedioEdad} anios</p>
            </article>
          </section>

          <section className="usuarios-table-card">
            <div className="usuarios-toolbar">
              <h2>Registros</h2>
              <Button color="success" className="btn-create" onClick={this.mostrarModalInsertar}>
                Crear usuario
              </Button>
            </div>
            <div className="usuarios-table-wrap">
              <Table hover responsive className="align-middle usuarios-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Empresa</th>
                    <th>Edad</th>
                    <th>Pais</th>
                    <th>Contacto</th>
                    <th>Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.data.map((dato) => (
                    <tr key={dato.id}>
                      <td>{dato.id}</td>
                      <td>{dato.nombre}</td>
                      <td>{dato.empresa}</td>
                      <td>{dato.edad}</td>
                      <td>{dato.pais}</td>
                      <td>{dato.contacto}</td>
                      <td className="usuarios-actions">
                        <Button color="primary" size="sm" onClick={() => this.mostrarModalActualizar(dato)}>
                          Editar
                        </Button>
                        <Button color="danger" size="sm" onClick={() => this.eliminar(dato)}>
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </section>
        </Container>

        <Modal isOpen={this.state.modalInsertar} centered>
          <ModalHeader>
            <div>
              <h3>Insertar usuario</h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <FormGroup>
              <label>Id:</label>
              <input className="form-control" readOnly type="text" value={nextId} />
            </FormGroup>
            <FormGroup>
              <label>Nombre:</label>
              <input className="form-control" name="nombre" type="text" onChange={this.handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Empresa:</label>
              <input className="form-control" name="empresa" type="text" onChange={this.handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Edad:</label>
              <input className="form-control" name="edad" type="text" onChange={this.handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Pais:</label>
              <input className="form-control" name="pais" type="text" onChange={this.handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Contacto:</label>
              <input className="form-control" name="contacto" type="text" onChange={this.handleChange} />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.insertar}>
              Insertar
            </Button>
            <Button className="btn btn-danger" onClick={this.cerrarModalInsertar}>
              Cancelar
            </Button>
          </ModalFooter>
        </Modal>

        <Modal isOpen={this.state.modalActualizar} centered>
          <ModalHeader>
            <div>
              <h3>Editar registro</h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <FormGroup>
              <label>Id:</label>
              <input className="form-control" readOnly type="text" value={this.state.form.id || ""} />
            </FormGroup>
            <FormGroup>
              <label>Nombre:</label>
              <input
                className="form-control"
                name="nombre"
                type="text"
                onChange={this.handleChange}
                value={this.state.form.nombre || ""}
              />
            </FormGroup>
            <FormGroup>
              <label>Empresa:</label>
              <input
                className="form-control"
                name="empresa"
                type="text"
                onChange={this.handleChange}
                value={this.state.form.empresa || ""}
              />
            </FormGroup>
            <FormGroup>
              <label>Edad:</label>
              <input
                className="form-control"
                name="edad"
                type="text"
                onChange={this.handleChange}
                value={this.state.form.edad || ""}
              />
            </FormGroup>
            <FormGroup>
              <label>Pais:</label>
              <input
                className="form-control"
                name="pais"
                type="text"
                onChange={this.handleChange}
                value={this.state.form.pais || ""}
              />
            </FormGroup>
            <FormGroup>
              <label>Contacto:</label>
              <input
                className="form-control"
                name="contacto"
                type="text"
                onChange={this.handleChange}
                value={this.state.form.contacto || ""}
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={() => this.editar(this.state.form)}>
              Editar
            </Button>
            <Button color="danger" onClick={this.cerrarModalActualizar}>
              Cancelar
            </Button>
          </ModalFooter>
        </Modal>
      </main>
    );
  }
}

export default AppUsuarios;
