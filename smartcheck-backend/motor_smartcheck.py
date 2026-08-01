import pandas as pd
import requests
from bs4 import BeautifulSoup
import unicodedata
import re
import sqlite3
from datetime import datetime
import time

class SmartCheckEngine:
    def __init__(self, excel_path='productos.xlsx', db_path='cache_precios.db'):
        print("Inicializando SmartCheck Engine (Modo Híbrido + Sincronizador)...")
        self.db_path = db_path
        self.inicializar_db()
        
        try:
            self.df_maestro = pd.read_excel(excel_path)
            self.df_maestro['Códigos EAN'] = self.df_maestro['Códigos EAN'].astype(str).str.split('.').str[0].str.strip()
            print(f"Catálogo maestro cargado: {len(self.df_maestro)} productos listados.")
        except Exception as e:
            print(f"Error cargando el Excel maestro: {e}")
            self.df_maestro = pd.DataFrame(columns=['Códigos EAN', 'Descripción del Producto', 'Marca', 'Unidad de Medida'])

    def inicializar_db(self):
        """Crea la tabla local SQLite si no existe."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS precios_cache (
                ean TEXT,
                supermercado TEXT,
                precio REAL,
                nombre_en_tienda TEXT,
                enlace TEXT,
                fecha_actualizacion TEXT,
                PRIMARY KEY (ean, supermercado)
            )
        ''')
        conn.commit()
        conn.close()

    def guardar_en_cache(self, ean, supermercado, precio, nombre, enlace):
        """Guarda o actualiza el precio en la base de datos local."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO precios_cache (ean, supermercado, precio, nombre_en_tienda, enlace, fecha_actualizacion)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (str(ean), supermercado, float(precio), nombre, enlace, datetime.now().strftime("%Y-%m-%d %H:%M")))
        conn.commit()
        conn.close()

    def obtener_de_cache(self, ean, supermercado):
        """Recupera el precio guardado en la caché local."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT precio, nombre_en_tienda, enlace, fecha_actualizacion 
            FROM precios_cache 
            WHERE ean = ? AND supermercado = ?
        ''', (str(ean), supermercado))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "supermercado": supermercado,
                "nombre_en_tienda": row[1],
                "precio": row[0],
                "imagen": "",
                "enlace": row[2],
                "encontrado": True,
                "fuente": "Cache Local"
            }
        return None

    def normalizar_texto(self, texto):
        if not isinstance(texto, str):
            return ""
        nfkd = unicodedata.normalize('NFKD', texto)
        return "".join([c for c in nfkd if not unicodedata.combining(c)]).lower()

    def construir_termino_busqueda(self, marca, descripcion):
        desc_norm = self.normalizar_texto(descripcion)
        palabras_clave = ['fideos', 'arroz', 'aceite', 'harina', 'fideo', 'tallarines', 'tirabuzon', 'guiso', 'canelones', 'estrellas', 'dedalitos', 'coditos']
        categoria = ""
        for palabra in palabras_clave:
            if palabra in desc_norm:
                categoria = palabra
                break
        if not categoria:
            tokens = [w for w in desc_norm.split() if len(w) > 3][:2]
            categoria = " ".join(tokens)

        match_peso = re.search(r'\d+\s*(?:grs|gr|kg|ml|cc)', desc_norm)
        peso_str = match_peso.group(0) if match_peso else ""
        return re.sub(r'\s+', ' ', f"{marca} {categoria} {peso_str}".strip())

    def evaluar_y_filtrar_candidato(self, nombre_tienda, marca_oficial, desc_oficial):
        nombre_norm = self.normalizar_texto(nombre_tienda)
        marca_norm = self.normalizar_texto(marca_oficial)
        desc_norm = self.normalizar_texto(desc_oficial)

        if marca_norm and marca_norm not in nombre_norm:
            return False

        palabras_ignorar = {'de', 'con', 'en', 'x', 'grs', 'gr', 'kg', 'cc', 'ml', 'un', 'pack', 'l', 'g', 'cm'}
        tokens_oficiales = [w for w in desc_norm.split() if len(w) > 2 and w not in palabras_ignorar]
        if not tokens_oficiales:
            return True

        coincidencias = sum(1 for token in tokens_oficiales if token in nombre_norm)
        return coincidencias >= 1

    def consultar_vtex(self, supermercado, dominio_base, marca, descripcion):
        """Motor unificado para todas las plataformas VTEX (Incluyendo Coto, Carrefour, Jumbo, Vea, etc.)"""
        termino_busqueda = self.construir_termino_busqueda(marca, descripcion)
        url_api = f"{dominio_base}/api/catalog_system/pub/products/search?ft={requests.utils.quote(termino_busqueda)}"
        
        session = requests.Session()
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "es-AR,es;q=0.9",
            "Referer": f"{dominio_base}/"
        }
        session.headers.update(headers)

        try:
            session.get(dominio_base, timeout=6)
            response = session.get(url_api, timeout=8)
            if response.status_code in [200, 206]:
                productos = response.json()
                if isinstance(productos, list) and len(productos) > 0:
                    for prod in productos:
                        nombre = prod.get('productName', '')
                        if self.evaluar_y_filtrar_candidato(nombre, marca, descripcion):
                            items = prod.get('items', [])
                            if items:
                                item = items[0]
                                sellers = item.get('sellers', [])
                                if sellers:
                                    com_offer = sellers[0].get('commercialOffer', {}) or sellers[0].get('commertialOffer', {})
                                    precio = com_offer.get('Price', 0.0)
                                    link_text = prod.get('linkText', '')
                                    link = f"{dominio_base}/{link_text}/p" if link_text else dominio_base
                                    if precio > 0:
                                        return {
                                            "supermercado": supermercado,
                                            "nombre_en_tienda": nombre,
                                            "precio": float(precio),
                                            "enlace": link,
                                            "encontrado": True
                                        }
        except Exception:
            pass
        return None

    def consultar_maxiconsumo(self, marca, descripcion):
        """Consulta específica para Maxiconsumo."""
        termino_busqueda = self.construir_termino_busqueda(marca, descripcion)
        url = f"https://maxiconsumo.com/maory/catalogsearch/result/?q={requests.utils.quote(termino_busqueda)}"
        
        session = requests.Session()
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "es-AR,es;q=0.9",
            "Referer": "https://maxiconsumo.com/"
        }
        session.headers.update(headers)

        try:
            session.get("https://maxiconsumo.com/", timeout=6)
            response = session.get(url, timeout=8)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                items = soup.find_all('li', class_='item') or soup.find_all('div', class_='product-item-info')
                for item in items:
                    nombre_elem = item.find('a', class_='product-item-link') or item.find('h2')
                    nombre = nombre_elem.text.strip() if nombre_elem else ""
                    if nombre and self.evaluar_y_filtrar_candidato(nombre, marca, descripcion):
                        precio_elem = item.find('span', class_='price')
                        if precio_elem:
                            p_str = precio_elem.text.strip().replace('$', '').replace('.', '').replace(',', '.')
                            precio = float(''.join(c for c in p_str if c.isdigit() or c == '.'))
                            if precio > 0:
                                link = item.find('a').get('href', 'https://maxiconsumo.com')
                                return {"supermercado": "Maxiconsumo", "nombre_en_tienda": nombre, "precio": precio, "enlace": link, "encontrado": True}
        except Exception:
            pass
        return None

    def comparar_producto(self, ean_buscado, forzar_actualizacion=False):
        ean_buscado_str = str(ean_buscado).strip()
        info_sepsa = self.df_maestro[self.df_maestro['Códigos EAN'] == ean_buscado_str]
        
        if info_sepsa.empty:
            return None

        producto_oficial = {
            "ean": ean_buscado_str,
            "descripcion": info_sepsa.iloc[0]['Descripción del Producto'],
            "marca": info_sepsa.iloc[0]['Marca'],
            "unidad_medida": info_sepsa.iloc[0]['Unidad de Medida']
        }

        cadenas = {
            "Carrefour": "https://www.carrefour.com.ar",
            "MásOnline": "https://www.masonline.com.ar",
            "Disco": "https://www.disco.com.ar",
            "Jumbo": "https://www.jumbo.com.ar",
            "Vea": "https://www.vea.com.ar",
            "Día Online": "https://diaonline.supermercadosdia.com.ar",
            "Coto": "https://www.coto.com.ar",
            "Maxiconsumo": "MAXICONSUMO"
        }

        resultados = []

        for sup, dominio in cadenas.items():
            res = None
            if not forzar_actualizacion:
                res = self.obtener_de_cache(ean_buscado_str, sup)
            
            if not res:
                if sup == "Maxiconsumo":
                    res = self.consultar_maxiconsumo(producto_oficial['marca'], producto_oficial['descripcion'])
                else:
                    res = self.consultar_vtex(sup, dominio, producto_oficial['marca'], producto_oficial['descripcion'])
                
                if res:
                    self.guardar_en_cache(ean_buscado_str, sup, res['precio'], res['nombre_en_tienda'], res['enlace'])
                    res['fuente'] = "Red en Vivo"
            
            if res:
                resultados.append(res)
            else:
                resultados.append({
                    "supermercado": sup,
                    "nombre_en_tienda": "No disponible",
                    "precio": float('inf'),
                    "imagen": "",
                    "enlace": "#",
                    "encontrado": False,
                    "fuente": "N/A"
                })

        resultados.sort(key=lambda x: x['precio'])
        return producto_oficial, resultados

    def sincronizar_madrugada(self, max_productos=50):
        """
        Rutina de sincronización masiva para correr de madrugada.
        Recorre los primeros N productos del maestro y actualiza la caché local.
        """
        print(f"\n🌙 INICIANDO RUTINA DE SINCRONIZACIÓN NOCTURNA (Actualizando hasta {max_productos} productos)...")
        muestreo = self.df_maestro.head(max_productos)
        
        for index, row in muestreo.iterrows():
            ean = row['Códigos EAN']
            desc = row['Descripción del Producto']
            print(f"🔄 Sincronizando [{index+1}/{max_productos}]: {desc} (EAN: {ean})")
            self.comparar_producto(ean, forzar_actualizacion=True)
            time.sleep(1) # Pausa preventiva para evitar saturación
        print("✅ Sincronización nocturna finalizada con éxito. Caché actualizada.")

if __name__ == "__main__":
    engine = SmartCheckEngine('productos.xlsx')
    
    # 1. Si quieres correr una sincronización masiva ahora mismo (o dejarla para la madrugada):
    # Descomenta la siguiente línea para poblar masivamente la base de datos local:
    # engine.sincronizar_madrugada(max_productos=20)

    # 2. Prueba de comparativa estándar
    marcas_masivas = ['MATARAZZO', 'LUCCHETTI', 'DON VICENTE', 'FAVORITA']
    fideos_ejemplo = engine.df_maestro[
        engine.df_maestro['Marca'].isin(marcas_masivas) & 
        engine.df_maestro['Descripción del Producto'].str.contains('FIDEOS', case=False, na=False)
    ]
    
    if not fideos_ejemplo.empty:
        ean_a_probar = fideos_ejemplo.iloc[0]['Códigos EAN']
        
        print(f"\n--- COMPARANDO PRODUCTO ---")
        producto_oficial, comparativa = engine.comparar_producto(ean_a_probar)
        print(f"📄 {producto_oficial['descripcion']}")
        print(f"🏷️ Marca: {producto_oficial['marca']} | 📦 EAN: {producto_oficial['ean']}\n")
        
        print("🏆 RESULTADOS FINALES:")
        for i, item in enumerate(comparativa):
            if item['encontrado']:
                print(f"{i+1}. [{item['supermercado']}] Precio: ${item['precio']} (Fuente: {item.get('fuente', 'Desconocida')}) - {item['nombre_en_tienda']}")
            else:
                print(f"{i+1}. [{item['supermercado']}] No disponible")