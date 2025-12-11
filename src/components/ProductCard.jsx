// src/components/ProductCard.jsx
import * as React from 'react'
import {
  Card,
  CardActionArea,
  Box,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { API_BASE_URL } from '../config/api'

export default function ProductCard({ product, onClick, onDeleted, onUpdated }) {
  const { id, descripcion, precio, cantidad, imagen } = product
  const low = cantidad <= 5
  const esServicio = cantidad === 9999
  const [editOpen, setEditOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [form, setForm] = React.useState({
    sku: product.sku || '',
    descripcion: product.descripcion || '',
    precio: product.precio || 0,
    costo: product.costo || 0,
    cantidad: product.cantidad || 0,
  })

  React.useEffect(() => {
    setForm({
      sku: product.sku || '',
      descripcion: product.descripcion || '',
      precio: product.precio || 0,
      costo: product.costo || 0,
      cantidad: product.cantidad || 0,
    })
  }, [product])

  const wrapDescription = (text, maxCharsPerLine, maxLines) => {
    if (!text) return ''

    const words = text.split(' ')
    const lines = []
    let current = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const tentative = (current + ' ' + word).trim()

      if (tentative.length > maxCharsPerLine) {
        // cerramos la lA-nea actual
        if (current) lines.push(current.trim())
        else lines.push(word) // por si una palabra sola ya se pasa

        current = ''
        if (lines.length === maxLines) break
      } else {
        current = tentative
      }

      // si ya vamos en la A�ltima palabra
      if (i === words.length - 1 && current && lines.length < maxLines) {
        lines.push(current.trim())
      }

      if (lines.length === maxLines) break
    }

    // si quedaron palabras sin meter, aA�adimos "�?�"
    const totalLength = text.length
    const joined = lines.join(' ')
    if (totalLength > joined.length) {
      lines[lines.length - 1] = lines[lines.length - 1] + '�?�'
    }

    return lines.join('\n')
  }

  const descFormateada = wrapDescription(descripcion, 15, 5)

  const handleDelete = async (event) => {
    event.stopPropagation()
    if (deleting) return
    const confirmed = window.confirm('A�Eliminar este producto?')
    if (!confirmed) return

    try {
      setDeleting(true)
      const res = await fetch(`${API_BASE_URL}/productos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar producto')
      onDeleted?.(id)
      window.location.reload()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = async () => {
    if (saving) return
    try {
      setSaving(true)
      const payload = {
        sku: form.sku || null,
        descripcion: form.descripcion,
        precio: Number(form.precio) || 0,
        costo: Number(form.costo) || 0,
        cantidad: Number(form.cantidad) || 0,
        tienda_id: product.tienda_id ?? null,
        marca_id: product.marca_id ?? null,
        categoria_id: product.categoria_id ?? null,
        talla_id: product.talla_id ?? null,
        imagen: product.imagen ?? null,
      }

      const res = await fetch(`${API_BASE_URL}/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Error al actualizar producto')

      const updated = await res.json()
      onUpdated?.(updated)
      setEditOpen(false)
      window.location.reload()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 3,
        position: 'relative',
        flex: 1,                         // dY"1 llena el alto del Grid item
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {/* Imagen con altura fija */}
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderBottom: 1,
            borderColor: 'divider',
            height: 140,                 // dY"1 todas las imA�genes misma altura
            width: 150,
          }}
        >
          {imagen ? (
            <Box
              component="img"
              alt={descripcion}
              src={imagen}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="overline" color="text.secondary">
                SIN IMAGEN
              </Typography>
            </Box>
          )}

          <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
            <Chip
              size="small"
              label={low ? 'Bajo stock' : 'En stock'}
              color={low ? 'warning' : 'success'}
            />
          </Box>
        </Box>

        {/* Texto */}
        <Box
          sx={{
            p: 1.5,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ whiteSpace: 'pre-line' }}   // respeta el "\n"
            title={descripcion}
          >
            {descFormateada}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
          >
            {id}
          </Typography>

          <Box
            sx={{
              mt: 0.5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="body2">
              Q {precio.toFixed(2)}
            </Typography>
            {!esServicio && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                Stock: {cantidad}
              </Typography>
            )}
            {esServicio && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                Stock: N/A
              </Typography>
            )}
          </Box>
        </Box>
      </CardActionArea>

      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          gap: 0.5,
        }}
      >
        <IconButton
          size="small"
          color="primary"
          onClick={(e) => {
            e.stopPropagation()
            setEditOpen(true)
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={handleDelete}
          disabled={deleting}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar producto</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="SKU"
              value={form.sku}
              onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
              fullWidth
            />
            <TextField
              label="DescripciA3n"
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Costo"
              type="number"
              value={form.costo}
              onChange={(e) => setForm((prev) => ({ ...prev, costo: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Precio"
              type="number"
              value={form.precio}
              onChange={(e) => setForm((prev) => ({ ...prev, precio: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Cantidad"
              type="number"
              value={form.cantidad}
              onChange={(e) => setForm((prev) => ({ ...prev, cantidad: e.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
