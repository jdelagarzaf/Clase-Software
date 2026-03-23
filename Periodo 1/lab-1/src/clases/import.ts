import { bancos } from './bancos';

const getBancoById = (id) => bancos.find(banco => banco.id === id);

const banco = getBancoById(1);

console.log(banco);    