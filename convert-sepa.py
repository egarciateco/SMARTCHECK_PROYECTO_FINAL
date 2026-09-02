# ╔════════════════════════════════════════════════════════════════╗
#║  🐍 CONVERTIDOR SEPA A CSV/JSON - Sistema Electrónico de Precios ║
#╚════════════════════════════════════════════════════════════════╝

import pandas as pd
import zipfile
import os
from datetime import datetime

def convert_sepa_to_csv(zip_path, output_csv='ean_argentina.csv', output_json='ean_argentina.json'):
    """
    Convierte el archivo productos.csv desde el ZIP de SEPA a CSV y JSON
    """
    print(f'📦 Procesando: {zip_path}')
    
    try:
        # 1. Abrir el ZIP y leer el archivo de productos
        with zipfile.ZipFile(zip_path, 'r') as z:
            print('📂 Archivos en el ZIP:', z.namelist())
            
            # Buscar el archivo de productos
            productos_file = None
            for name in z.namelist():
                if 'productos' in name.lower() and name.endswith('.csv'):
                    productos_file = name
                    break
            
            if not productos_file:
                print('❌ No se encontró archivo de productos en el ZIP')
                return False
            
            print(f'📄 Leyendo: {productos_file}')
            
            # 2. Leer CSV con separador pipe
            with z.open(productos_file) as f:
                df = pd.read_csv(f, sep='|', encoding='utf-8', low_memory=False)
            
            print(f'✅ {len(df)} registros leídos')
            print('📋 Columnas disponibles:', df.columns.tolist())
            
            # 3. Filtrar columnas deseadas
            columnas_map = {
                'ean': ['ean', 'codigo', 'codigo_ean', 'gtin'],
                'nombre': ['nombre', 'descripcion', 'producto', 'nombre_producto'],
                'marca': ['marca', 'brand', 'marca_comercial'],
                'presentacion': ['presentacion', 'presentación', 'unidad_medida']
            }
            
            df_final = pd.DataFrame()
            
            for col_destino, col_origenes in columnas_map.items():
                for col_origen in col_origenes:
                    if col_origen in df.columns:
                        df_final[col_destino] = df[col_origen]
                        break
                if col_destino not in df_final.columns:
                    df_final[col_destino] = ''
            
            print(f'✅ {len(df_final)} productos procesados')
            
            # 4. Exportar a CSV
            df_final.to_csv(output_csv, index=False, encoding='utf-8')
            print(f'✅ CSV guardado: {output_csv}')
            
            # 5. Exportar a JSON
            df_final.to_json(output_json, orient='records', force_ascii=False, indent=2)
            print(f'✅ JSON guardado: {output_json}')
            
            # 6. Mover a la carpeta data del frontend
            import shutil
            destino_csv = '../smartcheck-nuevo/src/data/ean_argentina.csv'
            destino_json = '../smartcheck-nuevo/src/data/ean_argentina.json'
            
            shutil.copy(output_csv, destino_csv)
            shutil.copy(output_json, destino_json)
            print(f'✅ Archivos copiados a src/data/')
            
            return True
            
    except Exception as e:
        print(f'❌ Error: {e}')
        return False

# ✅ EJECUCIÓN
if __name__ == '__main__':
    print('╔════════════════════════════════════════════════════════╗')
    print('║  🐍 CONVERTIDOR SEPA v1.0                              ║')
    print('╚════════════════════════════════════════════════════════╝')
    print()
    
    # Buscar el ZIP más reciente en la carpeta
    zip_files = [f for f in os.listdir('.') if f.endswith('.zip') and f.startswith('sepa_')]
    
    if not zip_files:
        print('❌ No se encontraron archivos sepa_*.zip en la carpeta actual')
        print('Descargá el ZIP desde: https://datos.gob.ar/dataset/desarrollo-productivo-precios')
        exit(1)
    
    # Ordenar por fecha (el más reciente primero)
    zip_files.sort(reverse=True)
    zip_path = zip_files[0]
    
    print(f'📦 Usando: {zip_path}')
    print()
    
    success = convert_sepa_to_csv(zip_path)
    
    if success:
        print()
        print('✅ Conversión completada exitosamente!')
        print('📁 Archivos generados:')
        print('   - ean_argentina.csv')
        print('   - ean_argentina.json')
        print('   - ../smartcheck-nuevo/src/data/ean_argentina.csv')
        print('   - ../smartcheck-nuevo/src/data/ean_argentina.json')
    else:
        print()
        print('❌ Error en la conversión')