import sys
from motor_smartcheck import SmartCheckEngine

def ejecutar_cli():
    print("==================================================")
    print("      SMARTCHECK - COMPARADOR DE PRECIOS        ")
    print("==================================================")
    
    # Inicializar el motor
    engine = SmartCheckEngine('productos.xlsx')
    
    while True:
        print("\nOpciones disponibles:")
        print("1. Buscar producto por Código EAN")
        print("2. Buscar producto por Nombre / Descripción")
        print("3. Ejecutar sincronización nocturna (Lote de madrugada)")
        print("4. Salir")
        
        opcion = input("\nSeleccione una opción (1-4): ").strip()
        
        if opcion == '1':
            ean = input("Ingrese el Código EAN exacto: ").strip()
            resultado = engine.comparar_producto(ean)
            mostrar_resultados(resultado)
            
        elif opcion == '2':
            termino = input("Ingrese parte del nombre o marca a buscar: ").strip()
            coincidencias = engine.df_maestro[
                engine.df_maestro['Descripción del Producto'].str.contains(termino, case=False, na=False) |
                engine.df_maestro['Marca'].str.contains(termino, case=False, na=False)
            ].head(10)
            
            if coincidencias.empty:
                print("❌ No se encontraron productos con ese término en el catálogo maestro.")
                continue
                
            print(f"\nSe encontraron {len(coincidencias)} productos:")
            for idx, row in enumerate(coincidencias.itertuples(), 1):
                print(f"{idx}. [{row.Marca}] {row.Descripción_del_Producto} (EAN: {row._1})")
                
            try:
                seleccion = int(input("\nElija el número de producto a comparar (0 para cancelar): "))
                if seleccion > 0 and seleccion <= len(coincidencias):
                    ean_seleccionado = str(coincidencias.iloc[seleccion-1]['Códigos EAN'])
                    resultado = engine.comparar_producto(ean_seleccionado)
                    mostrar_resultados(resultado)
            except ValueError:
                print("Entrada inválida.")
                
        elif opcion == '3':
            try:
                cantidad = int(input("¿Cuántos productos desea sincronizar en este lote? (ej. 20): "))
                engine.sincronizar_madrugada(max_productos=cantidad)
            except ValueError:
                print("Cantidad inválida.")
                
        elif opcion == '4':
            print("¡Gracias por usar SmartCheck!")
            sys.exit()
        else:
            print("Opción no válida. Intente nuevamente.")

def mostrar_resultados(resultado):
    if not resultado:
        return
    
    producto_oficial, comparativa = resultado
    print(f"\n--------------------------------------------------")
    print(f"📄 PRODUCTO: {producto_oficial['descripcion']}")
    print(f"🏷️ Marca: {producto_oficial['marca']} | 📦 EAN: {producto_oficial['ean']}")
    print(f"--------------------------------------------------")
    print("🏆 RESULTADOS ORDENADOS DE MENOR A MAYOR PRECIO:\n")
    
    for i, item in enumerate(comparativa, 1):
        if item['encontrado']:
            print(f"{i}. [{item['supermercado']}] ➔ ${item['precio']:,.2f}")
            print(f"   Tienda: {item['nombre_en_tienda']}")
            print(f"   Fuente: {item.get('fuente', 'N/A')} | Enlace: {item['enlace']}")
        else:
            print(f"{i}. [{item['supermercado']}] ➔ No disponible")
        print()

if __name__ == "__main__":
    ejecutar_cli()