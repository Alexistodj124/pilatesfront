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
  InputAdornment,
  Autocomplete,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
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
  const [coaches, setCoaches] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [generating, setGenerating] = React.useState(false)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedSession, setSelectedSession] = React.useState(null)
  const [newBooking, setNewBooking] = React.useState({ client_id: '', membership_id: '', estado: 'Reservada' })
  const [newClassDialogOpen, setNewClassDialogOpen] = React.useState(false)
  const [newClassForm, setNewClassForm] = React.useState({
    tipo: 'session', // session | recurrent
    nombre: '',
    fecha: dayjs().format('YYYY-MM-DD'),
    fecha_inicio: dayjs().format('YYYY-MM-DD'),
    dia_semana: 1,
    hora_inicio: '08:00',
    hora_fin: '09:00',
    coach_id: '',
    capacidad: 10,
    estado: 'Programada',
    template_id: '',
    nota: '',
  })
  const [newCoachDialogOpen, setNewCoachDialogOpen] = React.useState(false)
  const [newCoachForm, setNewCoachForm] = React.useState({ nombre: '', telefono: '' })
  const handleOpenNewClass = () => {
    setNewClassForm((prev) => ({
      ...prev,
      fecha: (selectedDay?.shortDate) || dayjs().format('YYYY-MM-DD'),
    }))
    setNewClassDialogOpen(true)
  }

  const handleGenerateSessionsForDay = async () => {
    if (!selectedDay) return
    const dateStr = selectedDay.date.format('YYYY-MM-DD')
    const dayNumber = selectedDay.date.day() // 0=Domingo
    const templatesForDay = templates.filter((tpl) => {
      const estado = (tpl.estado || '').toString().toLowerCase()
      const active = estado.includes('act') || estado.includes('prog')
      return Number(tpl.dia_semana) === dayNumber && active
    })

    // Excluir sesiones ya generadas para ese template en esa fecha
    const existingByTemplate = new Set(
      sessions
        .filter((s) => dayjs(s.fecha).isSame(dateStr, 'day') && s.template_id)
        .map((s) => s.template_id)
    )
    const pending = templatesForDay.filter((tpl) => !existingByTemplate.has(tpl.id))
    console.log('[Generar sesiones] fecha', dateStr, 'día', dayNumber, {
      templatesForDay,
      existingByTemplate: Array.from(existingByTemplate),
      pending,
    })
    if (pending.length === 0) return

    setGenerating(true)
    setError('')
    try {
      const responses = await Promise.all(
        pending.map(async (tpl) => {
          const payload = {
            template_id: tpl.id,
            fecha: dateStr,
            hora_inicio: tpl.hora_inicio,
            hora_fin: tpl.hora_fin,
            coach_id: tpl.coach_id,
            capacidad: tpl.capacidad,
            estado: 'Programada',
            nota: null,
          }
          console.log('[Generar sesiones] creando', payload)
          const res = await fetch(`${API_BASE_URL}/class-sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const text = await res.text()
          if (!res.ok) {
            console.error('[Generar sesiones] error', res.status, text)
            throw new Error(text || 'Error creando sesión')
          }
          return text
        })
      )
      console.log('[Generar sesiones] respuestas', responses)
      loadData()
    } catch (err) {
      console.error(err)
      setError('No se pudieron generar sesiones desde plantillas')
    } finally {
      setGenerating(false)
    }
  }

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [sessionsRes, bookingsRes, clientsRes, plansRes, membershipsRes, templatesRes, coachesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/class-sessions`),
        fetch(`${API_BASE_URL}/bookings`),
        fetch(`${API_BASE_URL}/clients`),
        fetch(`${API_BASE_URL}/membership-plans`),
        fetch(`${API_BASE_URL}/memberships`),
        fetch(`${API_BASE_URL}/class-templates`),
        fetch(`${API_BASE_URL}/coaches`),
      ])

      if (
        !sessionsRes.ok ||
        !bookingsRes.ok ||
        !clientsRes.ok ||
        !plansRes.ok ||
        !membershipsRes.ok ||
        !templatesRes.ok ||
        !coachesRes.ok
      ) {
        throw new Error('Error al cargar datos')
      }

      const [sessionsData, bookingsData, clientsData, plansData, membershipsData, templatesData, coachesData] = await Promise.all([
        sessionsRes.json(),
        bookingsRes.json(),
        clientsRes.json(),
        plansRes.json(),
        membershipsRes.json(),
        templatesRes.json(),
        coachesRes.json(),
      ])

      setSessions(sessionsData)
      setBookings(bookingsData)
      setClients(clientsData)
      setPlans(plansData)
      setMemberships(membershipsData)
      setTemplates(templatesData)
      setCoaches(coachesData)
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
  const coachMap = React.useMemo(() => Object.fromEntries(coaches.map((c) => [c.id, c])), [coaches])
  const sessionMap = React.useMemo(() => Object.fromEntries(sessions.map((s) => [s.id, s])), [sessions])

  const handleOpenDialog = (session) => {
    setSelectedSession(session)
    setNewBooking({ client_id: '', membership_id: '', estado: 'Reservada' })
    setDialogOpen(true)
  }

  const handleTemplateSelect = (templateId) => {
    const tplId = templateId ? Number(templateId) : ''
    const tpl = tplId ? templateMap[tplId] : null
    if (!tpl) {
      setNewClassForm((prev) => ({ ...prev, template_id: '' }))
      return
    }
    setNewClassForm((prev) => ({
      ...prev,
      template_id: tplId,
      coach_id: tpl.coach_id,
      capacidad: tpl.capacidad,
      hora_inicio: tpl.hora_inicio?.slice(0, 5) || prev.hora_inicio,
      hora_fin: tpl.hora_fin?.slice(0, 5) || prev.hora_fin,
    }))
  }

  const handleSaveClass = async () => {
    try {
      setError('')
      if (newClassForm.tipo === 'session') {
        const payload = {
          fecha: newClassForm.fecha,
          hora_inicio: `${newClassForm.hora_inicio}:00`,
          hora_fin: `${newClassForm.hora_fin}:00`,
          coach_id: Number(newClassForm.coach_id),
          capacidad: Number(newClassForm.capacidad),
          estado: newClassForm.estado,
          template_id: newClassForm.template_id || null,
          nota: newClassForm.nota || null,
        }
        const res = await fetch(`${API_BASE_URL}/class-sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('No se pudo crear la clase')
      } else {
        const payload = {
          nombre: newClassForm.nombre,
          coach_id: Number(newClassForm.coach_id),
          dia_semana: Number(newClassForm.dia_semana),
          hora_inicio: `${newClassForm.hora_inicio}:00`,
          hora_fin: `${newClassForm.hora_fin}:00`,
          capacidad: Number(newClassForm.capacidad),
          estado: newClassForm.estado,
          fecha_inicio: newClassForm.fecha_inicio || null,
        }
        const res = await fetch(`${API_BASE_URL}/class-templates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('No se pudo crear la clase recurrente')
      }
      setNewClassDialogOpen(false)
      setNewClassForm({
        tipo: 'session',
        nombre: '',
        fecha: dayjs().format('YYYY-MM-DD'),
        fecha_inicio: dayjs().format('YYYY-MM-DD'),
        dia_semana: 1,
        hora_inicio: '08:00',
        hora_fin: '09:00',
        coach_id: '',
        capacidad: 10,
        estado: 'Programada',
        template_id: '',
        nota: '',
      })
      loadData()
    } catch (err) {
      console.error(err)
      setError('No se pudo crear la clase')
    }
  }

  const handleAddBooking = async () => {
    if (!selectedSession || !newBooking.client_id || !newBooking.membership_id) {
      setError('Selecciona un cliente con membresía activa para reservar.')
      return
    }
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
      if (!res.ok) {
        let msg = 'No se pudo crear la reserva'
        try {
          const data = await res.json()
          msg = data?.error || data?.message || msg
        } catch {
          const text = await res.text()
          msg = text || msg
        }
        setError(msg)
        return
      }
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

  const handleClientChange = (clientId) => {
    const activeMembership = memberships.find(
      (m) => m.estado === 'Activa' && Number(m.client_id) === Number(clientId)
    )
    setNewBooking({
      client_id: clientId,
      membership_id: activeMembership ? activeMembership.id : '',
      estado: 'Reservada',
    })
  }

  const handleAddCoach = async () => {
    try {
      if (!newCoachForm.nombre.trim()) return
      setError('')
      const res = await fetch(`${API_BASE_URL}/coaches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newCoachForm.nombre, telefono: newCoachForm.telefono }),
      })
      if (!res.ok) throw new Error('No se pudo crear coach')
      setNewCoachDialogOpen(false)
      setNewCoachForm({ nombre: '', telefono: '' })
      loadData()
    } catch (err) {
      console.error(err)
      setError('No se pudo crear el coach')
    }
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Calendario de clases
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Verde indica cupos disponibles; rojo indica que la clase está completa.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleGenerateSessionsForDay} disabled={generating}>
            Generar Clases
          </Button>
          <Button variant="contained" onClick={handleOpenNewClass}>
            Nueva clase
          </Button>
        </Stack>
      </Stack>

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
                      Coach: {coachMap[session.coach_id]?.nombre || `ID ${session.coach_id}`} · Capacidad: {session.capacidad}
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
            <Autocomplete
              options={clients}
              getOptionLabel={(option) => `${option.nombre || ''}${option.telefono ? ` (${option.telefono})` : ''}`}
              filterOptions={(options, { inputValue }) => {
                const term = inputValue.toLowerCase()
                return options.filter(
                  (opt) =>
                    opt.nombre?.toLowerCase().includes(term) ||
                    opt.telefono?.toLowerCase().includes(term)
                )
              }}
              value={clients.find((c) => Number(c.id) === Number(newBooking.client_id)) || null}
              onChange={(_e, value) => handleClientChange(value ? value.id : '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente"
                  placeholder="Busca por nombre o teléfono"
                  fullWidth
                />
              )}
            />
            <TextField
              select
              label="Membresía (opcional)"
              value={newBooking.membership_id}
              onChange={(e) => setNewBooking({ ...newBooking, membership_id: e.target.value })}
              fullWidth
              disabled={!newBooking.client_id || availableMemberships.length === 0}
              helperText={
                !newBooking.client_id
                  ? 'Selecciona cliente para ver membresías'
                  : availableMemberships.length === 0
                  ? 'El cliente no tiene membresías activas'
                  : ''
              }
            >
              {availableMemberships.map((m) => {
                const plan = planMap[m.plan_id]
                return (
                  <MenuItem key={m.id} value={m.id}>
                    {plan?.nombre || 'Plan'} · vence {dayjs(m.fecha_fin).format('YYYY-MM-DD')}
                  </MenuItem>
                )
              })}
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
          <Button variant="contained" onClick={handleAddBooking} disabled={!newBooking.client_id || !newBooking.membership_id}>
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={newClassDialogOpen} onClose={() => setNewClassDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Crear nueva clase</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              select
              label="Tipo"
              value={newClassForm.tipo}
              onChange={(e) => setNewClassForm({ ...newClassForm, tipo: e.target.value })}
              fullWidth
            >
              <MenuItem value="session">Una sola sesión</MenuItem>
              <MenuItem value="recurrent">Recurrente (plantilla)</MenuItem>
            </TextField>
            <TextField
              select
              label="Plantilla (opcional)"
              value={newClassForm.template_id}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              fullWidth
            >
              <MenuItem value="">Sin plantilla</MenuItem>
              {templates.map((tpl) => (
                <MenuItem key={tpl.id} value={tpl.id}>
                  {tpl.nombre} · día {tpl.dia_semana} · {formatTime(tpl.hora_inicio)}
                </MenuItem>
              ))}
            </TextField>
            {newClassForm.tipo === 'recurrent' && (
              <>
                <TextField
                  label="Nombre de la clase"
                  value={newClassForm.nombre}
                  onChange={(e) => setNewClassForm({ ...newClassForm, nombre: e.target.value })}
                  fullWidth
                />
                <TextField
                  select
                  label="Día de la semana (0=Domingo)"
                  value={newClassForm.dia_semana}
                  onChange={(e) => setNewClassForm({ ...newClassForm, dia_semana: Number(e.target.value) })}
                  fullWidth
                >
                  <MenuItem value={1}>Lunes</MenuItem>
                  <MenuItem value={2}>Martes</MenuItem>
                  <MenuItem value={3}>Miércoles</MenuItem>
                  <MenuItem value={4}>Jueves</MenuItem>
                  <MenuItem value={5}>Viernes</MenuItem>
                  <MenuItem value={6}>Sábado</MenuItem>
                  <MenuItem value={0}>Domingo</MenuItem>
                </TextField>
              </>
            )}
            <TextField
              label="Fecha"
              type="date"
              value={newClassForm.fecha}
              onChange={(e) => setNewClassForm({ ...newClassForm, fecha: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled={newClassForm.tipo === 'recurrent'}
            />
            {newClassForm.tipo === 'recurrent' && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Fecha inicio"
                  type="date"
                  value={newClassForm.fecha_inicio}
                  onChange={(e) => setNewClassForm({ ...newClassForm, fecha_inicio: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Hora inicio"
                type="time"
                value={newClassForm.hora_inicio}
                onChange={(e) => setNewClassForm({ ...newClassForm, hora_inicio: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Hora fin"
                type="time"
                value={newClassForm.hora_fin}
                onChange={(e) => setNewClassForm({ ...newClassForm, hora_fin: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <TextField
              select
              label="Coach"
              value={newClassForm.coach_id}
              onChange={(e) => setNewClassForm({ ...newClassForm, coach_id: e.target.value })}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setNewCoachDialogOpen(true)}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            >
              {coaches.map((coach) => (
                <MenuItem key={coach.id} value={coach.id}>
                  {coach.nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Capacidad"
              type="number"
              value={newClassForm.capacidad}
              onChange={(e) => setNewClassForm({ ...newClassForm, capacidad: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Estado"
              value={newClassForm.estado}
              onChange={(e) => setNewClassForm({ ...newClassForm, estado: e.target.value })}
              fullWidth
            >
              <MenuItem value="Programada">Programada</MenuItem>
              <MenuItem value="Cancelada">Cancelada</MenuItem>
              <MenuItem value="Completada">Completada</MenuItem>
            </TextField>
            <TextField
              label="Nota"
              value={newClassForm.nota}
              onChange={(e) => setNewClassForm({ ...newClassForm, nota: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewClassDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveClass}
            disabled={
              (newClassForm.tipo === 'session' && !newClassForm.fecha) ||
              (newClassForm.tipo === 'recurrent' && !newClassForm.nombre) ||
              !newClassForm.hora_inicio ||
              !newClassForm.hora_fin ||
              !newClassForm.coach_id ||
              !newClassForm.capacidad
            }
          >
            Crear clase
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={newCoachDialogOpen} onClose={() => setNewCoachDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Nuevo coach</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Nombre"
              value={newCoachForm.nombre}
              onChange={(e) => setNewCoachForm({ ...newCoachForm, nombre: e.target.value })}
              fullWidth
            />
            <TextField
              label="Teléfono"
              value={newCoachForm.telefono}
              onChange={(e) => setNewCoachForm({ ...newCoachForm, telefono: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewCoachDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddCoach} disabled={!newCoachForm.nombre.trim() || !newCoachForm.telefono.trim()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
