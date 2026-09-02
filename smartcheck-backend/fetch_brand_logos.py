import pandas as pd
import json
import os
re = __import__('re')

# Configuración de archivos
CSV_FILE = 'productos.csv'
OUTPUT_JSON = 'marcas_logos.json'

print("📂 Leyendo el catálogo CSV para extraer marcas...")
try:
    # Ajusta 'marca' o 'brand' según el nombre exacto de la columna en tu CSV
    df = pd.read_csv(CSV_FILE, low_memory=False)
    
    # Intentar detectar la columna de marca automáticamente
    columna_marca = None
    for col in ['marca', 'brand', 'Marca', 'BRAND']:
        if col in df.columns:
            columna_marca = col
            break
            
    if not columna_marca:
        raise ValueError("No se encontró una columna de marca/brand en el CSV. Revisa los nombres de las columnas.")
        
    print(f"✅ Columna de marcas detectada: '{columna_marca}'")
    
    # Limpiar y obtener marcas únicas
    marcas_raw = df[columna_marca].dropna().astype(str).str.strip().unique()
    print(f"🔍 Total de marcas únicas encontradas: {len(marcas_raw)}")
    
    catalogo_marcas = {}
    
    for marca in marcas_raw:
        if marca.lower() in ['', 'nan', 'sin marca', 'genérico', 'varios']:
            continue
            
        # Normalizar nombre para generar un dominio estimado (ej: "La Serenisima" -> "laserenisima.com.ar")
        marca_clean = re.sub(r'[^a-zA-Z0-9]', '', marca.lower())
        
        # Generar URL de logo usando Clearbit Logo API como base gratuita rápida
        # (Si no existe el dominio, Clearbit devuelve 404, el frontend manejará el fallback)
        dominio_sugerido = f"{marca_clean}.com.ar"
        logo_url = f"https://logo.clearbit.com/{dominio_sugerido}"
        
        catalogo_marcas[marca] = {
            "nombreOriginal": marca,
            "slug": marca_clean,
            "logoUrl": logo_url,
            "dominioEstimado": dominio_sugerido
        }
        
    # Guardar resultado en JSON
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(catalogo_marcas, f, ensure_ascii=False, indent=4)
        
    print(f"🚀 ¡Listo! Catálogo de {len(catalogo_marcas)} marcas guardado en '{OUTPUT_JSON}'.")

except Exception as e:
    print(f"❌ Error procesando el archivo: {e}")