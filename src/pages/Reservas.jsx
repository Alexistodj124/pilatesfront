import React from 'react'
import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Stack,
  Typography,
  MenuItem,
  Alert,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import dayjs from 'dayjs'
import { API_BASE_URL } from '../config/api'

const buildNextSixDays = () => {
  const days = []
  let cursor = dayjs().startOf('day')
  while (days.length < 6) {
    if (cursor.day() !== 0) {
      days.push({
        index: days.length,
        date: cursor,
        label: cursor.format('dddd, DD MMM'),
        shortDate: cursor.format('YYYY-MM-DD'),
      })
    }
    cursor = cursor.add(1, 'day')
  }
  return days
}

const formatTime = (value) => (value ? value.slice(0, 5) : '—')

export default function Reservas() {
  const [days] = React.useState(buildNextSixDays)
  const [selectedDayIndex, setSelectedDayIndex] = React.useState(0)
  const selectedDay = days[selectedDayIndex] ?? days[0]

  const [sessions, setSessions] = React.useState([])
  const [bookings, setBookings] = React.useState([])
  const [clients, setClients] = React.useState([])
  const [plans, setPlans] = React.useState([])
  const [memberships, setMemberships] = React.useState([])
  const [templates, setTemplates] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedSession, setSelectedSession] = React.useState(null)
  const [newBooking, setNewBooking] = React.useState({ client_id: '', membership_id: '', estado: 'Reservada' })

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [sessionsRes, bookingsRes, clientsRes, plansRes, membershipsRes, templatesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/class-sessions`),
        fetch(`${API_BASE_URL}/bookings`),
        fetch(`${API_BASE_URL}/clients`),
        fetch(`${API_BASE_URL}/membership-plans`),
        fetch(`${API_BASE_URL}/memberships`),
        fetch(`${API_BASE_URL}/class-templates`),
      ])

      if (
        !sessionsRes.ok ||
        !bookingsRes.ok ||
        !clientsRes.ok ||
        !plansRes.ok ||
        !membershipsRes.ok ||
        !templatesRes.ok
      ) {
        throw new Error('Error al cargar datos')
      }

      const [sessionsData, bookingsData, clientsData, plansData, membershipsData, templatesData] = await Promise.all([
        sessionsRes.json(),
        bookingsRes.json(),
        clientsRes.json(),
        plansRes.json(),
        membershipsRes.json(),
        templatesRes.json(),
      ])

      setSessions(sessionsData)
      setBookings(bookingsData)
      setClients(clientsData)
      setPlans(plansData)
      setMemberships(membershipsData)
      setTemplates(templatesData)
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar las clases o reservas')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const sessionsForDay = React.useMemo(() => {
    if (!selectedDay) return []
    return sessions
      .filter((s) => dayjs(s.fecha).isSame(selectedDay.date, 'day'))
      .sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''))
  }, [sessions, selectedDay])

  const bookingsBySession = React.useMemo(() => {
    const map = {}
    bookings.forEach((b) => {
      if (!map[b.session_id]) map[b.session_id] = []
      map[b.session_id].push(b)
    })
    return map
  }, [bookings])

  const planMap = React.useMemo(() => Object.fromEntries(plans.map((p) => [p.id, p])), [plans])
  const clientMap = React.useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients])
  const membershipMap = React.useMemo(() => Object.fromEntries(memberships.map((m) => [m.id, m])), [memberships])
  const templateMap = React.useMemo(() => Object.fromEntries(templates.map((t) => [t.id, t])), [templates])

  const handleOpenDialog = (session) => {
    setSelectedSession(session)
    setNewBooking({ client_id: '', membership_id: '', estado: 'Reservada' })
    setDialogOpen(true)
  }

  const handleAddBooking = async () => {
    if (!selectedSession || !newBooking.client_id) return
    try {
      setError('')
      const payload = {
        session_id: selectedSession.id,
        client_id: Number(newBooking.client_id),
        membership_id: newBooking.membership_id ? Number(newBooking.membership_id) : null,
        estado: newBooking.estado,
      }
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('No se pudo crear la reserva')
      await res.json()
      setDialogOpen(false)
      setNewBooking({ client_id: '', membership_id: '', estado: 'Reservada' })
      loadData()
    } catch (err) {
      console.error(err)
      setError('No se pudo crear la reserva')
    }
  }

  const handleDeleteBooking = async (bookingId) => {
    try {
      setError('')
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('No se pudo eliminar la reserva')
      loadData()
    } catch (err) {
      console.error(err)
      setError('No se pudo eliminar la reserva')
    }
  }

  const attendees = selectedSession ? bookingsBySession[selectedSession.id] || [] : []
  const capacityUsed = selectedSession ? attendees.length : 0

  const availableMemberships = React.useMemo(
    () => memberships.filter((m) => m.estado === 'Activa' && m.client_id === Number(newBooking.client_id)),
    [memberships, newBooking.client_id]
  )

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Calendario de clases
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Reserva clases reales desde el backend. Verde indica cupos disponibles; rojo indica que la clase está completa.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2, mb: 1 }}>
        <Box sx={{ width: 14, height: 14, borderRadius: 0.8, backgroundColor: '#d6f5e4', border: '1px solid #2e7d32' }} />
        <Typography variant="body2" fontWeight={600}>Disponible</Typography>
        <Box sx={{ width: 14, height: 14, borderRadius: 0.8, backgroundColor: '#f5d6d6', border: '1px solid #d32f2f' }} />
        <Typography variant="body2" fontWeight={600}>Llena</Typography>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
        {days.map((day, idx) => (
          <Button
            key={day.index}
            variant={idx === selectedDayIndex ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setSelectedDayIndex(idx)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              flex: 1,
              minWidth: '140px',
            }}
          >
            {day.label}
          </Button>
        ))}
      </Stack>

      {selectedDay && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: '#f4efe6',
            border: '1px solid #d9cdbb',
          }}
        >
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {selectedDay.shortDate}
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {selectedDay.label}
              </Typography>
            </Box>

            <Divider />

            <Stack spacing={1.5}>
              {sessionsForDay.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  {loading ? 'Cargando sesiones...' : 'No hay clases para este día.'}
                </Typography>
              )}

              {sessionsForDay.map((session) => {
                const booked = bookingsBySession[session.id]?.length || 0
                const isFull = booked >= session.capacidad
                const template = session.template_id ? templateMap[session.template_id] : null
                const name = template?.nombre || `Clase #${session.id}`
                const chipLabel = isFull ? 'Llena' : `Disponible (${session.capacidad - booked} cupos)`
                const backgroundColor = isFull ? '#f5d6d6' : '#d6f5e4'
                const borderColor = isFull ? '#d32f2f' : '#2e7d32'

                return (
                  <Box
                    key={session.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor,
                      border: `1px solid ${borderColor}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => handleOpenDialog(session)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {formatTime(session.hora_inicio)} · {name}
                      </Typography>
                      <Chip
                        size="small"
                        label={chipLabel}
                        color={isFull ? 'error' : 'success'}
                        sx={{ fontWeight: 600 }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Coach ID: {session.coach_id} · Capacidad: {session.capacidad}
                    </Typography>
                  </Box>
                )
              })}
            </Stack>
          </Stack>
        </Paper>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {selectedSession
            ? `${formatTime(selectedSession.hora_inicio)} · ${selectedSession.template_id ? templateMap[selectedSession.template_id]?.nombre : 'Clase'}`
            : 'Clase'}
        </DialogTitle>
        <DialogContent dividers>
          {selectedSession && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Fecha: {dayjs(selectedSession.fecha).format('YYYY-MM-DD')} · Coach ID: {selectedSession.coach_id}
            </Typography>
          )}

          <Stack spacing={2} sx={{ mb: 2 }}>
            <TextField
              select
              label="Cliente"
              value={newBooking.client_id}
              onChange={(e) => setNewBooking({ ...newBooking, client_id: e.target.value, membership_id: '' })}
              fullWidth
            >
              {clients.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre} ({c.telefono})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Membresía (opcional)"
              value={newBooking.membership_id}
              onChange={(e) => setNewBooking({ ...newBooking, membership_id: e.target.value })}
              fullWidth
              disabled={!newBooking.client_id || availableMemberships.length === 0}
              helperText={!newBooking.client_id ? 'Selecciona cliente para ver membresías' : ''}
            >
              {availableMemberships.map((m) => {
                const plan = planMap[m.plan_id]
                return (
                  <MenuItem key={m.id} value={m.id}>
                    {plan?.nombre || 'Plan'} · vence {dayjs(m.fecha_fin).format('YYYY-MM-DD')}
                  </MenuItem>
                )
              })}
              <MenuItem value="">
                Sin membresía
              </MenuItem>
            </TextField>
          </Stack>

          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Clientes en esta clase
          </Typography>
          {attendees.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Sin clientes aún.
            </Typography>
          ) : (
            <List dense>
              {attendees.map((booking) => {
                const client = clientMap[booking.client_id]
                const membership = booking.membership_id ? membershipMap[booking.membership_id] : null
                const plan = membership ? planMap[membership.plan_id] : null
                return (
                  <ListItem
                    key={booking.id}
                    secondaryAction={(
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteBooking(booking.id)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  >
                    <ListItemText
                      primary={client ? client.nombre : `Cliente ${booking.client_id}`}
                      secondary={
                        <>
                          Estado: {booking.estado}
                          {membership && plan ? ` · ${plan.nombre}` : ''}
                        </>
                      }
                    />
                  </ListItem>
                )
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
          <Button variant="contained" onClick={handleAddBooking} disabled={!newBooking.client_id}>
            Agregar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
