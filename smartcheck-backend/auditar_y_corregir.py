import firebase_admin
from firebase_admin import credentials, firestore

# 1. Inicializar Firebase (asegurate de tener tu archivo 'serviceAccountKey.json')
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Diccionario de imágenes por defecto seguras para evitar elementos en blanco
DEFAULT_IMAGES = {
    "cervezas": "https://images.unsplash.com/photo-1608270104343-24bc92826c36?w=400&auto=format&fit=crop&q=60",
    "comidas": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&auto=format&fit=crop&q=60",
    "default": "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&auto=format&fit=crop&q=60"
}

def obtener_documentos_por_lotes(collection_ref, batch_size=500):
    """Obtiene documentos de Firestore en lotes para evitar errores de DeadlineExceeded."""
    docs_totales = []
    query = collection_ref.limit(batch_size)
    docs = query.get()
    
    while len(docs) > 0:
        docs_totales.extend(docs)
        if len(docs) < batch_size:
            break
        last_doc = docs[-1]
        query = collection_ref.start_after(last_doc).limit(batch_size)
        docs = query.get()
        
    return docs_totales

def auditar_y_corregir_base_de_datos():
    print("--- INICIANDO AUDITORÍA Y CORRECCIÓN DE FIRESTORE ---")
    
    # ------------------------------------------------------------------
    # 1. CORREGIR IMÁGENES EN SUBCATEGORÍAS Y MARCAS
    # ------------------------------------------------------------------
    print("\n[1/3] Verificando imágenes en Subcategorías y Marcas...")
    
    subcats_ref = db.collection('subcategorias').stream()
    for doc in subcats_ref:
        data = doc.to_dict()
        updates = {}
        if not data.get('iconoUrl') and not data.get('icono'):
            updates['iconoUrl'] = DEFAULT_IMAGES['default']
        
        if updates:
            db.collection('subcategorias').document(doc.id).update(updates)
            print(f"Subcategoría reparada (imagen): {data.get('nombre', doc.id)}")

    marcas_ref = db.collection('marcas').stream()
    for doc in marcas_ref:
        data = doc.to_dict()
        updates = {}
        if not data.get('logoUrl') and not data.get('logo'):
            updates['logoUrl'] = DEFAULT_IMAGES['default']
            
        if updates:
            db.collection('marcas').document(doc.id).update(updates)
            print(f"Marca reparada (imagen): {data.get('nombre', doc.id)}")

    # ------------------------------------------------------------------
    # 2. AUDITAR Y REUBICAR PRODUCTOS MAL ENCASILLADOS (POR LOTES SEGUROS)
    # ------------------------------------------------------------------
    print("\n[2/3] Auditando encasillamiento de productos por lotes...")
    
    productos_ref = db.collection('productos')
    todos_los_productos = obtener_documentos_por_lotes(productos_ref, batch_size=500)
    
    contador_corregidos = 0
    
    for doc in todos_los_productos:
        prod = doc.to_dict()
        prod_id = doc.id
        nombre_prod = str(prod.get('nombre', '')).lower()
        subcat_actual = prod.get('subcategoriaId', '')
        
        nuevo_subcat_id = subcat_actual
        updates = {}
        
        # Reglas inteligentes de palabras clave
        if any(palabra in nombre_prod for palabra in ['cerveza', 'ipa', 'stout', 'lager', 'patagonia', 'rubia', 'neipa']):
            # Asigná acá el ID correcto de tu subcategoría de cervezas si lo tenés identificado
            pass
            
        elif any(palabra in nombre_prod for palabra in ['hamburguesa', 'pizza', 'mila', 'papas', 'rabas']):
            # Asigná acá el ID correcto de tu subcategoría de comidas si lo tenés identificado
            pass

        # Asegurar que el producto tenga una imagen válida
        if not prod.get('imagenUrl') and not prod.get('imagen'):
            updates['imagenUrl'] = DEFAULT_IMAGES['default']
            
        # Si detectamos que la subcategoría debe cambiar
        if nuevo_subcat_id != subcat_actual:
            updates['subcategoriaId'] = nuevo_subcat_id
            
        if updates:
            db.collection('productos').document(prod_id).update(updates)
            contador_corregidos += 1
            print(f"-> Producto corregido: {prod.get('nombre')} (ID: {prod_id})")

    print(f"\n[3/3] Proceso finalizado con éxito. Total de registros ajustados: {contador_corregidos}")

if __name__ == "__main__":
    auditar_y_corregir_base_de_datos()