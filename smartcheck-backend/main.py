import os
import json
import io
import base64
import math
import time
import threading
import sqlite3
from datetime import datetime
from PIL import Image, ImageOps
from fastapi import FastAPI, Query, Request
from fastapi.responses import JSONResponse
import firebase_admin     
from firebase_admin import credentials, firestore
import face_recognition
import numpy as np
import pandas as pd
import uvicorn

app = FastAPI(title="SmartCheck API Optimizada")

# --- CONFIGURACIÓN DE FIREBASE ---
db = None
cred_json = os.environ.get("FIREBASE_CREDENTIALS_JSON")

if cred_json:
    try:
        cred_json_clean = cred_json.strip()
        if cred_json_clean.startswith("'") and cred_json_clean.endswith("'"):
            cred_json_clean = cred_json_clean[1:-1]
        
        cred_dict = json.loads(cred_json_clean)
        cred = credentials.Certificate(cred_dict)
        
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
            
        db = firestore.client()
        print(">>> [FIREBASE] ¡Conectado vía variable de entorno!")
    except Exception as e:
        print(f">>> [FIREBASE ERROR] No se pudo parsear el JSON o conectar: {e}")
else:
    archivo_local = None
    for f in os.listdir('.'):
        if f.endswith('.json') and ('firebase' in f.lower() or 'key' in f.lower() or 'cred' in f.lower() or 'account' in f.lower()):
            archivo_local = f
            break
            
    if not archivo_local and os.path.exists('serviceAccountKey.json'):
        archivo_local = 'serviceAccountKey.json'

    if archivo_local:
        try:
            cred = credentials.Certificate(archivo_local)
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            db = firestore.client()
            print(f"📂 Firebase inicializado correctamente desde archivo local: {archivo_local}")
        except Exception as e:
            print(f">>> [FIREBASE ERROR] No se pudo inicializar desde {archivo_local}: {e}")
    else:
        print(">>> [FIREBASE ADVERTENCIA] No se encontró la variable de entorno ni ningún archivo JSON local de Firebase.")

