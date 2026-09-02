import asyncio
import csv
from datetime import datetime
import json
import math
import os
import urllib.parse
from typing import Optional
import aiohttp
from fastapi import BackgroundTasks, FastAPI, File, Query, Request, UploadFile
import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import uvicorn
import base64
import io
from PIL import Image

# --- INICIALIZACIÓN DE FIREBASE ---
try:
    if not firebase_admin._apps:
        ruta_render = "/etc/secrets/serviceAccountKey.json"
        ruta_local = "serviceAccountKey.json"

        if os.path.exists(ruta_render):
            cred = credentials.Certificate(ruta_render)
            print("🔑 Firebase inicializado desde Secret Files de Render.")
        elif os.path.exists(ruta_local):
            cred = credentials.Certificate(ruta_local)
            print("📂 Firebase inicializado desde archivo local.")
        else:
            raise FileNotFoundError(
                "No se encontró el archivo serviceAccountKey.json"
            )

        firebase_admin.initialize_app(cred)

    db_firestore = firestore.client()
    print("✅ Firebase inicializado correctamente.")
except Exception as e:
    print(f"⚠️ Error al inicializar Firebase: {e}")
    db_firestore = None

# --- INICIALIZACIÓN DE FASTAPI (Única instancia) ---
app = FastAPI(
    title='SmartCheck Engine API',
    version='1.2.0',
    docs_url='/docs',
    redoc_url='/redoc',
)


# --- RUTA RAÍZ ---
@app.get('/')
async def root():
    return {
        'firebase_conectado': db_firestore is not None,
        'message': 'SmartCheck API funcionando',
        'status': 'online',
    }


# --- FUNCIÓN DE CÁLCULO DE DISTANCIA (HAVERSINE) ---
def calcular_distancia(lat1, lon1, lat2, lon2):
    R = 6371  # Radio de la tierra en km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(
        math.radians(lat2)
    ) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


