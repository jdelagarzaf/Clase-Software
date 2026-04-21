import math

def calcular_raices(a, b, c):
    if not all(isinstance(x, (int, float)) for x in (a, b, c)):
        raise ValueError("Solo se aceptan valores numéricos")

    if a == 0:
        raise ValueError("El coeficiente 'a' no puede ser cero. La ecuación no es cuadrática.")

    discriminante = b**2 - 4*a*c
    if discriminante > 0:
        raiz_discriminante = math.sqrt(discriminante)
        x1 = (-b + raiz_discriminante) / (2*a)
        x2 = (-b - raiz_discriminante) / (2*a)
        return x1, x2
    elif discriminante == 0:
        x = -b / (2*a)
        return x
    else:
        parte_real = -b / (2*a)
        parte_imaginaria = math.sqrt(abs(discriminante)) / (2*a)
        return parte_real, parte_imaginaria

def main():
    print("Este programa resuelve ecuaciones cuadráticas de la forma ax^2 + bx + c = 0")
    a = float(input("Ingrese el coeficiente a: "))
    b = float(input("Ingrese el coeficiente b: "))
    c = float(input("Ingrese el coeficiente c: "))

    raices = calcular_raices(a, b, c)

    print("\nLas raíces de la ecuación son:")
    for raiz in raices:
        print(raiz)

if __name__ == "__main__":
    main()