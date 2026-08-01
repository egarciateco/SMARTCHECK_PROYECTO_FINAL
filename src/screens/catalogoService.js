import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

// 1. Obtener todos los productos para extraer dinámicamente rubros, marcas y tipos
export async function obtenerCatalogoCompleto() {
  try {
    const querySnapshot = await getDocs(collection(db, 'productos'));
    const productos = [];
    querySnapshot.forEach((docSnap) => {
      productos.push({ id: docSnap.id, ...docSnap.data() });
    });
    return productos;
  } catch (error) {
    console.error("Error al obtener el catálogo:", error);
    return [];
  }
}import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

// 1. Obtener todos los productos para extraer dinámicamente rubros, marcas y tipos
export async function obtenerCatalogoCompleto() {
  try {
    const querySnapshot = await getDocs(collection(db, 'productos'));
    const productos = [];
    querySnapshot.forEach((docSnap) => {
      productos.push({ id: docSnap.id, ...docSnap.data() });
    });
    return productos;
  } catch (error) {
    console.error("Error al obtener el catálogo:", error);
    return [];
  }
}