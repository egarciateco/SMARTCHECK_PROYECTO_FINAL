// categoriasConfig.js
const CATEGORIAS_SUPER = {
  "Almacen": {
    nombre: "Almacén",
    slug: "almacen",
    iconoPng: "https://tu-dominio.com/assets/iconos/almacen.png", // Reemplaza con tu URL o ruta
    colorFondo: "#E8F5E9",
    subcategorias: [
      "Desayuno y Merienda",
      "Harinas, Fideos y Arroz",
      "Aceites, Vinagres y Aderezos",
      "Enlatados y Conservas",
      "Golosinas y Chocolates",
      "Snacks y Galletitas Saladas"
    ]
  },
  "Bebidas sin Alcohol": {
    nombre: "Bebidas sin Alcohol",
    slug: "bebidas-sin-alcohol",
    iconoPng: "https://tu-dominio.com/assets/iconos/bebidas_sin_alcohol.png",
    colorFondo: "#E3F2FD",
    subcategorias: [
      "Gaseosas",
      "Aguas y Sodas",
      "Jugos",
      "Bebidas Isotónicas y Energizantes"
    ]
  },
  "Bebidas con Alcohol": {
    nombre: "Bebidas con Alcohol",
    slug: "bebidas-con-alcohol",
    iconoPng: "https://tu-dominio.com/assets/iconos/bebidas_con_alcohol.png",
    colorFondo: "#FBE9E7",
    subcategorias: [
      "Cervezas",
      "Vinos",
      "Espumantes",
      "Aperitivos y Fernet"
    ]
  },
  "Lacteos": {
    nombre: "Lácteos",
    slug: "lacteos",
    iconoPng: "https://tu-dominio.com/assets/iconos/lacteos.png",
    colorFondo: "#FFFDE7",
    subcategorias: [
      "Leches y Cremas",
      "Yogures y Postres",
      "Quesos Blandos y Untables",
      "Dulce de Leche"
    ]
  },
  "Limpieza": {
    nombre: "Limpieza",
    slug: "limpieza",
    iconoPng: "https://tu-dominio.com/assets/iconos/limpieza.png",
    colorFondo: "#EDE7F6",
    subcategorias: [
      "Cuidado de la Ropa y Lavado",
      "Limpieza de Pisos y Superficies",
      "Baños y Cocinas",
      "Papeles y Servilletas"
    ]
  },
  "Perfumeria y Cuidado Personal": {
    nombre: "Perfumería y Cuidado Personal",
    slug: "perfumeria-y-cuidado-personal",
    iconoPng: "https://tu-dominio.com/assets/iconos/perfumeria.png",
    colorFondo: "#FCE4EC",
    subcategorias: [
      "Cuidado Capilar (Shampoo y Acondicionador)",
      "Higiene Oral",
      "Cuidado Corporal y Cremas",
      "Jabones y Desodorantes"
    ]
  }
  // ... (puedes completar las 16 siguiendo exactamente esta misma estructura)
};

module.exports = { CATEGORIAS_SUPER };