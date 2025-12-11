import React from 'react'
import {
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material'

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

const buildNextSixDays = () => (
  Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + index)

    return {
      index,
      date,
      label: formatDayLabel(date),
      shortDate: formatShortDate(date),
    }
  })
)

const ClassCard = ({ classInfo, booked }) => {
  const isFull = booked >= classInfo.capacity
  const remaining = Math.max(classInfo.capacity - booked, 0)
  const chipLabel = isFull ? 'Completa' : `Disponible (${remaining} cupos)`
  const backgroundColor = isFull ? '#f5d6d6' : '#d6f5e4'
  const borderColor = isFull ? '#d32f2f' : '#2e7d32'

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        backgroundColor,
        border: `1px solid ${borderColor}`,
      }}
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
        <Typography variant="body2" fontWeight={600}>Completa</Typography>
      </Stack>

      <Grid container spacing={2}>
        {days.map((day) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={day.index}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                backgroundColor: '#f4efe6',
                border: '1px solid #d9cdbb',
                height: '100%',
              }}
            >
              <Stack spacing={1.5} height="100%">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Día {day.index + 1} · {day.shortDate}
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {day.label}
                  </Typography>
                </Box>

                <Divider />

                <Stack spacing={1.5} flexGrow={1}>
                  {BASE_CLASSES.map((classInfo) => (
                    <ClassCard
                      key={classInfo.id}
                      classInfo={classInfo}
                      booked={AVAILABILITY_BY_DAY[day.index]?.[classInfo.id] ?? 0}
                    />
                  ))}
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
