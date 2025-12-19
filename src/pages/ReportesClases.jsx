import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Button,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Alert,
} from '@mui/material'
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs from 'dayjs'
import { API_BASE_URL } from '../config/api'

const formatTime = (value) => (value ? value.slice(0, 5) : '')

export default function ReportesClases() {
  const [sessions, setSessions] = React.useState([])
  const [bookings, setBookings] = React.useState([])
  const [clients, setClients] = React.useState([])
  const [coaches, setCoaches] = React.useState([])
  const [templates, setTemplates] = React.useState([])
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const autoCompletingRef = React.useRef(false)

  const [range, setRange] = React.useState([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ])
  const [filters, setFilters] = React.useState({
    client: '',
    coach: '',
  })

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [sessionsRes, bookingsRes, clientsRes, coachesRes, templatesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/class-sessions`),
        fetch(`${API_BASE_URL}/bookings`),
        fetch(`${API_BASE_URL}/clients`),
        fetch(`${API_BASE_URL}/coaches`),
        fetch(`${API_BASE_URL}/class-templates`),
      ])
      if (!sessionsRes.ok || !bookingsRes.ok || !clientsRes.ok || !coachesRes.ok || !templatesRes.ok) {
        throw new Error('No se pudo cargar la información de clases')
      }
      const [sessionsData, bookingsData, clientsData, coachesData, templatesData] = await Promise.all([
        sessionsRes.json(),
        bookingsRes.json(),
        clientsRes.json(),
        coachesRes.json(),
        templatesRes.json(),
      ])
      setSessions(sessionsData)
      setBookings(bookingsData)
      setClients(clientsData)
      setCoaches(coachesData)
      setTemplates(templatesData)
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar la información de clases')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  React.useEffect(() => {
    loadData()
  }, [loadData, range, filters.client, filters.coach])

  React.useEffect(() => {
    const today = dayjs().startOf('day')
    const pending = sessions.filter(
      (s) => (s.estado || '').toLowerCase() === 'programada' && s.fecha && dayjs(s.fecha).isBefore(today, 'day')
    )
    if (pending.length === 0 || autoCompletingRef.current) return

    autoCompletingRef.current = true
    ;(async () => {
      try {
        await Promise.all(
          pending.map(async (session) => {
            const res = await fetch(`${API_BASE_URL}/class-sessions/${session.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ estado: 'Completada' }),
            })
            if (!res.ok) {
              const text = await res.text()
              throw new Error(text || 'No se pudo actualizar estado')
            }
          })
        )
        setSessions((prev) =>
          prev.map((s) =>
            pending.some((p) => p.id === s.id) ? { ...s, estado: 'Completada' } : s
          )
        )
      } catch (err) {
        console.error('No se pudieron completar clases pasadas', err)
      } finally {
        autoCompletingRef.current = false
      }
    })()
  }, [sessions])

  const clientMap = React.useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients])
  const coachMap = React.useMemo(() => Object.fromEntries(coaches.map((c) => [c.id, c])), [coaches])
  const templateMap = React.useMemo(() => Object.fromEntries(templates.map((t) => [t.id, t])), [templates])

  const filteredSessions = React.useMemo(() => {
    const start = range[0] ? dayjs(range[0]).startOf('day') : null
    const end = range[1] ? dayjs(range[1]).endOf('day') : null
    const clientId = filters.client ? Number(filters.client) : null
    const coachId = filters.coach ? Number(filters.coach) : null

    return sessions
      .filter((s) => {
        const d = s.fecha ? dayjs(s.fecha) : null
        if (!d) return false
        if (start && d.isBefore(start)) return false
        if (end && d.isAfter(end)) return false
        if (coachId && Number(s.coach_id) !== coachId) return false
      if (clientId) {
        const hasClient = bookings.some(
          (b) => b.session_id === s.id && Number(b.client_id) === clientId
        )
        if (!hasClient) return false
      }
      return true
      })
      .sort((a, b) => dayjs(a.fecha).valueOf() - dayjs(b.fecha).valueOf())
  }, [sessions, bookings, filters, range])

  const sessionStats = React.useMemo(() => {
    const map = {}
    filteredSessions.forEach((s) => {
      const bs = bookings.filter((b) => b.session_id === s.id)
      const asistentes = bs.filter((b) => b.asistio).length
      map[s.id] = {
        total: bs.length,
        asistencias: asistentes,
      }
    })
    return map
  }, [bookings, filteredSessions])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Reportes de clases
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Estadísticas de clases pasadas con filtros por fecha, cliente y coach.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={loadData} disabled={loading}>
          Refrescar
        </Button>
      </Stack>

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
          mb: 2,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateRangePicker
              localeText={{ start: 'Inicio', end: 'Fin' }}
              value={range}
              onChange={(newValue) => setRange(newValue)}
              sx={{ width: '100%' }}
            />
          </LocalizationProvider>
          <TextField
            select
            label="Cliente"
            size="small"
            value={filters.client}
            onChange={(e) => handleFilterChange('client', e.target.value)}
            fullWidth
          >
            <MenuItem value="">Todos</MenuItem>
            {clients.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nombre} ({c.telefono})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Coach"
            size="small"
            value={filters.coach}
            onChange={(e) => handleFilterChange('coach', e.target.value)}
            fullWidth
          >
            <MenuItem value="">Todos</MenuItem>
            {coaches.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nombre}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          backgroundColor: '#f4efe6',
          border: '1px solid #d9cdbb',
        }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
          Clases encontradas: {filteredSessions.length}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Hora</TableCell>
              <TableCell>Clase</TableCell>
              <TableCell>Coach</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Reservas</TableCell>
              <TableCell align="right">Asistencias</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSessions.map((s) => {
              const stats = sessionStats[s.id] || { total: 0, asistencias: 0 }
              const template = s.template_id ? templateMap[s.template_id] : null
              const name = template?.nombre || 'Clase'
              const coachName = coachMap[s.coach_id]?.nombre || `ID ${s.coach_id}`
              const fecha = s.fecha ? dayjs(s.fecha).format('YYYY-MM-DD') : ''
              const hora = s.hora_inicio ? formatTime(s.hora_inicio) : ''
              const estado = (s.estado || '').toLowerCase()
              const sessionDate = s.fecha ? dayjs(s.fecha) : null
              const isFuture = sessionDate ? sessionDate.isAfter(dayjs(), 'day') : false
              const isPastOrToday = sessionDate ? !isFuture : false
              let statusLabel = s.estado || '—'
              let statusColor = 'default'
              if (estado === 'cancelada') {
                statusLabel = 'Cancelada'
                statusColor = 'error'
              } else if (estado === 'programada') {
                if (isFuture) {
                  statusLabel = 'Pendiente'
                  statusColor = 'warning'
                } else if (isPastOrToday) {
                  statusLabel = 'Completada'
                  statusColor = 'default'
                }
              }
              return (
                <TableRow key={s.id}>
                  <TableCell>{fecha}</TableCell>
                  <TableCell>{hora}</TableCell>
                  <TableCell>{name}</TableCell>
                  <TableCell>{coachName}</TableCell>
                  <TableCell>
                    <Chip label={statusLabel} size="small" color={statusColor} />
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={stats.total} color="primary" size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={stats.asistencias} color="success" size="small" />
                  </TableCell>
                </TableRow>
              )
            })}
            {filteredSessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">
                    {loading ? 'Cargando...' : 'No hay clases en el rango seleccionado.'}
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
