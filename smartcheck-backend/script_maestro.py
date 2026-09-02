import time
import re
import requests
import firebase_admin
from firebase_admin import credentials, firestore

# 1. Inicializar conexión a Firestore
if not firebase_admin._apps:
    cred = credentials.Certificate(r"C:\SMARTCHECK\smartcheck-backend\serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

STORAGE_BASE_SUBCAT = "https://firebasestorage.googleapis.com/v0/b/smartcheck-app.appspot.com/o/subcategorias%2F"
STORAGE_BASE_MARCAS = "https://firebasestorage.googleapis.com/v0/b/smartcheck-app.appspot.com/o/marcas%2F"

def normalizar_nombre(texto):
    if not texto:
        return "desconocido"
    texto = texto.lower().strip()
    texto = re.sub(r'[àáäâ]', 'a', texto)
    texto = re.sub(r'[èéëê]', 'e', texto)
    texto = re.sub(r'[ìíïî]', 'i', texto)
    texto = re.sub(r'[òóöô]', 'o', texto)
    texto = re.sub(r'[ùúüû]', 'u', texto)
    texto = re.sub(r'ñ', 'n', texto)
    texto = re.sub(r'[^a-z0-9]', '_', texto)
    texto = re.sub(r'_+', '_', texto)
    return texto.strip('_')

def ejecutar_proceso_maestro():
    print("🚀 Iniciando el Proceso Maestro de Sincronización y Rescate...")
    
    productos_ref = db.collection('productos')
    docs = list(productos_ref.stream())
    
    total_docs = len(docs)
    if total_docs == 0:
        print("⚠️ No se encontraron productos en Firestore.")
        return

    print(f"📦 Total de productos analizados: {total_docs}")

    subcategorias_unicas = {}
    marcas_unicas = {}
    
    batch = db.batch()
    operaciones_batch = 0
    productos_actualizados_imagen = 0
    intentos_api_fallidos = 0

    print("\n--- FASE 1: Análisis y Rescate de Productos por EAN ---")
    
    for i, doc in enumerate(docs, 1):
        d = doc.to_dict()
        cat = d.get('categoria', 'General')
        subcat = d.get('subcategoria', 'General')
        marca = d.get('marca', 'Generica')
        ean = str(d.get('ean', '')).strip()
        imagen_actual = d.get('imagen')

        # Registrar subcategorías únicas
        if subcat not in subcategorias_unicas:
            subcategorias_unicas[subcat] = {
                'categoria': cat,
                'slug': normalizar_nombre(subcat)
            }

        # Registrar marcas únicas
        if marca and marca != 'Generica' and marca not in marcas_unicas:
            marcas_unicas[marca] = {
                'slug': normalizar_nombre(marca)
            }

        # Si le falta la foto y tiene EAN, consultar Open Food Facts
        if (not imagen_actual or imagen_actual == "") and ean and ean != "None":
            url_api = f"https://world.openfoodfacts.org/api/v0/product/{ean}.json"
            try:
                response = requests.get(url_api, timeout=3)
                if response.status_code == 200:
                    prod_data = response.json()
                    if prod_data.get('status') == 1:
                        p_info = prod_data.get('product', {})
                        nueva_img = p_info.get('image_front_url')
                        nueva_marca_off = p_info.get('brands')

                        actualizacion = {}
                        if nueva_img:
                            actualizacion['imagen'] = nueva_img
                            productos_actualizados_imagen += 1

                        if nueva_marca_off and (not d.get('marcaInfo') or not d.get('marcaInfo', {}).get('logoUrl')):
                            slug_m = normalizar_nombre(nueva_marca_off)
                            actualizacion['marcaInfo'] = {
                                'logoUrl': f"{STORAGE_BASE_MARCAS}{slug_m}.png?alt=media"
                            }

                        if actualizacion:
                            batch.update(doc.reference, actualizacion)
                            operaciones_batch += 1
                    else:
                        intentos_api_fallidos += 1
                
                time.sleep(0.02) # Pausa optimizada para mayor velocidad
            except requests.exceptions.RequestException:
                pass
            except Exception:
                pass

        # Imprimir progreso cada 200 productos para ver fluidez
        if i % 200 == 0 or i == total_docs:
            print(f"⏳ Progreso Fase 1: [{i}/{total_docs}] productos procesados... (Fotos rescatadas: {productos_actualizados_imagen})")

        # Control de lotes de Firestore (máximo 400 por seguridad)
        if operaciones_batch >= 400:
            batch.commit()
            batch = db.batch()
            operaciones_batch = 0

    if operaciones_batch > 0:
        batch.commit()

    print(f"✅ Fase 1 terminada. Se rescataron {productos_actualizados_imagen} fotos de productos.")
    print(f"ℹ️ Códigos no encontrados en bases externas (internos/genéricos): {intentos_api_fallidos}")

    print("\n--- FASE 2: Creando 'config_subcategorias' ---")
    subcat_ref = db.collection('config_subcategorias')
    for nombre_subcat, info in subcategorias_unicas.items():
        doc_id = info['slug']
        icono_url = f"{STORAGE_BASE_SUBCAT}{doc_id}.png?alt=media"
        subcat_ref.document(doc_id).set({
            'nombre': nombre_subcat,
            'categoria': info['categoria'],
            'iconoUrl': icono_url,
            'activo': True
        }, merge=True)
    print(f"✨ Registros creados en 'config_subcategorias': {len(subcategorias_unicas)}")

    print("\n--- FASE 3: Creando 'config_marcas' ---")
    marcas_ref = db.collection('config_marcas')
    for nombre_marca, info in marcas_unicas.items():
        doc_id = info['slug']
        logo_url = f"{STORAGE_BASE_MARCAS}{doc_id}.png?alt=media"
        marcas_ref.document(doc_id).set({
            'nombre': nombre_marca,
            'logoUrl': logo_url,
            'activo': True
        }, merge=True)
    print(f"✨ Registros creados en 'config_marcas': {len(marcas_unicas)}")

    print("\n🎉 ¡PROCESO MAESTRO COMPLETADO EXITOSAMENTE!")

if __name__ == '__main__':
    ejecutar_proceso_maestro()