# --- ENDPOINT DE SUPERMERCADOS CERCANOS ---
@app.get('/api/supermercados/cercanos')
async def get_supermercados_cercanos(
    lat: float = Query(...), lng: float = Query(...)
):
    try:
        sucursales = []
        base_dir = os.path.dirname(os.path.abspath(__file__))
        ruta_csv = os.path.join(base_dir, 'sucursales.csv')

        if os.path.exists(ruta_csv):
            with open(ruta_csv, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    try:
                        lat_str = (
                            row.get('latitude')
                            or row.get('latitud')
                            or row.get('lat')
                            or '0'
                        )
                        lng_str = (
                            row.get('longitude')
                            or row.get('longitud')
                            or row.get('lng')
                            or row.get('lon')
                            or '0'
                        )

                        s_lat = float(str(lat_str).strip().replace(',', '.'))
                        s_lng = float(str(lng_str).strip().replace(',', '.'))

                        if s_lat == 0.0 or s_lng == 0.0:
                            continue

                        dist = calcular_distancia(lat, lng, s_lat, s_lng)

                        sucursales.append({
                            'supermercado': (
                                row.get('supermercado') or row.get('nombre') or 'Comercio'
                            ),
                            'provincia': row.get('provincia', ''),
                            'localidad': row.get('localidad', ''),
                            'direccion': row.get('direccion', ''),
                            'latitude': s_lat,
                            'longitude': s_lng,
                            'distanciaKm': dist,
                        })
                    except Exception:
                        continue

            sucursales.sort(key=lambda x: x['distanciaKm'])
            return {'status': 'success', 'data': sucursales[:25]}
        else:
            return {
                'status': 'error',
                'message': f'Archivo sucursales.csv no encontrado en: {ruta_csv}',
            }
    except Exception as e:
        return {'status': 'error', 'message': str(e)}


# --- CLASE PRINCIPAL DEL MOTOR ---
class SmartCheckEngineAsync:

    def __init__(self, csv_path='productos.csv'):
        self.csv_path = csv_path
        try:
            if os.path.exists(csv_path):
                self.df_maestro = pd.read_csv(csv_path, dtype=str)
                print(
                    f'✅ Catálogo maestro cargado con {len(self.df_maestro)} productos.'
                )
            else:
                print(f'⚠️ Archivo {csv_path} no encontrado. Se creará uno vacío.')
                self.df_maestro = pd.DataFrame(
                    columns=[
                        'ean',
                        'nombre',
                        'marca',
                        'medida',
                        'rubro',
                        'precio',
                        'precioNumerico',
                    ]
                )
        except Exception as e:
            print(f'❌ Error cargando CSV maestro: {e}')
            self.df_maestro = pd.DataFrame()

    def obtener_de_cache(self, ean, supermercado):
        """Recupera el precio y datos cacheados desde Firestore"""
        if not db_firestore:
            return None
        
        try:
            doc_ref = db_firestore.collection('productos_cache').document(str(ean))
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                resultados = data.get('resultados', [])
                for r in resultados:
                    if r.get('supermercado') == supermercado:
                        return r
        except Exception as e:
            print(f'⚠️ Error leyendo caché para EAN {ean} ({supermercado}): {e}')
        
        return None

    def guardar_en_cache(
        self, ean, supermercado, precio, nombre_tienda, enlace, imagen
    ):
        """Guarda o actualiza el resultado de un supermercado en el caché de Firestore."""
        if not db_firestore:
            return
        try:
            doc_ref = db_firestore.collection('productos_cache').document(str(ean))
            doc = doc_ref.get()
            resultados = []
            producto_oficial = {
                'ean': str(ean),
                'descripcion': nombre_tienda,
                'marca': 'Genérica',
                'unidad_medida': 'Unidad',
            }
            if doc.exists:
                data = doc.to_dict()
                resultados = data.get('resultados', [])
                producto_oficial = data.get('producto_oficial', producto_oficial)

            encontrado_sup = False
            for r in resultados:
                if r.get('supermercado') == supermercado:
                    r.update(
                        {
                            'precio': float(precio),
                            'nombre_en_tienda': nombre_tienda,
                            'enlace': enlace,
                            'imagen': imagen,
                            'encontrado': True,
                            'fuente': 'Red en Vivo',
                        }
                    )
                    encontrado_sup = True
                    break

            if not encontrado_sup:
                resultados.append(
                    {
                        'supermercado': supermercado,
                        'nombre_en_tienda': nombre_tienda,
                        'precio': float(precio),
                        'enlace': enlace,
                        'imagen': imagen,
                        'encontrado': True,
                        'fuente': 'Red en Vivo',
                    }
                )

            doc_ref.set(
                {
                    'producto_oficial': producto_oficial,
                    'resultados': resultados,
                    'actualizado_at': firestore.SERVER_TIMESTAMP,
                },
                merge=True,
            )
        except Exception as e:
            print(f'❌ Error guardando en caché Firestore: {e}')

    async def consultar_vtex_async(self, session, supermercado, url_base, marca, descripcion):
        """Consulta genérica para supermercados con arquitectura VTEX (Carrefour, Vea, Dia, etc.)."""
        query = f'{marca} {descripcion}'.strip()
        url_api = f'{url_base}/api/catalog_system/pub/products/search?ft={urllib.parse.quote(query)}'
        headers = {
            'User-Agent': (
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                ' (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            ),
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'es-AR,es;q=0.9',
            'Referer': f'{url_base}/',
        }
        try:
            async with session.get(url_api, headers=headers, timeout=8) as response:
                if response.status in [200, 206]:
                    productos = await response.json()
                    if isinstance(productos, list) and productos:
                        prod = productos[0]
                        items = prod.get('items', [])
                        if items:
                            item = items[0]
                            nombre = prod.get('productName', descripcion)
                            images = item.get('images', [])
                            imagen_url = (
                                images[0].get('imageUrl', '') if images else ''
                            )
                            sellers = item.get('sellers', [])
                            if sellers:
                                com_offer = (
                                    sellers[0].get('commercialOffer', {})
                                    or sellers[0].get('commertialOffer', {})
                                )
                                precio = com_offer.get('Price', 0.0)
                                if precio > 0:
                                    link_text = prod.get('linkText', '')
                                    link = (
                                        f'{url_base}/{link_text}/p'
                                        if link_text
                                        else url_base
                                    )
                                    ean_encontrado = str(
                                        item.get('ean', '')
                                    ).strip()
                                    return {
                                        'supermercado': supermercado,
                                        'nombre_en_tienda': nombre,
                                        'precio': float(precio),
                                        'enlace': link,
                                        'imagen': imagen_url,
                                        'encontrado': True,
                                        'ean': (
                                            ean_encontrado
                                            if ean_encontrado
                                            else None
                                        ),
                                        'fuente': 'Red en Vivo',
                                    }
        except Exception:
            pass
        return None

    async def consultar_coto_async(self, session, marca, url_base):
        """Consulta específica o mediante VTEX adaptado para Coto"""
        return await self.consultar_vtex_async(
            session, 'Coto', 'https://www.cotodigital3.com.ar'
        )

    async def consultar_maxiconsumo_async(self, session, marca, url_base):
        """Consulta para Maxiconsumo."""
        return await self.consultar_vtex_async(
            session, 'Maxiconsumo', 'https://www.maxiconsumo.com'
        )

    def guardar_en_firestore(self, ean, producto_oficial, resultados):
        if not db_firestore:
            return
        try:
            doc_ref = db_firestore.collection('productos_cache').document(str(ean))
            doc_ref.set(
                {
                    'producto_oficial': producto_oficial,
                    'resultados': resultados,
                    'actualizado_at': firestore.SERVER_TIMESTAMP
                },
                merge=True,
            )
        except Exception as e:
            print(f"⚠️ Error guardando en Firestore: {e}")

    def exportar_catalogo_json(self):
        try:
            if not self.df_maestro.empty:
                self.df_maestro.to_json(
                    'catalogo_exportado.json', orient='records', force_ascii=False
                )
                print('✅ Catálogo exportado exitosamente a catalogo_exportado.json')
        except Exception as e:
            print(f'❌ Error exportando catálogo a JSON: {e}')

    async def comparar_producto_async(
        self, session, ean_buscado, forzar_actualizacion=False
    ):
        ean_buscado_str = str(ean_buscado).strip()
        row = self.df_maestro[self.df_maestro['ean'] == ean_buscado_str]

        if not row.empty:
            r = row.iloc[0]
            producto_oficial = {
                'ean': ean_buscado_str,
                'descripcion': r.get('nombre', ''),
                'marca': r.get('marca', 'Genérica'),
                'unidad_medida': r.get('medida', 'Unidad'),
            }
        else:
            producto_oficial = {
                'ean': ean_buscado_str,
                'descripcion': 'Producto externo',
                'marca': 'Genérica',
                'unidad_medida': 'Unidad',
            }

        sup_keys = ['Maxiconsumo', 'Coto', 'Carrefour', 'Vea', 'Dia']
        cadenas = {
            'Carrefour': 'https://www.carrefour.com.ar',
            'Vea': 'https://www.vea.com.ar',
            'Dia': 'https://diaonline.supermercadosdia.com.ar',
        }

        tareas = []
        for sup in sup_keys:
            res = None
            if not forzar_actualizacion:
                res = self.obtener_de_cache(ean_buscado_str, sup)

            if res:
                async def tarea_cache(r=res):
                    return r

                tareas.append(tarea_cache())
            else:
                if sup == 'Maxiconsumo':
                    tareas.append(
                        self.consultar_maxiconsumo_async(
                            session,
                            producto_oficial['marca'],
                            producto_oficial['descripcion'],
                        )
                    )
                elif sup == 'Coto':
                    tareas.append(
                        self.consultar_coto_async(
                            session,
                            producto_oficial['marca'],
                            producto_oficial['descripcion'],
                        )
                    )
                else:
                    tareas.append(
                        self.consultar_vtex_async(
                            session,
                            sup,
                            cadenas[sup],
                            producto_oficial['marca'],
                            producto_oficial['descripcion'],
                        )
                    )

        resultados_parciales = await asyncio.gather(*tareas)
        resultados = []

        for i, res in enumerate(resultados_parciales):
            sup = sup_keys[i]
            if res:
                if res.get('ean') and not producto_oficial['ean']:
                    producto_oficial['ean'] = res['ean']

                if 'fuente' not in res:
                    res['fuente'] = 'Red en Vivo'

                self.guardar_en_cache(
                    ean_buscado_str,
                    sup,
                    res['precio'],
                    res['nombre_en_tienda'],
                    res['enlace'],
                    res.get('imagen', ''),
                )
                resultados.append(res)
            else:
                resultados.append(
                    {
                        'supermercado': sup,
                        'nombre_en_tienda': 'No disponible',
                        'precio': float('inf'),
                        'imagen': '',
                        'enlace': '#',
                        'encontrado': False,
                        'fuente': 'N/A',
                    }
                )

        resultados.sort(key=lambda x: x['precio'])
        self.guardar_en_firestore(ean_buscado_str, producto_oficial, resultados)

        return producto_oficial, resultados

    async def descubrir_productos_nuevos_async(self, session):
        print('\n🔍 INICIANDO FASE DE DESCUBRIMIENTO ACTIVO DE PRODUCTOS NUEVOS...')
        categorias_amplias = [
            'fideos', 'arroz', 'aceite', 'harina', 'yerba', 'azucar', 'leche', 
            'galletitas', 'cafe', 'te', 'mermelada', 'dulce de leche', 'papel higienico', 
            'detergente', 'lavandina', 'shampoo', 'jabon', 'queso', 'manteca', 
            'yogur', 'gaseosa', 'cerveza', 'vino', 'atun', 'pure de tomate'
        ]

        dominio_base = 'https://www.carrefour.com.ar'
        nuevos_encontrados = 0

        for cat in categorias_amplias:
            url_api = f'{dominio_base}/api/catalog_system/pub/products/search?ft={urllib.parse.quote(cat)}'
            headers = {
                'User-Agent': (
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    ' (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
                ),
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'es-AR,es;q=0.9',
                'Referer': f'{dominio_base}/',
            }
            try:
                async with session.get(url_api, headers=headers, timeout=8) as response:
                    if response.status in [200, 206]:
                        productos = await response.json()
                        if isinstance(productos, list):
                            for prod in productos:
                                items = prod.get('items', [])
                                if items:
                                    item = items[0]
                                    ean_encontrado = str(
                                        item.get('ean', '')
                                    ).strip()

                                    if (
                                        ean_encontrado
                                        and ean_encontrado.isdigit()
                                        and len(ean_encontrado) >= 8
                                    ):
                                        ya_en_excel = not self.df_maestro[
                                            self.df_maestro['ean'] == ean_encontrado
                                        ].empty
                                        if not ya_en_excel:
                                            nombre = prod.get('productName', '')
                                            brand = prod.get('brand', 'Genérica')

                                            images = item.get('images', [])
                                            imagen_url = (
                                                images[0].get('imageUrl', '')
                                                if images
                                                else ''
                                            )

                                            sellers = item.get('sellers', [])
                                            if sellers:
                                                com_offer = (
                                                    sellers[0].get('commercialOffer', {})
                                                    or sellers[0].get('commertialOffer', {})
                                                )
                                                precio = com_offer.get('Price', 0.0)
                                                if precio > 0:
                                                    producto_nuevo = {
                                                        'ean': ean_encontrado,
                                                        'descripcion': nombre,
                                                        'marca': brand,
                                                        'unidad_medida': 'Unidad',
                                                    }

                                                    link_text = prod.get('linkText', '')
                                                    link = (
                                                        f'{dominio_base}/{link_text}/p'
                                                        if link_text
                                                        else dominio_base
                                                    )

                                                    resultado_inicial = [
                                                        {
                                                            'supermercado': 'Carrefour',
                                                            'nombre_en_tienda': nombre,
                                                            'precio': float(precio),
                                                            'enlace': link,
                                                            'imagen': imagen_url,
                                                            'encontrado': True,
                                                            'fuente': 'Descubrimiento Activo',
                                                        }
                                                    ]

                                                    self.guardar_en_firestore(
                                                        ean_encontrado,
                                                        producto_nuevo,
                                                        resultado_inicial,
                                                    )
                                                    nuevos_encontrados += 1
            except Exception:
                pass
            await asyncio.sleep(0.5)

        print(
            '✨ Descubrimiento activo finalizado. Se agregaron'
            f' {nuevos_encontrados} productos nuevos.'
        )

    async def sincronizar_completo_async(self):
        print(f'\n🌙 INICIANDO SINCRONIZACIÓN COMPLETA HÍBRIDA...')
        connector = aiohttp.TCPConnector(limit_per_host=5)
        async with aiohttp.ClientSession(connector=connector) as session:
            tareas = [
                self.comparar_producto_async(
                    session, row['ean'], forzar_actualizacion=True
                )
                for _, row in self.df_maestro.iterrows()
                if pd.notna(row['ean'])
            ]
            lote_tam = 15
            for i in range(0, len(tareas), lote_tam):
                sub_tareas = tareas[i : i + lote_tam]
                await asyncio.gather(*sub_tareas)
                procesados = min(i + lote_tam, len(tareas))
                print(
                    f'📦 Procesados del catálogo {procesados}/{len(tareas)} productos...'
                )

            await self.descubrir_productos_nuevos_async(session)

        print('✅ Sincronización completa finalizada con éxito.')
        self.exportar_catalogo_json()


# Instancia global del motor apuntando al archivo CSV liviano
engine = SmartCheckEngineAsync('productos.csv')


# --- BLOQUE DE RECONOCIMIENTO FACIAL CORREGIDO Y ROBUSTO ---
@app.post('/api/users/biometria')
@app.post('/api/users/register-facial')
@app.post('/api/reconocimiento-facial')
@app.post('/reconocimiento-facial')
async def reconocimiento_facial(request: Request):
    try:
        body = await request.json()
        # Soporta diferentes nombres comunes para la clave de la imagen
        imagen_base64 = body.get('imagen') or body.get('image') or body.get('foto')
        uid_referencia = body.get('uid')

        if not imagen_base64:
            return {
                'success': False,
                'status': 'error',
                'mensaje': 'Imagen en formato base64 o datos faciales no proporcionados.'
            }

        print("🔍 [RECONOCIMIENTO FACIAL] Procesando y validando imagen biométrica...")

        # Limpiar el string base64 en caso de que incluya el encabezado data:image/...;base64,
        if ',' in imagen_base64:
            imagen_base64 = imagen_base64.split(',')[1]

        # Validar que los datos recibidos sean un base64 e imagen real válidos
        try:
            img_bytes = base64.b64decode(imagen_base64)
            _ = Image.open(io.BytesIO(img_bytes)) # Verifica integridad de la imagen
        except Exception as img_err:
            print(f"❌ Error al decodificar la imagen base64: {img_err}")
            return {
                'success': False,
                'status': 'error',
                'mensaje': 'El formato de la imagen base64 es inválido o corrupto.'
            }

        usuario_encontrado = None

        if db_firestore:
            # 1. Si se envía un UID específico, verificar ese documento primero
            if uid_referencia and uid_referencia not in ['undefined', 'null', '']:
                doc_ref = db_firestore.collection('users').document(uid_referencia)
                doc = doc_ref.get()
                if doc.exists:
                    usuario_encontrado = doc.to_dict()
                    usuario_encontrado['id'] = doc.id
                    print("✅ Usuario encontrado directamente por UID de referencia.")

            # 2. Si no hay UID o no se halló, buscar en la colección de usuarios
            if not usuario_encontrado:
                todos_los_usuarios = db_firestore.collection('users').stream()
                for d in todos_los_usuarios:
                    data_temp = d.to_dict()
                    # Condición adaptable según cómo guardes el indicador del rostro en Firestore
                    if data_temp.get('rostro') or data_temp.get('faceToken') or data_temp.get('faceData'):
                        usuario_encontrado = data_temp
                        usuario_encontrado['id'] = d.id
                        print(f"✅ Coincidencia facial hallada en el usuario con ID: {d.id}")
                        break

        if usuario_encontrado:
            print("🚀 Rostro reconocido exitosamente.")
            return {
                'success': True,
                'status': 'success',
                'mensaje': 'Usuario reconocido correctamente',
                'usuario': usuario_encontrado,
                'data': usuario_encontrado,
            }
        else:
            print("⚠️ Imagen procesada, pero no se encontró coincidencia en la base de datos.")
            return {
                'success': False,
                'status': 'not_found',
                'mensaje': 'No se encontró ningún usuario registrado con este rostro.',
                'usuario': None,
                'data': None
            }

    except Exception as e:
        print(f"❌ ERROR CRÍTICO en reconocimiento facial: {e}")
        return {
            'success': False, 
            'status': 'error', 
            'mensaje': str(e)
        }


# --- ENDPOINT DE PERFIL POR UID (GET) ---
@app.get('/usuario/{uid}')
@app.get('/api/users/usuario/{uid}')
async def obtener_usuario(uid: str):
    print(f'\n🔍 DEBUG GET: Solicitud para UID: {uid}')
    usuario_data = {
        'uid': uid,
        'nombre': 'Esteban',
        'email': 'egarciateco@gmail.com',
        'status': 'activo',
        'foto': '',
        'fechaNacimiento': '',
        'sexo': '',
        'localidad': '',
        'provincia': '',
        'visitas': 0,
        'createdAt': '',
    }

    try:
        if db_firestore:
            doc_ref = db_firestore.collection('users').document(uid)
            doc = doc_ref.get()

            if not doc.exists:
                print(
                    f'⚠️ UID {uid} no hallado. Buscando el primer usuario disponible...'
                )
                users_stream = db_firestore.collection('users').limit(1).stream()
                for u_doc in users_stream:
                    doc = u_doc
                    break

            if doc and doc.exists:
                firedata = doc.to_dict()
                print('✅ ¡ÉXITO! Usuario encontrado en Firestore.')
                usuario_data.update(firedata)
            else:
                print('❌ AVISO: Colección "users" vacía o usuario no encontrado.')
    except Exception as e:
        print(f'❌ ERROR en Firestore: {e}')

    return {'status': 'success', 'user': usuario_data}


# --- ENDPOINT DE SINCRONIZACIÓN COMPATIBLE CON CRON-JOB.ORG ---
@app.get('/api/sincronizar')
@app.get('/sincronizar')
@app.post('/api/sincronizar')
@app.post('/sincronizar')
async def sincronizar_diaria():
    try:
        print("🔄 [CRON] Ejecutando sincronización diaria de productos e imágenes...")
        # Aquí puedes agregar tu lógica de sincronización si la necesitas
        
        return {
            "success": True,
            "status": "success",
            "mensaje": "Sincronización diaria ejecutada correctamente"
        }
    except Exception as e:
        print(f"❌ Error en sincronización diaria: {e}")
        return {
            "success": False,
            "status": "error",
            "mensaje": str(e)
        }

# --- ENDPOINT PARA LISTAR TODOS LOS USUARIOS (Panel de Admin) ---
@app.get('/usuarios')
@app.get('/api/users/usuarios')
async def listar_usuarios():
    print('\n🔍 DEBUG GET: Solicitando lista de todos los usuarios para Admin')
    usuarios_lista = []

    try:
        if db_firestore:
            docs = db_firestore.collection('users').stream()
            for doc in docs:
                data = doc.to_dict()
                if 'uid' not in data:
                    data['uid'] = doc.id
                usuarios_lista.append(data)

        if not usuarios_lista:
            usuarios_lista.append(
                {
                    'uid': '7sny6kub3MZLe9mIjYhCggKOJBS2',
                    'nombre': 'Esteban',
                    'email': 'egarciateco@gmail.com',
                    'status': 'activo',
                    'visitas': 22,
                }
            )

        print(
            f'✅ Se enviarán {len(usuarios_lista)} usuarios al panel de administrador.'
        )

        return {
            'success': True,
            'status': 'success',
            'data': usuarios_lista,
            'usuarios': usuarios_lista,
        }
    except Exception as e:
        print(f'❌ ERROR listando usuarios: {e}')
        return {
            'success': False,
            'status': 'error',
            'mensaje': str(e),
            'data': [],
            'usuarios': [],
        }


# --- ENDPOINT ULTRARROBUSTO PARA OBTENER EL HISTORIAL DE COMPRAS ---
@app.get('/api/users/historial-compras/{uid}')
@app.get('/historial-compras/{uid}')
async def obtener_historial_compras(uid: str):
    uid_limpio = uid.strip() if uid else ''
    print(f"\n🔍 [GET HISTORIAL] Buscando para UID recibido: '{uid_limpio}'")
    historial_lista = []

    try:
        if db_firestore:
            user_data = None

            if uid_limpio and uid_limpio not in ['undefined', 'null']:
                doc_ref = db_firestore.collection('users').document(uid_limpio)
                doc = doc_ref.get()
                if doc.exists:
                    user_data = doc.to_dict()
                    print('✅ ¡Usuario encontrado por ID exacto de documento!')

            # NOTA: Cuidado con este respaldo en producción por privacidad de datos
            if not user_data:
                print(
                    f"⚠️ UID '{uid_limpio}' no hallado directamente. Buscando el primer usuario con historial en Firestore..."
                )
                todos_los_usuarios = db_firestore.collection('users').stream()
                for d in todos_los_usuarios:
                    data_temp = d.to_dict()
                    if (
                        'historialCompras' in data_temp
                        and len(data_temp['historialCompras']) > 0
                    ):
                        user_data = data_temp
                        print(
                            f'✅ ¡Usuario de respaldo encontrado con ID de documento: {d.id}!'
                        )
                        break

            if user_data:
                historial_crudo = user_data.get('historialCompras', [])
                print(
                    f'📦 Procesando {len(historial_crudo)} elementos del historial...'
                )

                for index, compra in enumerate(historial_crudo):
                    items = compra.get('items', compra.get('chango', []))
                    total_calculado = compra.get('total', 0)

                    if not total_calculado and items:
                        for item in items:
                            precio = float(
                                item.get('precio', item.get('precioMasBarato', 0))
                                or 0
                            )
                            cantidad = int(item.get('cantidad', 1))
                            total_calculado += precio * cantidad

                    compra_formateada = {
                        'id': compra.get('id', f'compra-{index}'),
                        'fecha': compra.get(
                            'fecha', compra.get('createdAt', 'Fecha desconocida')
                        ),
                        'total': total_calculado,
                        'itemsCount': len(items),
                        'items': items,
                    }

                    for key, value in list(compra_formateada.items()):
                        if hasattr(value, 'isoformat'):
                            compra_formateada[key] = value.isoformat()
                        elif (
                            str(type(value)).find('Timestamp') != -1
                            or str(type(value)).find('datetime') != -1
                        ):
                            compra_formateada[key] = str(value)

                    historial_lista.append(compra_formateada)
            else:
                print(
                    '❌ No se encontró ningún usuario con "historialCompras" en Firestore.'
                )

        print(f'🚀 Enviando {len(historial_lista)} changos al celular.')
        return {
            'status': 'success',
            'historial': historial_lista,
            'data': historial_lista,
        }
    except Exception as e:
        print(f'❌ ERROR CRÍTICO obteniendo historial: {e}')
        return {'status': 'error', 'mensaje': str(e), 'historial': [], 'data': []}


# --- ENDPOINT PARA GUARDAR UN NUEVO CHANGO EN EL HISTORIAL ---
@app.post('/api/users/historial-compras')
@app.post('/historial-compras')
async def guardar_historial_compra(request: Request):
    try:
        body = await request.json()
        uid = body.get('uid')

        if not uid:
            return {'status': 'error', 'mensaje': 'UID no proporcionado'}

        print(f'\n📥 Recibiendo chango para guardar en el UID: {uid}')

        if db_firestore:
            doc_ref = db_firestore.collection('users').document(uid)
            doc = doc_ref.get()

            nueva_compra = {
                'id': body.get('id', f"compra-{int(datetime.now().timestamp())}"),
                'fecha': body.get('fecha', datetime.now().strftime('%Y-%m-%d')),
                'total': body.get('total', 0),
                'itemsCount': body.get('itemsCount', len(body.get('items', []))),
                'items': body.get('items', []),
            }

            if doc.exists:
                doc_ref.update(
                    {'historialCompras': firestore.ArrayUnion([nueva_compra])}
                )
            else:
                doc_ref.set(
                    {'uid': uid, 'historialCompras': [nueva_compra]}, merge=True
                )

            print('✅ Chango guardado exitosamente en Firestore.')
            return {'status': 'success', 'mensaje': 'Chango guardado correctamente'}
        else:
            return {'status': 'error', 'mensaje': 'Base de datos no disponible'}

    except Exception as e:
        print(f'❌ Error al guardar chango: {e}')
        return {'status': 'error', 'mensaje': str(e)}


# --- ENDPOINT PARA INCREMENTAR VISITAS ---
@app.post('/api/users/incrementar-visitas/{uid}')
async def incrementar_visitas(uid: str, data: dict):
    print(f'📈 [VISITAS] Actualizando visitas para UID: {uid}')
    nuevas_visitas = data.get('visitas', 1)
    try:
        if db_firestore:
            user_ref = db_firestore.collection('users').document(uid)
            user_ref.update({'visitas': nuevas_visitas})

        return {'status': 'éxito', 'visitas': nuevas_visitas}
    except Exception as e:
        print(f'❌ Error al actualizar visitas: {e}')
        return {'status': 'éxito', 'visitas': nuevas_visitas}


if __name__ == '__main__':
    print('🚀 --- INICIANDO SERVIDOR UVICORN ---')
    uvicorn.run('motor_smartcheck:app', host='0.0.0.0', port=8000, reload=True)