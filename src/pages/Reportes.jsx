import * as React from 'react'
import {
  Box, Paper, Typography, Stack, Divider, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, MenuItem, InputAdornment, IconButton
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { API_BASE_URL } from '../config/api'
dayjs.extend(isBetween)

// --- Datos de ejemplo (luego los reemplazas por tu API/DB) ---

// Utilidades de totales
const getItemPrice = (item) => {
  const raw = item?.price ?? item?.precio_unitario ?? item?.producto?.precio ?? 0
  const num = Number(raw)
  return Number.isFinite(num) ? num : 0
}

const getItemCost = (item) => {
  const raw = item?.costo_unitario ?? item?.costo ?? item?.producto?.costo ?? 0
  const num = Number(raw)
  return Number.isFinite(num) ? num : 0
}

const getItemQty = (item) => {
  const raw = item?.qty ?? item?.cantidad ?? 1
  const num = Number(raw)
  return Number.isFinite(num) ? num : 0
}

const normalizeNumber = (value) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const getOrdenDescuento = (orden) => normalizeNumber(orden?.descuento ?? orden?.discount ?? 0)
const calcSubtotal = (items = []) =>
  items.reduce((s, it) => s + getItemPrice(it) * getItemQty(it), 0)
const calcCostoTotal = (items = []) =>
  items.reduce((s, it) => s + getItemCost(it) * getItemQty(it), 0)

// Util: calcular total (restando el descuento de la orden si existe)
function calcTotal(items = [], descuento = 0) {
  const subtotal = calcSubtotal(items)
  const desc = Math.max(normalizeNumber(descuento), 0)
  const neto = subtotal - desc
  return neto < 0 ? 0 : neto
}

// Util: calcular ganancia de una lista de items
function calcGanancia(items = [], descuento = 0) {
  const subtotal = calcSubtotal(items)
  const costoTotal = calcCostoTotal(items)
  const desc = Math.max(normalizeNumber(descuento), 0)
  return subtotal - costoTotal - desc
}

function calcGananciaSinDescuento(items = []) {
  const subtotal = calcSubtotal(items)
  const costoTotal = calcCostoTotal(items)
  return subtotal - costoTotal
}

export default function Reportes() {
  const [ordenSel, setOrdenSel] = React.useState(null)
  const [ordenes, setOrdenes] = React.useState([])
  const [range, setRange] = React.useState([
    dayjs().startOf('month'),
    dayjs().endOf('day'),
  ])
  const [deletingId, setDeletingId] = React.useState(null)
  const [tiendaFiltro, setTiendaFiltro] = React.useState('')
  const [tiendas, setTiendas] = React.useState([])

  const filtered = React.useMemo(() => {
  // usa SOLO backend
    const source = ordenes
  
    // si no hay empleada seleccionada, devuelve todas  
    if (!tiendaFiltro) return source

    const matchesTienda = (item) => {
      const tiendaId = item?.producto?.tienda_id ?? item?.tienda_id
      return tiendaId != null && String(tiendaId) === String(tiendaFiltro)
    }

    // Devuelve las órdenes con solo los items de la tienda seleccionada.
    // Si una orden no tiene items de esa tienda, se excluye.
    return source
      .map((orden) => {
        const itemsFiltrados = (orden?.items || []).filter(matchesTienda)
        if (!itemsFiltrados.length) return null
        return { ...orden, items: itemsFiltrados }
      })
      .filter(Boolean)
  }, [ordenes, tiendaFiltro])


  // 🔹 GET /ordenes?inicio=...&fin=...
  const cargarOrdenes = async (inicioIso, finIso) => {
    try {
      const params = new URLSearchParams()
      if (inicioIso) params.append('inicio', inicioIso)
      if (finIso)    params.append('fin',    finIso)

      const res = await fetch(`${API_BASE_URL}/ordenes?${params.toString()}`)
      if (!res.ok) throw new Error('Error al obtener órdenes')

      const data = await res.json()
      setOrdenes(data)   // array de ordenes desde el back
    } catch (err) {
      console.error(err)
    }
  }

  // 🔹 GET /tiendas
  React.useEffect(() => {
    const cargarTiendas = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/tiendas`)
        if (!res.ok) throw new Error('Error al obtener tiendas')

        const data = await res.json()
        setTiendas(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
      }
    }

    cargarTiendas()
  }, [])

  const restockOrden = async (orden) => {
    if (!orden?.items?.length) return

    // Para cada item, sumamos la cantidad vendida de vuelta al stock del producto
    for (const it of orden.items) {
      const productoId = it.producto_id ?? it.producto?.id
      if (!productoId) continue

      const qty = getItemQty(it)
      // Obtener stock actual desde backend para evitar usar valores viejos del item
      const getRes = await fetch(`${API_BASE_URL}/productos/${productoId}`)
      if (!getRes.ok) {
        const msg = await getRes.text()
        throw new Error(msg || `No se pudo leer stock del producto ${productoId}`)
      }
      const productoActual = await getRes.json()
      const cantidadActual = Number(productoActual?.cantidad ?? 0)
      const stockActual = Number.isFinite(cantidadActual) ? cantidadActual : 0
      const nuevaCantidad = stockActual + qty

      const putRes = await fetch(`${API_BASE_URL}/productos/${productoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad: nuevaCantidad }),
      })

      if (!putRes.ok) {
        const msg = await putRes.text()
        throw new Error(msg || `Error al devolver inventario del producto ${productoId}`)
      }
    }
  }

  const handleDeleteOrden = async (orden) => {
    const id = orden?.id
    if (!id) return
    const confirmed = window.confirm('¿Eliminar esta orden?')
    if (!confirmed) return

    try {
      setDeletingId(id)
      await restockOrden(orden)

      const res = await fetch(`${API_BASE_URL}/ordenes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar orden')
      setOrdenes((prev) => prev.filter((o) => o.id !== id))
      if (ordenSel?.id === id) setOrdenSel(null)
    } catch (err) {
      alert('No se pudo eliminar la orden o devolver inventario. Revisa la consola.')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }


  const totalPeriodo = filtered.reduce(
    (acc, o) => acc + calcTotal(o.items || [], getOrdenDescuento(o)),
    0
  )

  const gananciaPeriodo = React.useMemo(() => {
    if (!tiendaFiltro) {
      return filtered.reduce(
        (acc, o) => acc + calcGanancia(o.items || [], getOrdenDescuento(o)),
        0
      )
    }
    return filtered.reduce(
      (acc, o) => acc + calcGananciaSinDescuento(o.items || []),
      0
    )
  }, [filtered, tiendaFiltro])

  const [porcentajeComision, setPorcentajeComision] = React.useState(0);

  const totalComision = React.useMemo(
    () => (porcentajeComision ? (totalPeriodo * porcentajeComision) / 100 : 0),
    [totalPeriodo, porcentajeComision]
  )

  const descuentoOrdenSel = getOrdenDescuento(ordenSel)
  const subtotalOrdenSel = calcSubtotal(ordenSel?.items || [])
  const totalOrdenSel = calcTotal(ordenSel?.items || [], descuentoOrdenSel)

  // 🔹 Cada vez que cambia el rango, pedir órdenes al backend
  React.useEffect(() => {
    const [from, to] = range
    if (!from || !to) return

    const inicioIso = from.startOf('day').toDate().toISOString()
    const finIso    = to.endOf('day').toDate().toISOString()

    cargarOrdenes(inicioIso, finIso)
  }, [range])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Reportes de ventas
        </Typography>

        
        <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
          {/* Fila original: rango de fechas + total período */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
          >
            <DateRangePicker
              calendars={2}
              value={range}
              onChange={(newVal) => setRange(newVal)}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
              localeText={{ start: 'Desde', end: 'Hasta' }}
            />

            <TextField
              select
              size="small"
              label="Tienda"
              value={tiendaFiltro}
              onChange={(e) => setTiendaFiltro(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Todas las tiendas</MenuItem>
              {tiendas.map((tienda) => (
                <MenuItem key={tienda.id} value={tienda.id}>
                  {tienda.nombre}
                </MenuItem>
              ))}
            </TextField>

            <Chip
              label={`Total en el período: Q ${totalPeriodo.toFixed(2)}`}
              color="primary"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label={`Ganancia en el periodo: Q ${gananciaPeriodo.toFixed(2)}`}
              color="success"
              sx={{ fontWeight: 600 }}
            />
            {tiendaFiltro && (
              <Typography variant="caption" color="text.secondary">
                Descuentos no tomados en cuenta
              </Typography>
            )}
          </Stack>


        </Paper>

        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>No. Orden</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((o) => (
                <TableRow
                  key={o.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setOrdenSel(o)}
                >
                  <TableCell>{dayjs(o.fecha).format('YYYY-MM-DD HH:mm')}</TableCell>
                  <TableCell>{o.codigo ?? o.id}</TableCell>
                  <TableCell>{o.cliente?.nombre}</TableCell>
                  <TableCell align="right">
                    Q {calcTotal(o.items || [], getOrdenDescuento(o)).toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteOrden(o)
                      }}
                      disabled={deletingId === o.id}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary" align="center">
                      No hay ventas en el rango seleccionado
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

          </Table>
        </TableContainer>

        {/* -------- Dialog Detalle de Orden -------- */}
        <Dialog open={!!ordenSel} onClose={() => setOrdenSel(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Orden {ordenSel?.id}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={1} sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Fecha: {ordenSel ? dayjs(ordenSel.fecha).format('YYYY-MM-DD HH:mm') : '--'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cliente: {ordenSel?.cliente?.nombre} — {ordenSel?.cliente?.telefono}
              </Typography>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell align="right">Precio</TableCell>
                  <TableCell align="right">Cant.</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordenSel?.items?.map((it) => {
                  let nombre = ''
                  if (it.tipo === 'servicio') {
                    nombre =
                      it.servicio?.descripcion ||
                      it.nombre ||
                      `Servicio #${it.servicio_id ?? it.id}`
                  } else { // asumimos 'producto'
                    nombre =
                      it.producto?.descripcion ||
                      it.nombre ||
                      `Producto #${it.producto_id ?? it.id}`
                  }

                  // 🔹 SKU según tipo
                  let sku = it.producto?.sku || ''

                  const price =
                    it.price ??                        // mock
                    it.precio_unitario ??              // backend snapshot
                    it.producto?.precio ??             // por si usas precio del producto
                    it.servicio?.precio ?? 0

                  const qty = it.qty ?? it.cantidad ?? 1

                  return (
                    <TableRow key={it.id}>
                      <TableCell>{nombre}</TableCell>
                      <TableCell>{sku}</TableCell>
                      <TableCell align="right">Q {price.toFixed(2)}</TableCell>
                      <TableCell align="right">{qty}</TableCell>
                      <TableCell align="right">Q {(price * qty).toFixed(2)}</TableCell>
                    </TableRow>
                  )
                })}


                <TableRow>
                  <TableCell colSpan={4} align="right" sx={{ fontWeight: 600 }}>
                    Subtotal
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Q {subtotalOrdenSel.toFixed(2)}
                  </TableCell>
                </TableRow>
                {descuentoOrdenSel > 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 600 }}>
                      Descuento
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      -Q {descuentoOrdenSel.toFixed(2)}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell colSpan={4} align="right" sx={{ fontWeight: 700 }}>
                    Total
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Q {totalOrdenSel.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions>
            {ordenSel && (
              <Button
                color="error"
                onClick={() => handleDeleteOrden(ordenSel)}
                disabled={deletingId === ordenSel.id}
              >
                Eliminar
              </Button>
            )}
            <Button onClick={() => setOrdenSel(null)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}
