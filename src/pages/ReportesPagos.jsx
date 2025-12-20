import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Alert,
  Chip,
} from '@mui/material'
import dayjs from 'dayjs'
import { API_BASE_URL } from '../config/api'

const formatDateTime = (value) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '')

export default function ReportesPagos() {
  const [payments, setPayments] = React.useState([])
  const [clients, setClients] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [range, setRange] = React.useState({
    inicio: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    fin: dayjs().format('YYYY-MM-DD'),
  })

  const loadPayments = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (range.inicio) params.append('inicio', range.inicio)
      if (range.fin) params.append('fin', range.fin)
      const [paymentsRes, clientsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/payments?${params.toString()}`),
        fetch(`${API_BASE_URL}/clients`),
      ])
      if (!paymentsRes.ok || !clientsRes.ok) {
        const text = await paymentsRes.text()
        throw new Error(text || 'No se pudieron cargar los pagos')
      }
      const [paymentsData, clientsData] = await Promise.all([paymentsRes.json(), clientsRes.json()])
      setPayments(paymentsData)
      setClients(clientsData)
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los pagos')
    } finally {
      setLoading(false)
    }
  }, [range])

  React.useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const clientMap = React.useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients])

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Reportes de pagos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Filtra y revisa los pagos registrados por fecha.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={loadPayments} disabled={loading}>
          Refrescar
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          backgroundColor: '#f4efe6',
          border: '1px solid #d9cdbb',
          mb: 2,
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField
            label="Inicio"
            type="date"
            size="small"
            value={range.inicio}
            onChange={(e) => setRange((prev) => ({ ...prev, inicio: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Fin"
            type="date"
            size="small"
            value={range.fin}
            onChange={(e) => setRange((prev) => ({ ...prev, fin: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <Button variant="contained" onClick={loadPayments} disabled={loading}>
            Aplicar
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          backgroundColor: '#f4efe6',
          border: '1px solid #d9cdbb',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="h6" fontWeight={700}>
            Pagos encontrados: {payments.length}
          </Typography>
          <Chip label={`Total: Q${totalAmount.toFixed(2)}`} color="primary" />
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha pago</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Método</TableCell>
              <TableCell>Referencia</TableCell>
              <TableCell>Cliente</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{formatDateTime(p.fecha_pago)}</TableCell>
                <TableCell>Q{Number(p.amount || 0).toFixed(2)}</TableCell>
                <TableCell>{p.payment_type || '—'}</TableCell>
                <TableCell>{p.payment_method || '—'}</TableCell>
                <TableCell>{p.payment_reference || '—'}</TableCell>
                <TableCell>{clientMap[p.client_id]?.nombre || `Cliente ${p.client_id || '—'}`}</TableCell>
              </TableRow>
            ))}
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">
                    {loading ? 'Cargando...' : 'No hay pagos en el rango seleccionado.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}
