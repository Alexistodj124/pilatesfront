import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Button,
  InputAdornment,
  TextField,
} from '@mui/material'
import EventIcon from '@mui/icons-material/Event'
import CloseIcon from '@mui/icons-material/Close'
import dayjs from 'dayjs'
import { API_BASE_URL } from '../config/api'

export default function Asistencias() {
  const [sessions, setSessions] = React.useState([])
  const [bookings, setBookings] = React.useState([])
  const [clients, setClients] = React.useState([])
  const [templates, setTemplates] = React.useState([])
  const [selectedDate, setSelectedDate] = React.useState(dayjs().startOf('day'))
  const [selectedSessionId, setSelectedSessionId] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [pendingAttendance, setPendingAttendance] = React.useState({})

  const XBoxIcon = ({ filled = false }) => (
    <Box
      sx={{
        width: 22,
        height: 22,
        borderRadius: 1,
        border: '2px solid',
        borderColor: filled ? 'error.main' : 'rgba(0,0,0,0.6)',
        backgroundColor: filled ? 'rgba(244, 67, 54, 0.12)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: filled ? 'error.main' : 'rgba(0,0,0,0.6)',
      }}
    >
      <CloseIcon fontSize="small" />
    </Box>
  )

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [sessionsRes, bookingsRes, clientsRes, templatesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/class-sessions`),
        fetch(`${API_BASE_URL}/bookings`),
        fetch(`${API_BASE_URL}/clients`),
        fetch(`${API_BASE_URL}/class-templates`),
      ])
      if (!sessionsRes.ok || !bookingsRes.ok || !clientsRes.ok || !templatesRes.ok) {
        throw new Error('Error al cargar asistencia')
      }
      const [sessionsData, bookingsData, clientsData, templatesData] = await Promise.all([
        sessionsRes.json(),
        bookingsRes.json(),
        clientsRes.json(),
        templatesRes.json(),
      ])
      setSessions(sessionsData)
      setBookings(bookingsData)
      setClients(clientsData)
      setTemplates(templatesData)
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar la información de asistencia')
    } finally {
      setLoading(false)
    }
  }, [selectedSessionId])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const clientMap = React.useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients])
  const templateMap = React.useMemo(() => Object.fromEntries(templates.map((t) => [t.id, t])), [templates])
  const bookingsBySession = React.useMemo(() => {
    const map = {}
    bookings.forEach((b) => {
      if (!map[b.session_id]) map[b.session_id] = []
      map[b.session_id].push(b)
    })
    return map
  }, [bookings])

  const sessionsForDate = React.useMemo(
    () => sessions.filter((s) => dayjs(s.fecha).isSame(selectedDate, 'day')),
    [sessions, selectedDate]
  )

  React.useEffect(() => {
    if (!selectedSessionId && sessionsForDate.length > 0) {
      setSelectedSessionId(sessionsForDate[0].id)
    }
    if (selectedSessionId) {
      const stillExists = sessionsForDate.some((s) => s.id === selectedSessionId)
      if (!stillExists) {
        setSelectedSessionId(sessionsForDate[0]?.id || '')
      }
    }
  }, [sessionsForDate, selectedSessionId])

  const selectedSession = sessions.find((s) => s.id === selectedSessionId)
  const sessionBookings = bookingsBySession[selectedSessionId] || []

  const sessionLabel = (session) => {
    if (!session) return 'Clase'
    const date = session.fecha ? dayjs(session.fecha).format('YYYY-MM-DD') : ''
    const time = session.hora_inicio ? session.hora_inicio.slice(0, 5) : ''
    const name = session.template_id ? templateMap[session.template_id]?.nombre : null
    return `${date} · ${time} · ${name || 'Clase'}`
  }

  React.useEffect(() => {
    const initialAttendance = {}
    sessionBookings.forEach((booking) => {
      initialAttendance[booking.id] = typeof booking.asistio === 'boolean' ? booking.asistio : null
    })
    setPendingAttendance(initialAttendance)
  }, [sessionBookings])

  const handleSelectAttendance = (bookingId, value) => {
    setPendingAttendance((prev) => {
      const current = prev[bookingId]
      const nextValue = current === value ? null : value
      return { ...prev, [bookingId]: nextValue }
    })
  }

  const handleSubmitAttendance = async () => {
    setSaving(true)
    setError('')
    const updates = sessionBookings.filter((booking) => {
      const value = pendingAttendance[booking.id]
      return typeof value === 'boolean' && value !== booking.asistio
    })
    const updatesPayload = {}
    updates.forEach((booking) => {
      const asistio = pendingAttendance[booking.id]
      updatesPayload[booking.id] = {
        asistio,
        check_in_at: asistio ? new Date().toISOString() : null,
      }
    })

    try {
      for (const booking of updates) {
        const payload = updatesPayload[booking.id]
        const res = await fetch(`${API_BASE_URL}/bookings/${booking.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const text = await res.text()
        if (!res.ok) {
          throw new Error(text || 'No se pudo actualizar asistencia')
        }
      }

      if (updates.length > 0) {
        setBookings((prev) =>
          prev.map((booking) => {
            if (!updatesPayload[booking.id]) return booking
            return { ...booking, asistio: updatesPayload[booking.id].asistio, check_in_at: updatesPayload[booking.id].check_in_at }
          })
        )
      }
    } catch (err) {
      console.error(err)
      setError('No se pudo actualizar asistencia')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Asistencias
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Marca asistencia sobre las reservas de cada clase.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={loadData} disabled={loading}>
          Refrescar
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center">
        <TextField
          size="small"
          type="date"
          value={selectedDate.format('YYYY-MM-DD')}
          onChange={(e) => setSelectedDate(dayjs(e.target.value))}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <EventIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 220 }}
        />
        <Typography variant="body2" color="text.secondary">
          Mostrando clases del {selectedDate.format('YYYY-MM-DD')}
        </Typography>
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
        }}
      >
        <Stack spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Clase</InputLabel>
            <Select
              value={selectedSessionId || ''}
              label="Clase"
              onChange={(e) => setSelectedSessionId(e.target.value)}
            >
              {sessionsForDate.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {sessionLabel(s)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />

          <Typography variant="subtitle1" fontWeight={700}>
            {sessionLabel(selectedSession)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reservas: {sessionBookings.length}
          </Typography>

          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" onClick={handleSubmitAttendance} disabled={saving || sessionBookings.length === 0}>
              Guardar asistencia
            </Button>
          </Stack>

          {sessionBookings.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay clientes reservados para esta clase.
            </Typography>
          ) : (
            <List dense>
              {sessionBookings.map((booking) => {
                const client = clientMap[booking.client_id]
                return (
                  <ListItem
                    key={booking.id}
                    secondaryAction={(
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Checkbox
                          edge="end"
                          checked={pendingAttendance[booking.id] === true}
                          onChange={() => handleSelectAttendance(booking.id, true)}
                          disabled={saving}
                        />
                        <Checkbox
                          edge="end"
                          checked={pendingAttendance[booking.id] === false}
                          onChange={() => handleSelectAttendance(booking.id, false)}
                          disabled={saving}
                          icon={<XBoxIcon />}
                          checkedIcon={<XBoxIcon filled />}
                        />
                      </Stack>
                    )}
                  >
                    <ListItemText
                      primary={client ? client.nombre : `Cliente ${booking.client_id}`}
                      secondary={`Estado reserva: ${booking.estado}`}
                    />
                  </ListItem>
                )
              })}
            </List>
          )}
        </Stack>
      </Paper>
    </Box>
  )
}
