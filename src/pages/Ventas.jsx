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
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

const BASE_CLASSES = [
  { id: 'sunrise', name: 'Amanecer Power', time: '06:00', coach: 'Ana', capacity: 10 },
  { id: 'core', name: 'Fuerza y Core', time: '08:00', coach: 'Julia', capacity: 8 },
  { id: 'midday', name: 'Almuerzo Flow', time: '12:30', coach: 'Laura', capacity: 12 },
  { id: 'after', name: 'After Office', time: '18:00', coach: 'María', capacity: 10 },
  { id: 'night', name: 'Noche Suave', time: '20:00', coach: 'Pau', capacity: 6 },
]

// Marcamos qué tan llenas están las clases durante los próximos 6 días.
const AVAILABILITY_BY_DAY = {
  0: { sunrise: 6, core: 8, midday: 11, after: 10, night: 4 },
  1: { sunrise: 8, core: 8, midday: 9, after: 7, night: 6 },
  2: { sunrise: 10, core: 7, midday: 12, after: 9, night: 2 },
  3: { sunrise: 9, core: 5, midday: 12, after: 6, night: 6 },
  4: { sunrise: 6, core: 8, midday: 12, after: 10, night: 5 },
  5: { sunrise: 10, core: 8, midday: 12, after: 4, night: 3 },
}

const formatDayLabel = (date) => new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
}).format(date)

const formatShortDate = (date) => new Intl.DateTimeFormat('es-MX', {
  month: '2-digit',
  day: '2-digit',
}).format(date)

const buildNextSixDays = () => {
  const days = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  while (days.length < 6) {
    const isSunday = cursor.getDay() === 0
    if (!isSunday) {
      days.push({
        index: days.length,
        date: new Date(cursor),
        label: formatDayLabel(cursor),
        shortDate: formatShortDate(cursor),
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

const ClassCard = ({ classInfo, booked, onClick }) => {
  const isFull = booked >= classInfo.capacity
  const remaining = Math.max(classInfo.capacity - booked, 0)
  const chipLabel = isFull ? 'Llena' : `Disponible (${remaining} cupos)`
  const backgroundColor = isFull ? '#f5d6d6' : '#d6f5e4'
  const borderColor = isFull ? '#d32f2f' : '#2e7d32'

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        backgroundColor,
        border: `1px solid ${borderColor}`,
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
        <Typography variant="subtitle1" fontWeight={600}>
          {classInfo.time} · {classInfo.name}
        </Typography>
        <Chip
          size="small"
          label={chipLabel}
          color={isFull ? 'error' : 'success'}
          sx={{ fontWeight: 600 }}
        />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Coach: {classInfo.coach} · Capacidad: {classInfo.capacity}
      </Typography>
    </Box>
  )
}

export default function Ventas() {
  const days = React.useMemo(() => buildNextSixDays(), [])
  const initialBookings = React.useMemo(() => {
    const map = {}
    days.forEach((day) => {
      map[day.index] = {}
      BASE_CLASSES.forEach((cls) => {
        map[day.index][cls.id] = []
      })
    })
    // Ejemplos para ver la lista en acción
    if (map[0]?.sunrise) map[0].sunrise = ['Carla', 'Luis']
    if (map[0]?.after) map[0].after = ['Marta']
    return map
  }, [days])

  const [bookings, setBookings] = React.useState(initialBookings)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedClass, setSelectedClass] = React.useState(null)
  const [newClient, setNewClient] = React.useState('')
  const [selectedDayIndex, setSelectedDayIndex] = React.useState(0)
  const selectedDay = days[selectedDayIndex] ?? days[0]

  const selectedAttendees = React.useMemo(() => {
    if (!selectedClass) return []
    return bookings[selectedClass.dayIndex]?.[selectedClass.classInfo.id] ?? []
  }, [bookings, selectedClass])

  const handleOpenDialog = (dayIndex, classInfo) => {
    setSelectedClass({ dayIndex, classInfo })
    setNewClient('')
    setDialogOpen(true)
  }

  const handleAddClient = () => {
    const name = newClient.trim()
    if (!name || !selectedClass) return
    setBookings((prev) => {
      const existing = prev[selectedClass.dayIndex]?.[selectedClass.classInfo.id] ?? []
      const updatedClass = [...existing, name]
      return {
        ...prev,
        [selectedClass.dayIndex]: {
          ...prev[selectedClass.dayIndex],
          [selectedClass.classInfo.id]: updatedClass,
        },
      }
    })
    setNewClient('')
  }

  const handleDeleteClient = (index) => {
    if (!selectedClass) return
    setBookings((prev) => {
      const existing = prev[selectedClass.dayIndex]?.[selectedClass.classInfo.id] ?? []
      const updatedClass = existing.filter((_, idx) => idx !== index)
      return {
        ...prev,
        [selectedClass.dayIndex]: {
          ...prev[selectedClass.dayIndex],
          [selectedClass.classInfo.id]: updatedClass,
        },
      }
    })
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Calendario de clases
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Reserva tu clase de pilates en los próximos seis días. Verde indica cupos disponibles; rojo indica que la clase está completa.
      </Typography>

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
                Día {selectedDay.index + 1} · {selectedDay.shortDate}
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {selectedDay.label}
              </Typography>
            </Box>

            <Divider />

            <Stack spacing={1.5}>
              {BASE_CLASSES.map((classInfo) => (
                <ClassCard
                  key={classInfo.id}
                  classInfo={classInfo}
                  booked={AVAILABILITY_BY_DAY[selectedDay.index]?.[classInfo.id] ?? 0}
                  onClick={() => handleOpenDialog(selectedDay.index, classInfo)}
                />
              ))}
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
          {selectedClass
            ? `${selectedClass.classInfo.name} · ${selectedClass.classInfo.time}`
            : 'Clase'}
        </DialogTitle>
        <DialogContent dividers>
          {selectedClass && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Día {selectedClass.dayIndex + 1}: {days[selectedClass.dayIndex]?.label}
            </Typography>
          )}

          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Nombre del cliente"
              value={newClient}
              onChange={(e) => setNewClient(e.target.value)}
              size="small"
            />
            <Button variant="contained" onClick={handleAddClient} disabled={!newClient.trim()}>
              Agregar
            </Button>
          </Stack>

          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Clientes en esta clase
          </Typography>
          {selectedAttendees.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Sin clientes aún.
            </Typography>
          ) : (
            <List dense>
              {selectedAttendees.map((client, idx) => (
                <ListItem
                  key={`${client}-${idx}`}
                  secondaryAction={(
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClient(idx)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                >
                  <ListItemText primary={client} />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
