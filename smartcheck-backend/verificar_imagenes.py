import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd

# Inicializar conexión a Firestore usando la ruta absoluta de tu backend
if not firebase_admin._apps:
    cred = credentials.Certificate(r"C:\SMARTCHECK\smartcheck-backend\serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

def verificar_estado_imagenes():
    print("🔍 Consultando la colección 'productos' en Firestore...")
    docs = list(db.collection('productos').stream())
    
    if not docs:
        print("⚠️ No se encontraron documentos en la colección.")
        return

    registros = []
    for doc in docs:
        d = doc.to_dict()
        registros.append({
            'id': doc.id,
            'categoria': d.get('categoria'),
            'subcategoria': d.get('subcategoria'),
            'tiene_icono_subcat': bool(d.get('subcategoriaIconoUrl') or d.get('subcategoriaIcon')),
            'marca': d.get('marca'),
            'tiene_logo_marca': bool(d.get('marcaInfo', {}).get('logoUrl') or d.get('marcaLogoUrl')),
            'tiene_imagen_prod': bool(d.get('imagen'))
        })
        
    df = pd.DataFrame(registros)
    
    print("\n" + "="*40)
    print(f"📊 REPORTE DE AUDITORÍA DE IMÁGENES")
    print("="*40)
    print(f"Total de productos en Firestore: {len(df)}")
    
    sin_icono_subcat = df[~df['tiene_icono_subcat']]
    sin_logo_marca = df[~df['tiene_logo_marca']]
    sin_img_prod = df[~df['tiene_imagen_prod']]
    
    print(f"❌ Registros sin icono de subcategoría: {len(sin_icono_subcat)}")
    print(f"❌ Registros sin logo de marca: {len(sin_logo_marca)}")
    print(f"❌ Registros sin foto de producto: {len(sin_img_prod)}")
    
    if len(sin_icono_subcat) > 0:
        print("\n--- Subcategorías huérfanas detectadas ---")
        print(sin_icono_subcat[['categoria', 'subcategoria']].drop_duplicates().to_string(index=False))

    if len(sin_logo_marca) > 0:
        print("\n--- Marcas huérfanas detectadas ---")
        print(sin_logo_marca[['categoria', 'subcategoria', 'marca']].drop_duplicates().to_string(index=False))
    print("="*40)

if __name__ == '__main__':
    verificar_estado_imagenes()