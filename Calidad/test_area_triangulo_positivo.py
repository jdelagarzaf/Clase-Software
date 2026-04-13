import pytest
from triangulo import area_triangulo

def test_area_triangulo_positivo():
    assert area_triangulo(5, 4) == 10

def test_area_triangulo_base_negativa():
    with pytest.raises(ValueError):
        area_triangulo(-5, 4)