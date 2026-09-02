import os
import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import re

# 1. Inicializar Firebase (asegurate de tener 'serviceAccountKey.json' en la misma carpeta)
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
db = firestore.client()

# Imágenes por defecto inteligentes según la categoría para evitar elementos en blanco
DEFAULT_IMAGES = {
    "bebidas": "https://images.unsplash.com/photo-1608270104343-24bc92826c36?w=400&auto=format&fit=crop&q=60",
    "cervezas": "https://images.unsplash.com/photo-1608270104343-24bc92826c36?w=400&auto=format&fit=crop&q=60",
    "alimentos": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&auto=format&fit=crop&q=60",
    "comidas": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&auto=format&fit=crop&q=60",
    "default": "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&auto=format&fit=crop&q=60"
}

def generar_id(texto):
    """Genera un ID limpio y seguro para Firestore a partir de un texto."""
    if not texto: return "sin-nombre"
    texto_limpio = str(texto).lower().strip()
    texto_limpio = re.sub(r'[àáâãäå]', 'a', texto_limpio)
    texto_limpio = re.sub(r'[èéêë]', 'e', texto_limpio)
    texto_limpio = re.sub(r'[ìíîï]', 'i', texto_limpio)
    texto_limpio = re.sub(r'[òóôõö]', 'o', texto_limpio)
    texto_limpio = re.sub(r'[ùúûü]', 'u', texto_limpio)
    texto_limpio = re.sub(r'ñ', 'n', texto_limpio)
    texto_limpio = re.sub(r'[^a-z0-9]', '_', texto_limpio)
    texto_limpio = re.sub(r'_+', '_', texto_limpio).strip('_')
    return texto_limpio

def obtener_imagen_segun_texto(texto):
    """Devuelve una URL de imagen coherente según el rubro o categoría."""
    texto_lower = str(texto).lower()
    for clave, url in DEFAULT_IMAGES.items():
        if clave in texto_lower:
            return url
    return DEFAULT_IMAGES["default"]

