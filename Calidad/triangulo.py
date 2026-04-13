def area_triangulo(base, altura):
    if base <= 0 or altura <= 0:
        raise ValueError("La base y la altura deben ser valores positivos.")
    return (base * altura) / 2