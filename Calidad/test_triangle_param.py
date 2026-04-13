import pytest
from triangulo import area_triangulo

@pytest.mark.parametrize("base, altura, resultado_esperado", [
    (5, 4, 10),
    (3, 6, 9),
    (10, 2, 10),
    (3, 5, 7.5)
])

def test_area_triangulo_valores_validos(base, altura, resultado_esperado):
    assert area_triangulo(base, altura) == resultado_esperado

@pytest.mark.parametrize("base, altura", [
    (-5, 4),
    (5, -4),
    (-5, -4),
    (0, 4),
    (4, 0),
    (0, 0)
])

def test_area_triangulo_valores_invalidos(base, altura):
    with pytest.raises(ValueError, match="La base y la altura deben ser valores positivos."):
        area_triangulo(base, altura)