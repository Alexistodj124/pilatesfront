import * as React from 'react'
import {
  Box, Typography, TextField, Button, Stack, MenuItem,
  Paper, InputAdornment, Snackbar, Alert, Dialog,
  DialogTitle,
  DialogContent,
  DialogActions, IconButton
} from '@mui/material'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import AddIcon from '@mui/icons-material/Add'

import { API_BASE_URL } from '../config/api'


const tienda = [
  { id: 1, nombre: 'Astrid Tienda' },
  { id: 2, nombre: 'Otra Tienda' },
]

export default function NuevaCompra() {
  const [producto, setProducto] = React.useState({
    sku: '',
    tiendaId: '',
    marcaId: '',
    categoriaId: '',
    tallaId: '',
    descripcion: '',
    costo: 0,
    precio: 0,
    cantidad: 0,
    imagen: '',
  })
  const [tiendas, setTiendas] = React.useState([])
  const [tallas, setTallas] = React.useState([])

  // y los dialogs/handlers nuevos:
  const [openNuevaTienda, setOpenNuevaTienda] = React.useState(false)
  const [nuevaTiendaNombre, setNuevaTiendaNombre] = React.useState('')
  const [openNuevaTalla, setOpenNuevaTalla] = React.useState(false)
  const [nuevaTallaNombre, setNuevaTallaNombre] = React.useState('')




  const [preview, setPreview] = React.useState('')
  const [snack, setSnack] = React.useState({ open: false, msg: '', severity: 'success' })
  const [openNuevaCat, setOpenNuevaCat] = React.useState(false)
  const [nuevaCatNombre, setNuevaCatNombre] = React.useState('')
  const [nuevaCatDescripcion, setNuevaCatDescripcion] = React.useState('')
  const [categoriasProductos, setCategoriasProductos] = React.useState([])

  const [marcasProductos, setMarcasProductos] = React.useState([])

  const [openNuevaMarca, setOpenNuevaMarca] = React.useState(false)
  const [nuevaMarcaNombre, setNuevaMarcaNombre] = React.useState('')
  const [nuevaMarcaDescripcion, setNuevaMarcaDescripcion] = React.useState('')

  const [openNuevoProducto, setOpenNuevoProducto] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [mensajeExito, setMensajeExito] = React.useState('')
  const [openSnackbarExito, setOpenSnackbarExito] = React.useState(false)
  const fileInputRef = React.useRef(null)



  const handleCloseSnackbarExito = (_, reason) => {
    if (reason === 'clickaway') return
    setOpenSnackbarExito(false)
  }

  const cargarCategoriasProductos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categorias-productos`)
      if (!res.ok) throw new Error('Error al obtener categorías de productos')
      const data = await res.json()
      // data viene como array de objetos { id, nombre, descripcion, activo }
      setCategoriasProductos(data)
    } catch (err) {
      console.error(err)
    }
  }

  const cargarMarcasProductos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/marcas-productos`)
      if (!res.ok) throw new Error('Error al obtener marcas de productos')
      const data = await res.json()
      setMarcasProductos(data) // array de { id, nombre, descripcion, activo }
    } catch (err) {
      console.error(err)
    }
  }

  const cargarTallas = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tallas`)
      if (!res.ok) throw new Error('Error al obtener marcas de productos')
      const data = await res.json()
      setTallas(data) // array de { id, nombre, descripcion, activo }
    } catch (err) {
      console.error(err)
    }
  }

  const cargarTiendas = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tiendas`)
      if (!res.ok) throw new Error('Error al obtener marcas de productos')
      const data = await res.json()
      setTiendas(data) // array de { id, nombre, descripcion, activo }
    } catch (err) {
      console.error(err)
    }
  }

  const handleGuardarNuevaTienda = async () => {
    const nombre = nuevaTiendaNombre.trim()
    if (!nombre) return

    try {
      const res = await fetch(`${API_BASE_URL}/tiendas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('Error creando tienda:', errText)
        return
      }

      const creada = await res.json() // { id, nombre, ... }

      // refrescar lista
      await cargarTiendas()

      // seleccionar automáticamente la nueva tienda (si devuelve id)
      if (creada?.id) {
        setProducto(p => ({ ...p, tiendaId: creada.id }))
      }

      setOpenNuevaTienda(false)
    } catch (error) {
      console.error(error)
    }
  }

  const handleGuardarNuevaTalla = async () => {
    const nombre = nuevaTallaNombre.trim()
    if (!nombre) return

    try {
      const res = await fetch(`${API_BASE_URL}/tallas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('Error creando talla:', errText)
        return
      }

      const creada = await res.json() // { id, nombre, ... }

      // refrescar lista
      await cargarTallas()

      // seleccionar automáticamente la nueva talla
      if (creada?.id) {
        setProducto(p => ({ ...p, tallaId: creada.id }))
      }

      setOpenNuevaTalla(false)
    } catch (error) {
      console.error(error)
    }
  }



  const handleOpenNuevaCat = () => {
    setNuevaCatNombre('')
    setNuevaCatDescripcion('')
    setOpenNuevaCat(true)
  }

  const handleCloseNuevaCat = () => {
    setOpenNuevaCat(false)
  }

  const handleGuardarNuevaCat = async () => {
    const nombre = nuevaCatNombre.trim()
    const descripcion = nuevaCatDescripcion.trim() || null

    if (!nombre) return

    try {
      const res = await fetch(`${API_BASE_URL}/categorias-productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre, descripcion }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('Error creando categoría de producto:', errText)
        return
      }

      await res.json() // por si quieres usar el id después

      // 🔁 Refrescar categorías desde el backend
      await cargarCategoriasProductos()

      // Seleccionar automáticamente la nueva categoría en el producto
      setProducto((p) => ({ ...p, categoria: nombre }))

      setOpenNuevaCat(false)
    } catch (error) {
      console.error(error)
    }
  }
  const handleGuardarNuevaMarca = async () => {
    const nombre = nuevaMarcaNombre.trim()
    const descripcion = nuevaMarcaDescripcion.trim() || null

    if (!nombre) return

    try {
      const res = await fetch(`${API_BASE_URL}/marcas-productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre, descripcion }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('Error creando marca de producto:', errText)
        return
      }

      await res.json() // por si quieres usar el id luego

      // 🔁 Refrescar marcas desde el backend
      await cargarMarcasProductos()

      // Seleccionar automáticamente la nueva marca en el producto
      setProducto((p) => ({ ...p, marcaId: nombre }))

      setOpenNuevaMarca(false)
    } catch (error) {
      console.error(error)
    }
  }


  React.useEffect(() => {
    cargarCategoriasProductos()
    cargarMarcasProductos()
    cargarTallas()
    cargarTiendas()
  }, [])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result)
        setProducto((prev) => ({ ...prev, imagen: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }


  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMensajeExito('')

    try {
      const body = {
        sku: producto.sku || null,
        tienda_id: Number(producto.tiendaId),
        marca_id: producto.marcaId ? Number(producto.marcaId) : null,
        categoria_id: producto.categoriaId ? Number(producto.categoriaId) : null,
        talla_id: producto.tallaId ? Number(producto.tallaId) : null,
        descripcion: producto.descripcion,
        costo: Number(producto.costo),
        precio: Number(producto.precio),
        cantidad: Number(producto.cantidad),
        imagen: producto.imagen || null,
      }


      const res = await fetch(`${API_BASE_URL}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('Error backend:', errText)
        throw new Error('Error al crear producto')
      }

      const data = await res.json()
      console.log('Producto creado:', data)

      // 🔹 limpiar formulario
      const initialProducto = {
        sku: '',
        tiendaId: '',
        marcaId: '',
        categoriaId: '',
        tallaId: '',
        descripcion: '',
        costo: 0,
        precio: 0,
        cantidad: 0,
        imagen: '',
      }
      setProducto(initialProducto)

      setPreview('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // 🔹 cerrar dialog
      // 🔹 mostrar mensaje de éxito (puede ser snackbar o algo simple)
      setMensajeExito('Producto creado exitosamente')
      setOpenSnackbarExito(true)

    } catch (err) {
      console.error(err)
      alert('Ocurrió un error al guardar. Revisa consola.') // o snackbar de error
    } finally {
      setLoading(false)
    }
  }


  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 3 }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Agregar nuevo producto
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {/* Imagen */}
            <Box sx={{ textAlign: 'center' }}>
              {preview ? (
                <Box
                  component="img"
                  src={preview}
                  alt="Vista previa"
                  sx={{
                    width: 200,
                    height: 200,
                    objectFit: 'cover',
                    borderRadius: 2,
                    mb: 1,
                    border: '2px solid #444',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 200,
                    height: 200,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    mx: 'auto',
                    mb: 1,
                  }}
                >
                  <AddPhotoAlternateIcon fontSize="large" color="action" />
                </Box>
              )}
              <Button variant="outlined" component="label">
                Subir imagen
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />
              </Button>
            </Box>

            {/* SKU / Código de barras */}
            <TextField
              label="SKU / Código de barras"
              fullWidth
              value={producto.sku}
              onChange={(e) =>
                setProducto((p) => ({ ...p, sku: e.target.value }))
              }
            />

            {/* Tienda + botón agregar */}
            <Box display="flex" gap={1} mt={2}>
              <TextField
                select
                label="Tienda"
                fullWidth
                required
                value={producto.tiendaId}
                onChange={(e) =>
                  setProducto((p) => ({ ...p, tiendaId: e.target.value }))
                }
              >
                {tiendas.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.nombre}
                  </MenuItem>
                ))}
              </TextField>

              <IconButton
                color="primary"
                aria-label="Agregar tienda"
                onClick={() => {
                  setNuevaTiendaNombre('')
                  setOpenNuevaTienda(true)
                }}
                sx={{ flexShrink: 0, alignSelf: 'center' }}
              >
                <AddIcon />
              </IconButton>
            </Box>

            {/* Marca + botón agregar */}
            <Box display="flex" gap={1} mt={2}>
              <TextField
                select
                label="Marca"
                fullWidth
                value={producto.marcaId}
                onChange={(e) =>
                  setProducto((p) => ({ ...p, marcaId: e.target.value }))
                }
              >
                {marcasProductos.map((marca) => (
                  <MenuItem key={marca.id} value={marca.id}>
                    {marca.nombre}
                  </MenuItem>
                ))}
              </TextField>

              <IconButton
                color="primary"
                aria-label="Agregar marca"
                onClick={() => {
                  setNuevaMarcaNombre('')
                  setNuevaMarcaDescripcion('')
                  setOpenNuevaMarca(true)
                }}
                sx={{ flexShrink: 0, alignSelf: 'center' }}
              >
                <AddIcon />
              </IconButton>
            </Box>

            {/* Descripción */}
            <TextField
              label="Descripción"
              multiline
              minRows={3}
              fullWidth
              value={producto.descripcion}
              onChange={(e) =>
                setProducto((p) => ({ ...p, descripcion: e.target.value }))
              }
            />

            {/* Categoría + botón agregar */}
            <Box display="flex" gap={1}>
              <TextField
                select
                label="Categoría"
                fullWidth
                value={producto.categoriaId}
                onChange={(e) =>
                  setProducto((p) => ({ ...p, categoriaId: e.target.value }))
                }
              >
                {categoriasProductos.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </MenuItem>
                ))}
              </TextField>

              <IconButton
                color="primary"
                aria-label="Agregar categoría"
                onClick={handleOpenNuevaCat}
                sx={{ flexShrink: 0, alignSelf: 'center' }}
              >
                <AddIcon />
              </IconButton>
            </Box>

            {/* Talla + botón agregar */}
            <Box display="flex" gap={1}>
              <TextField
                select
                label="Talla"
                fullWidth
                value={producto.tallaId}
                onChange={(e) =>
                  setProducto((p) => ({ ...p, tallaId: e.target.value }))
                }
              >
                {tallas.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.nombre}
                  </MenuItem>
                ))}
              </TextField>

              <IconButton
                color="primary"
                aria-label="Agregar talla"
                onClick={() => {
                  setNuevaTallaNombre('')
                  setOpenNuevaTalla(true)
                }}
                sx={{ flexShrink: 0, alignSelf: 'center' }}
              >
                <AddIcon />
              </IconButton>
            </Box>

            {/* Costo */}
            <TextField
              label="Costo (Q)"
              type="number"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">Q</InputAdornment>
                ),
              }}
              value={producto.costo}
              onChange={(e) =>
                setProducto((p) => ({ ...p, costo: e.target.value }))
              }
            />

            {/* Precio */}
            <TextField
              label="Precio (Q)"
              type="number"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">Q</InputAdornment>
                ),
              }}
              value={producto.precio}
              onChange={(e) =>
                setProducto((p) => ({ ...p, precio: e.target.value }))
              }
            />

            {/* Cantidad */}
            <TextField
              label="Cantidad"
              type="number"
              fullWidth
              value={producto.cantidad}
              onChange={(e) =>
                setProducto((p) => ({ ...p, cantidad: e.target.value }))
              }
            />

            <Button variant="contained" color="primary" type="submit">
              Guardar
            </Button>
          </Stack>
        </form>

        {/* Dialog nueva categoría */}
        <Dialog open={openNuevaCat} onClose={handleCloseNuevaCat} fullWidth maxWidth="sm">
          <DialogTitle>Nueva categoría de producto</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre de la categoría"
              value={nuevaCatNombre}
              onChange={(e) => setNuevaCatNombre(e.target.value)}
              autoFocus
              required
            />
            <TextField
              label="Descripción (opcional)"
              value={nuevaCatDescripcion}
              onChange={(e) => setNuevaCatDescripcion(e.target.value)}
              multiline
              minRows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseNuevaCat}>Cancelar</Button>
            <Button variant="contained" onClick={handleGuardarNuevaCat}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog nueva marca */}
        <Dialog
          open={openNuevaMarca}
          onClose={() => setOpenNuevaMarca(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Nueva marca de producto</DialogTitle>
          <DialogContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
          >
            <TextField
              label="Nombre de la marca"
              value={nuevaMarcaNombre}
              onChange={(e) => setNuevaMarcaNombre(e.target.value)}
              autoFocus
              required
            />
            <TextField
              label="Descripción (opcional)"
              value={nuevaMarcaDescripcion}
              onChange={(e) => setNuevaMarcaDescripcion(e.target.value)}
              multiline
              minRows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenNuevaMarca(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleGuardarNuevaMarca}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog nueva tienda */}
        <Dialog
          open={openNuevaTienda}
          onClose={() => setOpenNuevaTienda(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Nueva tienda</DialogTitle>
          <DialogContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
          >
            <TextField
              label="Nombre de la tienda"
              value={nuevaTiendaNombre}
              onChange={(e) => setNuevaTiendaNombre(e.target.value)}
              autoFocus
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenNuevaTienda(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleGuardarNuevaTienda}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog nueva talla */}
        <Dialog
          open={openNuevaTalla}
          onClose={() => setOpenNuevaTalla(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Nueva talla</DialogTitle>
          <DialogContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
          >
            <TextField
              label="Nombre de la talla"
              value={nuevaTallaNombre}
              onChange={(e) => setNuevaTallaNombre(e.target.value)}
              autoFocus
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenNuevaTalla(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleGuardarNuevaTalla}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity}>{snack.msg}</Alert>
      </Snackbar>

      <Snackbar
        open={openSnackbarExito}
        autoHideDuration={3000}
        onClose={handleCloseSnackbarExito}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbarExito}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {mensajeExito}
        </Alert>
      </Snackbar>
    </Box>
  )

}
