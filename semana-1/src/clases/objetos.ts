const estudiante = {
    matricula: 'A00838816',
    nombre: 'Jorge',
    apellido: 'De la Garza',
    edad: 21,
    direccion: {
        ciudad: 'Monterrey',
        cp: 64770,
    }
}


console.log(estudiante);
console.table(estudiante);

const estudiante2 = {...estudiante};
estudiante2.nombre = 'Ramon';
console.log(estudiante2);