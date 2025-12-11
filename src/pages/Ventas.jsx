// src/pages/Inventory.jsx
import * as React from 'react'
import {
  Box, Grid, Typography, Divider, List, ListItem, ListItemText,
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Snackbar, Alert, MenuItem, Autocomplete
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import CategoryBar from '../components/CategoryBar'
import ProductCard from '../components/ProductCard'
import { API_BASE_URL } from '../config/api'


const CATEGORIES = [
  { id: 'all', label: 'Todo' },
  { id: 'autos', label: 'Cabello' },
  { id: 'motos', label: 'Uñas' },
  { id: 'quimicos', label: 'Pedicure' },
  { id: 'accesorios', label: 'Manicure' },
]

const PRODUCTS = [
  { id: 1, name: 'Shampoo pH Neutro 1L', sku: 'SH-001', price: 89.90, stock: 12, cat: 'quimicos', image: '' },
  { id: 2, name: 'Guante Microfibra Premium', sku: 'GM-010', price: 59.50, stock: 3,  cat: 'accesorios', image: '' },
  { id: 3, name: 'Cera Sintética 500ml', sku: 'CE-500', price: 129.00, stock: 7, cat: 'quimicos', image: '' },
  { id: 4, name: 'Toalla Secado 1200gsm', sku: 'TS-1200', price: 99.00, stock: 20, cat: 'accesorios', image: '' },
  { id: 5, name: 'Cepillo Llantas', sku: 'CL-020', price: 45.00, stock: 2, cat: 'accesorios', image: '' },
  { id: 6, name: 'Ambientador New Car', sku: 'AN-001', price: 25.00, stock: 14, cat: 'accesorios', image: '' },
]

const empleadas = [
  { id: 1, nombre: 'Ana' },
  { id: 2, nombre: 'María' },
  { id: 3, nombre: 'Lucía' },
]

const tipoPago = [
  { id: 1, nombre: 'Efectivo' },
  { id: 2, nombre: 'Tarjeta' },
  { id: 3, nombre: 'Transferencia' },
]

const tipoPOS = [
  { id: 'all', label: 'Todo' },
  { id: 'serv', label: 'Servicios' },
  { id: 'prod', label: 'Productos' },
]

const parseTicketDate = (...dates) => {
  const normalize = (value) => {
    if (!value) return null
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

    // Numbers: allow seconds (10 digits) or ms (13 digits)
    if (typeof value === 'number') {
      const ms = value < 1e11 ? value * 1000 : value
      const d = new Date(ms)
      return Number.isNaN(d.getTime()) ? null : d
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return null
      const num = Number(trimmed)
      if (!Number.isNaN(num)) {
        const ms = num < 1e11 ? num * 1000 : num
        const d = new Date(ms)
        if (!Number.isNaN(d.getTime())) return d
      }

      // Try ISO-ish strings; add "T" and optional "Z" if missing
      const candidates = [
        trimmed,
        trimmed.replace(' ', 'T'),
        `${trimmed.replace(' ', 'T')}Z`,
      ]
      for (const candidate of candidates) {
        const d = new Date(candidate)
        if (!Number.isNaN(d.getTime())) return d
      }
    }

    return null
  }

  for (const d of dates) {
    const parsed = normalize(d)
    if (parsed) return parsed
  }
  return null
}

const formatTicketDate = (date) => {
  if (!date) return ''
  // Ajuste manual de -5 horas por desfase reportado en impresión
  const adjusted = new Date(date.getTime() - 6 * 60 * 60 * 1000)
  try {
    return new Intl.DateTimeFormat('es-GT', {
      timeZone: 'America/Guatemala',
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(adjusted)
  } catch {
    return adjusted.toLocaleString()
  }
}


export default function Inventory() {
  const [tipoPOSset, setTipoPOS] = React.useState('all')
  const [category, setCategory] = React.useState('all')
  const [cart, setCart] = React.useState([])
  const [discount, setDiscount] = React.useState('')

  // Dialog de datos del cliente
  const [openDialog, setOpenDialog] = React.useState(false)
  const [venta, setVenta] = React.useState({ empleada: '', pago: '' , referencia: ''})
  const [errors, setErrors] = React.useState({ nombre: '', telefono: '' })

  const [categoriasProductos, setCategoriasProductos] = React.useState([])
  const [marcasProductos, setMarcasProductos] = React.useState([])
  const [tallasProductos, setTallasProductos] = React.useState([])
  const [categoriasServicios, setCategoriasServicios] = React.useState([])
  const [productos, setProductos] = React.useState([])
  const [empleadas, setEmpleadas] = React.useState([])

  const [clientes, setClientes] = React.useState([])          // lista desde el backend
  const [cliente, setCliente] = React.useState({ nombre: '', telefono: '', email: '', nit: '' })
  const [esClienteExistente, setEsClienteExistente] = React.useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = React.useState(null)

  const [categoria, setCategoria] = React.useState('')
  const [marca, setMarca] = React.useState('')
  const [talla, setTalla] = React.useState('')
  const [skuQuery, setSkuQuery] = React.useState('')
  


  const requiereReferencia =
    venta.pago === 'Tarjeta' || venta.pago === 'Transferencia'
    
  // Snackbar de confirmación
  const [snack, setSnack] = React.useState({ open: false, msg: '', severity: 'success' })

  // const filtered = React.useMemo(() => {
  //   if (categoriasProductos.id === 'all') return productos
  //   return productos.filter(p => p.categoria_id === categoriasProductos.id)
  // }, [categoriasProductos.id])
  const filtered = React.useMemo(() => {
    const skuQ = skuQuery.trim().toLowerCase()

    return productos.filter((p) => {
      // Marca
      if (marca && String(p.marca_id) !== String(marca.id)) {
        return false
      }

      // Categoría
      if (categoria && String(p.categoria_id) !== String(categoria.id)) {
        return false
      }

      // Talla
      if (talla && String(p.talla_id) !== String(talla.id)) {
        return false
      }

      // SKU (buscar por texto parcial)
      if (skuQ) {
        const sku = (p.sku || '').toLowerCase()
        if (!sku.includes(skuQ)) {
          return false
        }
      }

      return true
    })
  }, [productos, marca, categoria, talla, skuQuery])





  // const cargarCategoriasProductos = async () => {
  //   try {
  //     const res = await fetch(`${API_BASE_URL}/categorias-productos`)
  //     if (!res.ok) throw new Error('Error al obtener categorías de productos')
  //     const data = await res.json()
  //     // data = [{ id, nombre, descripcion, activo }, ...]

  //     const mapped = [
  //       { id: 'all', label: 'Todas' },
  //       ...data.map(cat => ({
  //         id: String(cat.id),        // lo pasamos a string por si acaso
  //         label: cat.nombre,
  //       })),
  //     ]

  //     setCategoriasProductos(mapped)
  //   } catch (err) {
  //     console.error(err)
  //   }
  // }

  const cargarCategoriasProductos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categorias-productos`)
      if (!res.ok) throw new Error('Error al obtener clientes')
      const data = await res.json()
      setCategoriasProductos(data) // array de { id, nombre, descripcion, activo }
    } catch (err) {
      console.error(err)
    }
  }


  const cargarProductos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/productos`)
      if (!res.ok) throw new Error('Error al obtener productos')
      const data = await res.json()
      setProductos(data) // array de { id, nombre, descripcion, activo }
      console.log('Producto creado:', data)
    } catch (err) {
      console.error(err)
    }
  }
  const cargarClientes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clientes`)
      if (!res.ok) throw new Error('Error al obtener clientes')
      const data = await res.json()
      setClientes(data) // array de { id, nombre, descripcion, activo }
    } catch (err) {
      console.error(err)
    }
  }

  const cargarMarcas = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/marcas-productos`)
      if (!res.ok) throw new Error('Error al obtener clientes')
      const data = await res.json()
      setMarcasProductos(data) // array de { id, nombre, descripcion, activo }
    } catch (err) {
      console.error(err)
    }
  }

  const cargarTallas = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tallas`)
      if (!res.ok) throw new Error('Error al obtener clientes')
      const data = await res.json()
      setTallasProductos(data) // array de { id, nombre, descripcion, activo }
    } catch (err) {
      console.error(err)
    }
  }

  const handlePrintTicket = (ticket) => {
    // Construimos el HTML de los items
    const itemsHtml = ticket.items.map((it) => `
      <div style="margin-bottom:3px;">
        <div>${it.qty} x ${it.descripcion}</div>
        <div style="display:flex;justify-content:space-between;">
          <span>Q ${it.precio.toFixed(2)}</span>
          <span>Q ${(it.precio * it.qty).toFixed(2)}</span>
        </div>
      </div>
    `).join('')

    const printWindow = window.open('', '', 'width=400,height=600')
    if (!printWindow) return // popup bloqueado

    const ticketDate = parseTicketDate(
      ticket.fecha,
      ticket.fecha_creacion,
      ticket.created_at,
      ticket.createdAt,
      ticket.created
    )
    const ticketDateText = formatTicketDate(ticketDate)

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 2mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              font-family: monospace;
              font-size: 11px;
            }
            .ticket {
              width: 80mm;
            }
            hr {
              border: 0;
              border-top: 1px dashed #000;
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
            <div class="ticket" style="padding:4px;">
              <div style="text-align:center;margin-bottom:4px;">
                <div style="font-weight:bold;">AM BOUTIQUE</div>
                <div>Ticket: ${ticket.codigo}</div>
                <div>${ticketDateText}</div>
              </div>
              <hr />
              <div style="margin-bottom:4px;">
                <div>Cliente: ${ticket.cliente?.nombre || ''}</div>
                <div>Tel: ${ticket.cliente?.telefono || ''}</div>
            </div>
            <hr />
            ${itemsHtml}
            <hr />
            <div style="display:flex;justify-content:space-between;font-weight:bold;">
              <span>Total</span>
              <span>Q ${ticket.total.toFixed(2)}</span>
            </div>
            <div style="text-align:center;margin-top:6px;">
              ¡Gracias por su compra!
            </div>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }


  const addToCart = (prod) => {
    const rawStock = prod.cantidad ?? prod.stock
    const stock = typeof rawStock === 'number' ? rawStock : Number(rawStock) || 0
    const unlimited = stock >= 9999

    setCart(prev => {
      const existing = prev.find(p => p.id === prod.id)

      const currentQty = existing ? existing.qty : 0
      const nextQty = currentQty + 1

      if (!unlimited) {
        if (stock <= 0) {
          setSnack({ open: true, msg: 'No hay stock disponible para este producto', severity: 'warning' })
          return prev
        }
        if (nextQty > stock) {
          setSnack({
            open: true,
            msg: `Solo hay ${stock} en stock`,
            severity: 'warning',
          })
          return prev
        }
      }

      if (existing) {
        return prev.map(p => p.id === prod.id ? { ...p, qty: nextQty } : p)
      }
      return [...prev, { ...prod, qty: 1 }]
    })
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(p => p.id !== id))

  const subtotal = cart.reduce((sum, p) => sum + p.precio * p.qty, 0)
  const discountValue = React.useMemo(() => {
    const parsed = parseFloat(discount)
    if (Number.isNaN(parsed) || parsed < 0) return 0
    return Math.min(parsed, subtotal)
  }, [discount, subtotal])
  const totalWithDiscount = subtotal - discountValue

  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      setSnack({ open: true, msg: 'Tu carrito está vacío', severity: 'warning' })
      return
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const validate = () => {
    let ok = true
    const e = { nombre: '', telefono: '' }

    if (!cliente.nombre.trim()) {
      e.nombre = 'Ingresa el nombre'
      ok = false
    }
    const tel = cliente.telefono.trim()
    // Validación simple: 8–15 dígitos (permite + y espacios)
    const telOk = /^(\+?\d[\d\s-]{7,14})$/.test(tel)
    if (!telOk) {
      e.telefono = 'Ingresa un número válido (8–15 dígitos)'
      ok = false
    }
    setErrors(e)
    return ok
  }

  const handleConfirmCheckout = async () => {
    if (!validate()) return
    if (cart.length === 0) {
      setSnack({ open: true, msg: 'Tu carrito está vacío', severity: 'warning' })
      return
    }

    // 0) Abrimos la ventana de impresión AQUÍ (gesto de usuario)
    const printWindow = window.open('', '', 'width=400,height=600')
    // Si el navegador bloquea el popup, printWindow será null
    // Igual seguimos con la creación de la orden; sólo que no imprimirá.

    // 1) Cliente: existente o nuevo
    let clientePayload
    const nombreTrim = (cliente.nombre || '').trim()
    const telTrim = (cliente.telefono || '').trim()
    const emailTrim = (cliente.email || '').trim()
    const nitTrim = (cliente.nit || '').trim()

    if (esClienteExistente && clienteSeleccionado?.id) {
      clientePayload = {
        id: clienteSeleccionado.id,
        email: emailTrim || clienteSeleccionado.email || null,
        nit: nitTrim || clienteSeleccionado.nit || null,
      }
    } else {
      clientePayload = {
        nombre: nombreTrim,
        telefono: telTrim,
        email: emailTrim || null,
        nit: nitTrim || null,
      }
    }

    // 2) Items (solo productos)
    const itemsPayload = cart.map((item) => ({
      producto_id: item.id,
      cantidad: item.qty,
      precio_unitario: Number(item.precio),
    }))

    // 3) Body para /ordenes
    const body = {
      codigo: `ORD-${Date.now()}`,
      cliente: clientePayload,
      items: itemsPayload,
      descuento: discountValue,
      total: totalWithDiscount,
    }

    console.log('Payload para /ordenes:', body)

    try {
      const res = await fetch(`${API_BASE_URL}/ordenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('Error al crear orden:', errorText)
        setSnack({
          open: true,
          msg: 'Error al crear la orden ❌',
          severity: 'error',
        })

        // Si abrimos una ventana de impresión antes, la cerramos
        if (printWindow && !printWindow.closed) {
          printWindow.close()
        }
        return
      }

      const data = await res.json()
      console.log('Orden creada en backend:', data)

      // ==== Construimos el HTML del ticket ====
      const ticketCodigo = data.codigo || body.codigo
      const ticketFecha = parseTicketDate(
        data.fecha,
        data.fecha_creacion,
        data.created_at,
        data.createdAt,
        data.created,
        Date.now()
      )
      const ticketFechaTexto = formatTicketDate(ticketFecha)

      const ticketClienteNombre   = clientePayload.nombre ?? clienteSeleccionado?.nombre ?? ''
      const ticketClienteTelefono = clientePayload.telefono ?? clienteSeleccionado?.telefono ?? ''

      const subtotalTicket = cart.reduce((sum, it) => sum + it.precio * it.qty, 0)
      const discountApplied = Math.min(
        Math.max(parseFloat(discount) || 0, 0),
        subtotalTicket
      )
      const totalConDescuento = subtotalTicket - discountApplied
      const discountFromBackend = typeof data.descuento === 'number' ? data.descuento : discountApplied
      const totalFromBackend = typeof data.total === 'number' ? data.total : totalConDescuento

      const itemsHtml = cart.map(it => `
        <div style="margin-bottom:3px">
          <div>${it.qty} x ${it.descripcion}</div>
          <div style="display:flex;justify-content:space-between">
            <span>Q ${it.precio.toFixed(2)}</span>
            <span>Q ${(it.precio * it.qty).toFixed(2)}</span>
          </div>
        </div>
      `).join('')

      const ticketHtml = `
        <html>
          <head>
            <title>Ticket ${ticketCodigo}</title>
            <style>
              @page {
                size: 80mm auto;
                margin: 2mm;
              }
              * {
                box-sizing: border-box;
              }
              body {
                margin: 0;
                font-family: monospace;
                font-size: 11px;
              }
              .ticket {
                width: 80mm;
                padding: 4px;
              }
              hr {
                border: 0;
                border-top: 1px dashed #000;
                margin: 4px 0;
              }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div style="text-align:center;margin-bottom:4px">
                <div style="font-weight:bold">AM Boutique</div>
                <div>Ticket: ${ticketCodigo}</div>
                <div>${ticketFechaTexto}</div>
              </div>
              <hr/>
              <div style="margin-bottom:4px">
                <div>Cliente: ${ticketClienteNombre}</div>
                <div>Tel: ${ticketClienteTelefono || ''}</div>
              </div>
              <hr/>
              ${itemsHtml}
              <hr/>
              <div style="display:flex;justify-content:space-between;font-weight:bold">
                <span>Total</span>
                <span>Q ${totalFromBackend.toFixed(2)}</span>
              </div>
              ${discountFromBackend > 0
                ? `<div style="display:flex;justify-content:space-between;font-size:10px;margin-top:4px">
                    <span>Descuento</span>
                    <span>-Q ${discountFromBackend.toFixed(2)}</span>
                  </div>`
                : ''}
              <div style="text-align:center;margin-top:6px">
                ¡Gracias por su compra!
              </div>
            </div>
          </body>
        </html>
      `

      // ==== Escribimos y mandamos a imprimir ====
      if (printWindow) {
        printWindow.document.open()
        printWindow.document.write(ticketHtml)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        // Opcional: cerrar después de imprimir
        // printWindow.close()
      }

      // Feedback y limpieza
      setSnack({
        open: true,
        msg: 'Pedido creado correctamente ✅',
        severity: 'success',
      })
      setOpenDialog(false)
      setCliente({ nombre: '', telefono: '', email: '', nit: '' })
      setClienteSeleccionado(null)
      setEsClienteExistente(false)
      setCart([])
      setDiscount('')

    } catch (err) {
      console.error('Error de red al crear orden:', err)
      setSnack({
        open: true,
        msg: 'Error de conexión al crear la orden ❌',
        severity: 'error',
      })
      if (printWindow && !printWindow.closed) {
        printWindow.close()
      }
    }
  }



  React.useEffect(() => {
      cargarCategoriasProductos()
      cargarProductos()
      cargarClientes()
      cargarMarcas()
      cargarTallas()
    }, [])
  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {/* -------- IZQUIERDA: INVENTARIO -------- */}
      <Box sx={{ flex: 3 }}>
        <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600 }}>
          Inventario
        </Typography>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          {/* Marca */}
          <Autocomplete
            size="small"
            fullWidth
            options={marcasProductos}
            value={marca}
            onChange={(_, newValue) => setMarca(newValue)}
            getOptionLabel={(option) =>
              typeof option === 'string' ? option : option?.nombre || ''
            }
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField {...params} label="Filtrar por marca" placeholder="Marca" />
            )}
          />

          {/* Categoría */}
          <Autocomplete
            size="small"
            fullWidth
            options={categoriasProductos}
            value={categoria}
            onChange={(_, newValue) => setCategoria(newValue)}
            getOptionLabel={(option) =>
              typeof option === 'string' ? option : option?.nombre || ''
            }
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField {...params} label="Filtrar por categoría" placeholder="Categoría" />
            )}
          />

          {/* Talla */}
          <Autocomplete
            size="small"
            fullWidth
            options={tallasProductos}
            value={talla}
            onChange={(_, newValue) => setTalla(newValue)}
            getOptionLabel={(option) =>
              typeof option === 'string' ? option : option?.nombre || ''
            }
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField {...params} label="Filtrar por talla" placeholder="Talla" />
            )}
          />
        </Stack>

        {/* Buscador por SKU */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Buscar por SKU"
            placeholder="Escanea o escribe el código de barras"
            value={skuQuery}
            onChange={(e) => setSkuQuery(e.target.value)}
          />
        </Box>

        <Grid container spacing={2} alignItems="stretch">
          {filtered.map(prod => (
            <Grid
              key={prod.id}
              item
              xs={6}
              sm={4}
              md={3}
              sx={{ display: 'flex' }}          // 🔹 todos los items son flex
            >
              <ProductCard
                product={prod}
                onClick={() => addToCart(prod)}
              />
            </Grid>
          ))}
          {filtered.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary">No hay productos en esta categoría</Typography>
            </Grid>
          )}
        </Grid>

      </Box>

      {/* -------- DERECHA: CARRITO -------- */}
      <Box
        sx={{
          flex: 1,
          borderLeft: 1,
          borderColor: 'divider',
          p: 2,
          minWidth: 300,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          height: '80vh',
        }}
      >
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          🛒 Carrito
        </Typography>
        <Divider sx={{ mb: 1 }} />

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <List dense>
            {cart.map(item => (
              <ListItem
                key={item.id}
                secondaryAction={
                  <IconButton edge="end" onClick={() => removeFromCart(item.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={`${item.descripcion}`}
                  secondary={`Q ${item.precio.toFixed(2)} x ${item.qty}`}
                />
              </ListItem>
            ))}
          </List>

          {cart.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
              No hay productos en el carrito
            </Typography>
          )}
        </Box>

        <Divider sx={{ mt: 1, mb: 2 }} />

        <Box sx={{ textAlign: 'right' }}>
          <Stack spacing={1} alignItems="flex-end">
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Total: Q {totalWithDiscount.toFixed(2)}
              </Typography>
              <TextField
                size="small"
                label="Descuento"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                sx={{ width: 140 }}
              />
            </Stack>
            {discountValue > 0 && (
              <Typography variant="caption" color="text.secondary">
                Subtotal Q {subtotal.toFixed(2)} - Descuento Q {discountValue.toFixed(2)}
              </Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
            >
              Finalizar compra
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* -------- DIALOG: DATOS DEL CLIENTE -------- */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="xs">
        <DialogTitle>Datos del cliente</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Autocomplete
              fullWidth
              freeSolo                          // permite escribir valores no existentes
              options={clientes}                // [{ id, nombre, telefono }, ...]
              getOptionLabel={(option) =>
                typeof option === 'string' ? option : option.nombre
              }
              value={esClienteExistente ? clienteSeleccionado : null}
              inputValue={cliente.nombre}
              onInputChange={(event, newInputValue) => {
                // cuando el usuario escribe
                setCliente(prev => ({ ...prev, nombre: newInputValue }))
                setClienteSeleccionado(null)
                setEsClienteExistente(false)
                // si quieres, limpiar tel cuando cambia el nombre:
                setCliente(prev => ({ ...prev, telefono: '', email: '', nit: '' }))
              }}
              onChange={(event, newValue) => {
                // cuando selecciona algo del dropdown o “confirma” texto
                if (!newValue) {
                  // limpiaron el campo
                  setClienteSeleccionado(null)
                  setEsClienteExistente(false)
                  setCliente(prev => ({ ...prev, telefono: '', email: '', nit: '' }))
                  return
                }

                if (typeof newValue === 'string') {
                  // nombre escrito a mano, no de la lista
                  setCliente({
                    nombre: newValue,
                    telefono: '',
                    email: '',
                    nit: '',
                  })
                  setClienteSeleccionado(null)
                  setEsClienteExistente(false)
                  return
                }

                // aquí sí es un cliente de la lista
                setClienteSeleccionado(newValue)
                setCliente({
                  nombre: newValue.nombre,
                  telefono: newValue.telefono ?? '',
                  email: newValue.email ?? '',
                  nit: newValue.nit ?? '',
                })
                setEsClienteExistente(true)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  autoFocus
                  label="Nombre completo"
                  error={!!errors.nombre}
                  helperText={errors.nombre}
                />
              )}
            />

            {!esClienteExistente && (
              <TextField
                label="Número de teléfono"
                value={cliente.telefono}
                onChange={(e) =>
                  setCliente(prev => ({ ...prev, telefono: e.target.value }))
                }
                error={!!errors.telefono}
                helperText={errors.telefono}
                fullWidth
                inputMode="tel"
                placeholder="+502 5555 5555"
              />
            )}

            {!esClienteExistente && (
              <TextField
                label="Correo electrónico"
                value={cliente.email}
                onChange={(e) =>
                  setCliente(prev => ({ ...prev, email: e.target.value }))
                }
                fullWidth
                type="email"
                placeholder="cliente@correo.com"
              />
            )}

            {!esClienteExistente && (
              <TextField
                label="NIT"
                value={cliente.nit}
                onChange={(e) =>
                  setCliente(prev => ({ ...prev, nit: e.target.value }))
                }
                fullWidth
                placeholder="CF o número de NIT"
              />
            )}
            {/* <TextField
              autoFocus
              select
              label="Tipo de Pago"
              value={venta.empleada}
              onChange={(e) => setVenta(prev => ({ ...prev, pago: e.target.value }))}
              error={!!errors.pago}
              helperText={errors.pago}
              fullWidth
            >
              {tipoPago.map((pago) => (
                <MenuItem key={pago.id} value={pago.nombre}>
                  {pago.nombre}
                </MenuItem>
              ))}
            </TextField> */}
            <TextField
              autoFocus
              select
              label="Tipo de Pago"
              value={venta.pago}  // 👈 en vez de venta.empleada
              onChange={(e) =>
                setVenta(prev => ({ ...prev, pago: e.target.value }))
              }
              error={!!errors.pago}
              helperText={errors.pago}
              fullWidth
            >
              {tipoPago.map((pago) => (
                <MenuItem key={pago.id} value={pago.nombre}>
                  {pago.nombre}
                </MenuItem>
              ))}
            </TextField>

            {requiereReferencia && (
              <TextField
                label="Referencia"
                value={venta.referencia}
                onChange={(e) =>
                  setVenta(prev => ({ ...prev, referencia: e.target.value }))
                }
                error={!!errors.referencia}
                helperText={errors.referencia}
                fullWidth
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirmCheckout}>
            Confirmar pedido
          </Button>
        </DialogActions>
      </Dialog>

      {/* -------- SNACKBAR -------- */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>

    </Box>
  )
}
