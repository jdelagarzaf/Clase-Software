function saludar(nombre: string): string {
    return `Hola ${nombre}`;
}

const saludarFlecha = (nombre: string): string => {
    return `Hola ${nombre}`;
}


const msg = saludar('Jorge');
console.log(msg);

const msg2 = saludarFlecha('Ramon');
console.log(msg2);