def sincronizar_estructura_respetando_precios():
    csv_path = "tablero-estructura-coto-completo-v3.csv"
    if not os.path.exists(csv_path):
        print(f"❌ Error: No se encuentra el archivo '{csv_path}' en la ruta actual.")
        return

    print("--- LEYENDO ARCHIVO CSV DE COTO ---")
    df = pd.read_csv(csv_path, sep=';', dtype=str)
    df = df.fillna('')
    print(f"Total de registros en el CSV: {len(df)}")

    # 1. Precargar precios existentes en memoria para proteger los datos actuales del actualizador diario
    print("--- Cargando precios actuales desde Firestore para protegerlos ---")
    precios_existentes = {}
    productos_stream = db.collection('productos').stream()
    for doc in productos_stream:
        data = doc.to_dict()
        precios_existentes[doc.id] = data.get('precio', 0.0)
    print(f"Productos con precios ya registrados en la BD: {len(precios_existentes)}")

    categorias_map = {}
    rubros_map = {}
    subrubros_map = {}
    marcas_map = {}

    batch = db.batch()
    batch_count = 0

    def commit_batch_si_es_necesario(forced=False):
        nonlocal batch, batch_count
        if batch_count >= 400 or (forced and batch_count > 0):
            batch.commit()
            batch = db.batch()
            batch_count = 0

    print("--- REORGANIZANDO ESTRUCTURA Y ASIGNANDO IMÁGENES ---")
    
    for index, row in df.iterrows():
        cat_nombre = row.get('Categoria', '').strip()
        rubro_nombre = row.get('Rubro', '').strip()
        subrubro_nombre = row.get('Subrubro', '').strip()
        marca_nombre = row.get('Marca', '').strip()
        producto_nombre = row.get('Nombre_Producto', '').strip()
        medida = row.get('Medida', '').strip()
        
        # Precio del CSV por si acaso falta en la base de datos
        precio_csv_str = row.get('Precio', '0').strip()
        try:
            precio_csv_str = precio_csv_str.replace('$', '').replace('.', '').replace(',', '.').strip()
            precio_csv = float(precio_csv_str)
        except:
            precio_csv = 0.0

        if not producto_nombre or not cat_nombre:
            continue

        # 1. Categoría
        cat_id = generar_id(cat_nombre)
        if cat_id not in categorias_map:
            cat_ref = db.collection('categorias').document(cat_id)
            cat_data = {
                'nombre': cat_nombre,
                'imagenUrl': obtener_imagen_segun_texto(cat_nombre)
            }
            batch.set(cat_ref, cat_data, merge=True)
            batch_count += 1
            categorias_map[cat_id] = cat_nombre

        # 2. Rubro
        rubro_id = f"{cat_id}_{generar_id(rubro_nombre)}" if rubro_nombre else f"{cat_id}_general"
        if rubro_id not in rubros_map and rubro_nombre:
            rubro_ref = db.collection('rubros').document(rubro_id)
            rubro_data = {
                'nombre': rubro_nombre,
                'categoriaId': cat_id,
                'imagenUrl': obtener_imagen_segun_texto(rubro_nombre)
            }
            batch.set(rubro_ref, rubro_data, merge=True)
            batch_count += 1
            rubros_map[rubro_id] = rubro_nombre

        # 3. Subrubro (Subcategoría)
        subrubro_id = f"{rubro_id}_{generar_id(subrubro_nombre)}" if subrubro_nombre else f"{rubro_id}_general"
        if subrubro_id not in subrubros_map and subrubro_nombre:
            subrubro_ref = db.collection('subcategorias').document(subrubro_id)
            subrubro_data = {
                'nombre': subrubro_nombre,
                'rubroId': rubro_id,
                'categoriaId': cat_id,
                'iconoUrl': obtener_imagen_segun_texto(subrubro_nombre)
            }
            batch.set(subrubro_ref, subrubro_data, merge=True)
            batch_count += 1
            subrubros_map[subrubro_id] = subrubro_nombre

        # 4. Marca
        marca_id = generar_id(marca_nombre) if marca_nombre else 'sin-marca'
        if marca_id not in marcas_map and marca_nombre:
            marca_ref = db.collection('marcas').document(marca_id)
            marca_data = {
                'nombre': marca_nombre,
                'logoUrl': DEFAULT_IMAGES["default"]
            }
            batch.set(marca_ref, marca_data, merge=True)
            batch_count += 1
            marcas_map[marca_id] = marca_nombre

        # 5. Producto
        prod_id = f"{subrubro_id}_{generar_id(producto_nombre)}_{generar_id(medida)}"
        prod_ref = db.collection('productos').document(prod_id)
        
        # 🛡️ REGLA CLAVE DE PRECIOS: Si ya existe un precio válido en la BD, lo respetamos. Si está en 0 o no existe, usamos el del CSV.
        precio_final = precios_existentes.get(prod_id, 0.0)
        if not precio_final or precio_final <= 0:
            precio_final = precio_csv

        imagen_prod = obtener_imagen_segun_texto(cat_nombre)
        
        prod_data = {
            'nombre': producto_nombre,
            'medida': medida,
            'precio': precio_final,
            'categoriaId': cat_id,
            'rubroId': rubro_id,
            'subcategoriaId': subrubro_id,
            'marcaId': marca_id,
            'marca': marca_nombre,
            'imagenUrl': imagen_prod,
            'imagen': imagen_prod # Garantiza que la app no muestre espacios en blanco
        }
        batch.set(prod_ref, prod_data, merge=True)
        batch_count += 1

        commit_batch_si_es_necesario()

    commit_batch_si_es_necesario(forced=True)
    print("--- ¡SINCRONIZACIÓN ESTRUCTURAL Y PROTECCIÓN DE PRECIOS EXITOSA! ---")

if __name__ == "__main__":
    sincronizar_estructura_respetando_precios()