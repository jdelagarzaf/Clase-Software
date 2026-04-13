import pytest
from main import calcular_raices

@pytest.mark.parametrize("a, b, c, resultado_esperado", [
    (1, 5, 6, (-2, -3)),
    (1, -7, 12, (4, 3)),
    (1, -9, 20, (5, 4)),
    (1, -11, 30, (6, 5))
])

def test_discriminante_positivo(a, b, c, resultado_esperado):
    assert calcular_raices(a, b, c) == resultado_esperado


@pytest.mark.parametrize("a, b, c, resultado_esperado", [
    (1, 4, 4, -2),
    (1, -6, 9, 3),
    (1, 8, 16, -4),
    (1, -10, 25, 5)
])

def test_discriminante_cero(a, b, c, resultado_esperado):
    assert calcular_raices(a, b, c) == resultado_esperado


@pytest.mark.parametrize("a, b, c, resultado_esperado", [
    (1, 2, 17, (-1, 4)),
    (1, 2, 5, (-1, 2)),
    (1, 4, 8, (-2, 2)),
    (1, 6, 13, (-3, 2))
])

def test_discriminante_negativo(a, b, c, resultado_esperado):
    assert calcular_raices(a, b, c) == resultado_esperado


@pytest.mark.parametrize("a, b, c, mensaje", [
    (0, 4, 5, "El coeficiente 'a' no puede ser cero. La ecuación no es cuadrática."),
    ("x", 4, 5, "Solo se aceptan valores numéricos"),
])
def test_casos_invalidos(a, b, c, mensaje):
    with pytest.raises(ValueError, match=mensaje):
        calcular_raices(a, b, c)
