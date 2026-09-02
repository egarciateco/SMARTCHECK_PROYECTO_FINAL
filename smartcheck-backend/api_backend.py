from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import aiohttp
import asyncio
import os
from motor_smartcheck import SmartCheckEngineAsync  # Importa la clase que armamos antes

app = FastAPI(
    title="SmartCheck API",
    description="Backend oficial de comparación de precios de supermercados (Estilo Pricely)",
    version="1.0.0"
)

# Configurar CORS para permitir peticiones desde tu app móvil o web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instanciar el motor globalmente
engine = SmartCheckEngineAsync('productos.xlsx')

@app.get("/")
def read_root():
    return {"status": "online", "mensaje": "SmartCheck Engine API funcionando correctamente 🚀"}

@app.get("/api/producto/{ean}")
async def consultar_producto(ean: str, forzar: bool = False):
    """
    Endpoint principal consumido por la app. 
    Busca el precio actual en vivo o caché y lo devuelve estructurado.
    """
    async with aiohttp.ClientSession() as session:
        resultado = await engine.comparar_producto_async(session, ean, forzar_actualizacion=forzar)
        
        if not resultado:
            raise HTTPException(status_code=404, detail="Producto no encontrado en el catálogo maestro.")
        
        producto_oficial, comparativa = resultado
        
        return {
            "producto": producto_oficial,
            "comparativa": comparativa
        }

@app.post("/api/sincronizar-background")
def disparar_sincronizacion(background_tasks: BackgroundTasks):
    """
    Dispara la sincronización masiva en segundo plano para que el servidor 
    no se quede esperando y responda de inmediato a la petición de cron.
    """
    async def tarea_en_segundo_plano():
        await engine.sincronizar_madrugada_async()

    background_tasks.add_task(tarea_en_segundo_plano)
    return {"mensaje": "Sincronización nocturna masiva iniciada en segundo plano."}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("api_backend:app", host="0.0.0.0", port=port)