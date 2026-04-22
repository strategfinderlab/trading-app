import json

with open("backup.json", "r", encoding="utf-8") as f:
    contenido = f.read()

print("CONTENIDO RAW:")
print(contenido[:200])  # solo los primeros caracteres
print("LONGITUD:", len(contenido))

data = json.loads(contenido)