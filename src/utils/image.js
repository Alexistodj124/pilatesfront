// Reduce una foto (p. ej. de celular, 3-8 MB) a un JPEG liviano en base64
// antes de mandarla al backend. Las fotos se guardan en base64 en la BD y
// vienen en cada GET /productos, así que conviene que pesen poco.
export function comprimirImagen(file, { maxLado = 1000, calidad = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)

      const escala = Math.min(1, maxLado / Math.max(img.width, img.height))
      const ancho = Math.round(img.width * escala)
      const alto = Math.round(img.height * escala)

      const canvas = document.createElement('canvas')
      canvas.width = ancho
      canvas.height = alto
      const ctx = canvas.getContext('2d')
      // Fondo blanco para PNG con transparencia (JPEG no tiene alfa)
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, ancho, alto)
      ctx.drawImage(img, 0, 0, ancho, alto)

      resolve(canvas.toDataURL('image/jpeg', calidad))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }

    img.src = url
  })
}
