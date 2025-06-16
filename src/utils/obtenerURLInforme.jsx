// src/utils/obtenerURLInforme.js

export function obtenerURLInforme(valor) {
    if (!valor) return null;

    try {
        const url = new URL(valor);
        const filename = url.pathname.split("/").pop();
        return `https://sgpnyeashmuwwlpvxbgm.supabase.co/storage/v1/object/public/informes/${filename}`;
    } catch {
        return `https://sgpnyeashmuwwlpvxbgm.supabase.co/storage/v1/object/public/informes/${valor}`;
    }
}
