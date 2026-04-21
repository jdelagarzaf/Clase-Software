import pytest
from usuario import crear_usuario

@pytest.fixture
def usuario_valido():
    return crear_usuario("Juan", 25)

def test_usuario_nombre(usuario_valido):
    assert usuario_valido["nombre"] == "Juan"

def test_usuario_edad(usuario_valido):
    assert usuario_valido["edad"] == 25

def test_usuario_mayor_de_edad(usuario_valido):
    assert usuario_valido["edad"] >= 18