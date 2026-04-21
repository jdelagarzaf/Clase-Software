def crear_usuario(nombre, edad):
    if edad < 0:
        raise ValueError("Edad invalida.")
    return {"nombre": nombre, "edad": edad}