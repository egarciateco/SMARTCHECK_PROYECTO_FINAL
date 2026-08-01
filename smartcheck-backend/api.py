from flask import Flask, jsonify, request
from motor_smartcheck import SmartCheckEngine
import os

app = Flask(__name__)

# Inicializar el motor apuntando a los archivos locales del backend
engine = SmartCheckEngine(excel_path='productos.xlsx', db_path='cache_precios.db')

@app.route('/api/buscar', methods=['GET'])
def buscar_productos():
    """Endpoint para que la app busque productos por texto (marca o descripción)."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({"error": "Debe proporcionar un término de búsqueda 'q'"}), 400
    
    df_filtrado = engine.df_maestro[
        engine.df_maestro['Descripción del Producto'].str.contains(query, case=False, na=False) |
        engine.df_maestro['Marca'].str.contains(query, case=False, na=False)
    ].head(20)
    
    resultados = []
    for _, row in df_filtrado.iterrows():
        resultados.append({
            "ean": str(row['Códigos EAN']),
            "marca": row['Marca'],
            "descripcion": row['Descripción del Producto'],
            "unidad_medida": row['Unidad de Medida']
        })
    return jsonify(resultados)

@app.route('/api/comparar/<ean>', methods=['GET'])
def comparar_precio(ean):
    """Endpoint que devuelve la comparativa completa de un producto por su EAN."""
    resultado = engine.comparar_producto(ean)
    if not resultado:
        return jsonify({"error": "Producto no encontrado en el catálogo maestro"}), 404
    
    producto_oficial, comparativa = resultado
    return jsonify({
        "producto": producto_oficial,
        "resultados": comparativa
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)