def calcular_distancia(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

def extraer_precio_robusto(d):
    campos = ['precio', 'precioNumerico', 'precioActual', 'precio_unitario', 'valor', 'precioRegular']
    for campo in campos:
        val = d.get(campo)
        if val is not None:
            try:
                s_val = str(val).replace('$', '').replace('ARS', '').strip().replace(',', '.')
                f_val = float(s_val)
                if f_val > 0:
                    return f_val
            except (ValueError, TypeError):
                pass
            
    precios_super = d.get('preciosPorSupermercado', {})
    if isinstance(precios_super, dict) and precios_super:
        precios_validos = []
        for sup, p_val in precios_super.items():
            if p_val is not None:
                try:
                    s_val = str(p_val).replace('$', '').replace('ARS', '').strip().replace(',', '.')
                    f_val = float(s_val)
                    if f_val > 0:
                        precios_validos.append(f_val)
                except (ValueError, TypeError):
                    pass
        if precios_validos:
            return min(precios_validos)
            
    return 0.0

def obtener_archivo_logo(nombre_super):
    if not nombre_super:
        return "default.png"
    n = str(nombre_super).lower().strip()
    if 'carrefour' in n: return 'carrefour.png'
    if 'coto' in n: return 'coto.png'
    if 'dia' in n: return 'dia.png'
    if 'disco' in n: return 'disco.png'
    if 'jumbo' in n: return 'jumbo.png'
    if 'vea' in n: return 'vea.png'
    if 'walmart' in n: return 'walmart.png'
    if 'maxiconsumo' in n: return 'maxiconsumo.png'
    if 'changomas' in n: return 'changomas.png'
    if 'mas' in n: return 'mas_online.png'
    if 'anónima' in n or 'lanonima' in n: return 'lanonima.png'
    return 'default.png'


# --- MOTOR DE BÚSQUEDA FTS5 ---
DB_SQLITE_PATH = "cache_productos.db"
_sqlite_lock = threading.Lock()

def inicializar_motor_busqueda():
    with _sqlite_lock:
        conn = sqlite3.connect(DB_SQLITE_PATH, check_same_thread=False)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='productos_fts';")
        if cursor.fetchone():
            cursor.execute("SELECT COUNT(*) FROM productos_fts;")
            if cursor.fetchone()[0] > 0:
                conn.close()
                return

        cursor.execute("DROP TABLE IF EXISTS productos_fts;")
        cursor.execute("""
            CREATE VIRTUAL TABLE productos_fts USING fts5(
                ean, nombre, marca, medida, imagen, precio, supermercadoMasBarato, preciosJson
            );
        """)
        
        if db:
            docs = db.collection('productos').get()
            batch_data = []
            for doc in docs:
                d = doc.to_dict()
                ean = str(d.get('ean', doc.id))
                nombre = str(d.get('nombre', d.get('descripcion', '')))
                marca = str(d.get('marca', ''))
                medida = str(d.get('medida', 'un'))
                imagen = str(d.get('imagen', ''))
                precio = extraer_precio_robusto(d)
                super_barato = str(d.get('supermercadoMasBarato', 'N/A'))
                precios_json = json.dumps(d.get('preciosPorSupermercado', {}))
                
                batch_data.append((ean, nombre, marca, medida, imagen, precio, super_barato, precios_json))
                
            if batch_data:
                cursor.executemany("""
                    INSERT INTO productos_fts (ean, nombre, marca, medida, imagen, precio, supermercadoMasBarato, preciosJson)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """, batch_data)
                conn.commit()
        conn.close()

threading.Thread(target=inicializar_motor_busqueda).start()


@app.get('/api/buscar')
@app.get('/api/productos/buscar')
@app.get('/api/productos/sugerencias')
@app.get('/api/sugerencias')
@app.get('/api/productos/autocompletar')
def buscar_productos(q: str = Query("")):
    try:
        query = q.strip()
        if not query or query.lower() in ['undefined', 'null']:
            return []  
            
        with _sqlite_lock:
            conn = sqlite3.connect(DB_SQLITE_PATH, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            query_limpia = "".join([c for c in query if c.isalnum() or c.isspace()])
            palabras = query_limpia.split()
            
            if palabras:
                fts_query = " AND ".join([f'"{p}"*' for p in palabras])
            else:
                fts_query = "*"
            
            try:
                cursor.execute("""
                    SELECT ean, nombre, marca, medida, imagen, precio, supermercadoMasBarato, preciosJson 
                    FROM productos_fts 
                    WHERE productos_fts MATCH ? 
                    LIMIT 20;
                """, (fts_query,))
                rows = cursor.fetchall()
            except Exception:
                cursor.execute("SELECT * FROM productos_fts LIMIT 20;")
                rows = cursor.fetchall()
                
            conn.close()
            
        resultados = []
        for row in rows:
            precios_dict = {}
            try:
                precios_dict = json.loads(row['preciosJson'])
            except Exception:
                pass
                
            super_barato = str(row['supermercadoMasBarato'])
            
            resultados.append({
                "ean": str(row['ean']),
                "marca": str(row['marca']),
                "nombre": str(row['nombre']),
                "descripcion": str(row['nombre']),
                "medida": str(row['medida']),
                "imagen": str(row['imagen']),
                "precio": float(row['precio'] or 0.0),
                "supermercadoMasBarato": super_barato,
                "logoMasBarato": obtener_archivo_logo(super_barato),
                "preciosPorSupermercado": precios_dict
            })
            
        return resultados
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get('/api/comparar/{ean}')
def comparar_precio(ean: str):
    try:
        if not db:
            return JSONResponse(status_code=500, content={"error": "Base de datos no disponible"})
        
        docs = db.collection('productos').where('ean', '==', str(ean)).limit(1).get()
        producto_data = None
        for doc in docs:
            producto_data = doc.to_dict()
            break
            
        if not producto_data:
            doc_ref = db.collection('productos').document(str(ean))
            doc_snapshot = doc_ref.get()
            if doc_snapshot.exists:
                producto_data = doc_snapshot.to_dict()
                
        if not producto_data:
            return JSONResponse(status_code=404, content={"error": "Producto no encontrado"})
        
        precios_super = producto_data.get('preciosPorSupermercado', {})
        comparativa = []
        for supermercado, precio in precios_super.items():
            p_val = 0.0
            if precio is not None:
                try:
                    p_val = float(str(precio).replace('$', '').replace('ARS', '').strip().replace(',', '.'))
                except:
                    pass
            comparativa.append({
                "supermercado": supermercado,
                "precio": p_val,
                "disponible": bool(p_val > 0),
                "logo": obtener_archivo_logo(supermercado)
            })
            
        precio_principal = extraer_precio_robusto(producto_data)
        super_barato = str(producto_data.get('supermercadoMasBarato', 'N/A'))
        
        return {
            "producto": {
                "ean": str(producto_data.get('ean', ean)),
                "nombre": str(producto_data.get('nombre', '')),
                "marca": str(producto_data.get('marca', '')),
                "medida": str(producto_data.get('medida', '')),
                "precio": float(precio_principal),
                "supermercadoMasBarato": super_barato,
                "logoMasBarato": obtener_archivo_logo(super_barato)
            },
            "resultados": comparativa
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get('/api/producto/{ean}')
def obtener_producto_por_ean(ean: str):
    try:
        if not db:
            return JSONResponse(status_code=500, content={"error": "Base de datos no disponible"})
        
        docs = db.collection('productos').where('ean', '==', str(ean)).limit(1).get()
        producto_data = None
        for doc in docs:
            producto_data = doc.to_dict()
            break
            
        if not producto_data:
            doc_ref = db.collection('productos').document(str(ean))
            doc_snapshot = doc_ref.get()
            if doc_snapshot.exists:
                producto_data = doc_snapshot.to_dict()
                
        if not producto_data:
            return JSONResponse(status_code=404, content={"error": "Producto no encontrado"})
        
        precios_super = producto_data.get('preciosPorSupermercado', {})
        lista_precios_formateada = []
        for super_nombre, precio_val in precios_super.items():
            if precio_val is not None:
                try:
                    p_val = float(str(precio_val).replace('$', '').replace('ARS', '').strip().replace(',', '.'))
                    if p_val > 0:
                        lista_precios_formateada.append({
                            "supermercado": super_nombre,
                            "precio": p_val,
                            "logo": obtener_archivo_logo(super_nombre)
                        })
                except:
                    pass

        super_barato = producto_data.get('supermercadoMasBarato', 'N/A')
        return {
            "nombre": producto_data.get('nombre', ''),
            "marca": producto_data.get('marca', ''),
            "medida": producto_data.get('medida', ''),
            "imagen": producto_data.get('imagen', ''),
            "precios": lista_precios_formateada,
            "supermercadoMasBarato": super_barato,
            "logoMasBarato": obtener_archivo_logo(super_barato)
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get('/api/supermercados/cercanos')
def supermercados_cercanos(lat: str = Query(None), lng: str = Query(None)):
    try:
        if not lat or not lng:
            return JSONResponse(status_code=400, content={"error": "Debe proporcionar lat y lng"})
            
        user_lat = float(str(lat).strip().replace(',', '.'))
        user_lng = float(str(lng).strip().replace(',', '.'))
        
        if os.path.exists('sucursales.csv'):
            df_sucursales = pd.read_csv('sucursales.csv')
            sucursales = []
            for _, row in df_sucursales.iterrows():
                try:
                    s_lat = float(str(row.get('latitude', row.get('lat', 0))).strip().replace(',', '.'))
                    s_lng = float(str(row.get('longitude', row.get('lng', 0))).strip().replace(',', '.'))
                    if s_lat == 0.0 or s_lng == 0.0:
                        continue
                    dist_km = calcular_distancia(user_lat, user_lng, s_lat, s_lng)
                    nombre_super = row.get('supermercado', row.get('nombre', 'Supermercado'))
                    sucursales.append({
                        "id": str(row.get('id', '')),
                        "nombre": nombre_super,
                        "logo": obtener_archivo_logo(nombre_super),
                        "direccion": row.get('direccion', ''),
                        "lat": s_lat,
                        "lng": s_lng,
                        "distancia_km": round(dist_km, 2),
                        "distancia": f"{int(dist_km * 1000)}m" if dist_km < 1 else f"{round(dist_km, 1)}km"
                    })
                except:
                    continue
            sucursales = sorted(sucursales, key=lambda x: x['distancia_km'])
            return sucursales
        return []
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get('/')
def home():
    return {"status": "online", "message": "SmartCheck API Optimizada (FastAPI)"}


# --- RUTA DE REGISTRO FACIAL 100% JSON & BASE64 ---
@app.post('/register-facial')
@app.post('/api/users/register-facial')
async def register_facial(request: Request):
    try:
        body_bytes = await request.body()
        body_json = json.loads(body_bytes)
        
        nombre = str(body_json.get('nombre', ''))
        apellido = str(body_json.get('apellido', ''))
        email = str(body_json.get('email', ''))
        sexo = str(body_json.get('sexo', ''))
        fechaNacimiento = str(body_json.get('fechaNacimiento', ''))
        localidad = str(body_json.get('localidad', ''))
        provincia = str(body_json.get('provincia', ''))
        
        base64_img = body_json.get('image_base64') or body_json.get('foto') or body_json.get('image') or body_json.get('imageFile')
        if not base64_img:
            return JSONResponse(status_code=400, content={"success": False, "mensaje": "Sin imagen adjunta"})

        if ',' in base64_img:
            base64_img = base64_img.split(',')[1]
        file_bytes = base64.b64decode(base64_img)

        image_pil = Image.open(io.BytesIO(file_bytes)).convert('RGB')
        image_pil = ImageOps.exif_transpose(image_pil)
        image_pil.thumbnail((800, 800))
        
        buffered = io.BytesIO()
        image_pil.save(buffered, format="JPEG")
        base64_foto = base64.b64encode(buffered.getvalue()).decode('utf-8')

        image_np = np.array(image_pil, dtype=np.uint8)
        encodings = face_recognition.face_encodings(image_np)
        
        if len(encodings) == 0:
            return JSONResponse(status_code=400, content={"success": False, "mensaje": "No se detectó ningún rostro en la imagen"})

        face_descriptor = encodings[0].tolist()

        nuevo_usuario = {
            "nombre": nombre.strip(),
            "apellido": apellido.strip(),
            "email": email.strip().lower(),
            "sexo": sexo,
            "fechaNacimiento": fechaNacimiento,
            "localidad": localidad.strip(),
            "provincia": provincia.strip(),
            "faceDescriptor": face_descriptor,
            "foto": f"data:image/jpeg;base64,{base64_foto}",
            "createdAt": datetime.utcnow().isoformat()
        }

        if db:
            doc_ref = db.collection('users').document()
            doc_ref.set(nuevo_usuario)
            nuevo_usuario["uid"] = doc_ref.id
            nuevo_usuario["userId"] = doc_ref.id
        else:
            nuevo_usuario["uid"] = "temp_uid"

        return {
            "success": True,
            "mensaje": "Registro facial exitoso",
            "usuario": nuevo_usuario
        }
    except Exception as e:
        print(f"❌ Error crítico en registro facial Python: {str(e)}")
        return JSONResponse(status_code=500, content={"success": False, "mensaje": str(e), "status": "error"})


# --- RUTA DE BIOMETRÍA 100% JSON & BASE64 (BLINDADA) ---
@app.post('/biometria')
@app.post('/api/biometria')
@app.post('/api/users/biometria')
async def login_biometric(request: Request):
    try:
        body_bytes = await request.body()
        body_json = json.loads(body_bytes)
        
        base64_img = body_json.get('image_base64') or body_json.get('foto') or body_json.get('image') or body_json.get('imageFile')
        if not base64_img:
            return JSONResponse(status_code=400, content={"success": False, "mensaje": "Sin imagen adjunta"})

        if ',' in base64_img:
            base64_img = base64_img.split(',')[1]
        file_bytes = base64.b64decode(base64_img)

        image_pil = Image.open(io.BytesIO(file_bytes)).convert('RGB')
        image_pil = ImageOps.exif_transpose(image_pil)
        image_pil.thumbnail((800, 800))
        image_np = np.array(image_pil, dtype=np.uint8)
        
        encodings = face_recognition.face_encodings(image_np)
        if len(encodings) == 0:
            return JSONResponse(status_code=400, content={"success": False, "mensaje": "No se detectó rostro en la imagen"})

        incoming_encoding = encodings[0]
        best_match_user = None
        lowest_distance = 1.0
        THRESHOLD = 0.55

        if not db:
            return JSONResponse(status_code=500, content={"success": False, "mensaje": "Base de datos no disponible"})

        users_docs = db.collection('users').get()
        for doc in users_docs:
            user_data = doc.to_dict()
            stored_descriptor = user_data.get('faceDescriptor')
            if stored_descriptor and isinstance(stored_descriptor, list):
                try:
                    distance = face_recognition.face_distance([np.array(stored_descriptor)], incoming_encoding)[0]
                    if distance < lowest_distance:
                        lowest_distance = distance
                        best_match_user = {**user_data, "id": doc.id, "uid": doc.id}
                except Exception:
                    pass

        if best_match_user and lowest_distance <= THRESHOLD:
            return {
                "success": True,
                "message": "Autenticación exitosa",
                "user": best_match_user,
                "usuario": best_match_user
            }
        else:
            return JSONResponse(status_code=401, content={"success": False, "mensaje": "Rostro no reconocido"})
            
    except Exception as e:
        print(f"❌ Error crítico en biometría Python: {str(e)}")
        return JSONResponse(status_code=500, content={"success": False, "mensaje": str(e), "status": "error"})


@app.get('/api/users/usuarios')
def get_all_usuarios():
    if not db: 
        return JSONResponse(status_code=500, content={"success": False})
    docs = db.collection('users').get()
    return {"success": True, "usuarios": [{**d.to_dict(), "id": d.id} for d in docs]}


@app.get('/api/productos')
def get_productos():
    if not db: 
        return JSONResponse(status_code=500, content={"success": False})
    docs = db.collection('productos').get()
    return {"success": True, "productos": [{**d.to_dict(), "id": d.id} for d in docs]}


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    uvicorn.run(app, host='0.0.0.0', port=port)