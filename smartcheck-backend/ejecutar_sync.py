import asyncio
from motor_smartcheck import engine

async def main():
    print("Iniciando sincronización completa de precios desde GitHub Actions...")
    try:
        await engine.sincronizar_completo_async()
        print("¡Sincronización de precios finalizada con éxito!")
    except Exception as e:
        print(f"Error durante la sincronización: {e}")
        exit(1)

if __name__ == "__main__":
    asyncio.run(main())