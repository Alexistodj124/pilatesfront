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
  ListItemIcon,
  Divider,
} from '@mui/material'

const CLASSES = [
  { id: 'sunrise', name: 'Amanecer Power', time: '06:00', coach: 'Ana' },
  { id: 'core', name: 'Fuerza y Core', time: '08:00', coach: 'Julia' },
  { id: 'midday', name: 'Almuerzo Flow', time: '12:30', coach: 'Laura' },
  { id: 'after', name: 'After Office', time: '18:00', coach: 'María' },
  { id: 'night', name: 'Noche Suave', time: '20:00', coach: 'Pau' },
]

// Reservas ficticias por clase para demo
const MOCK_RESERVATIONS = {
  sunrise: ['Carla Pérez', 'Luis Gómez', 'Ana Martínez'],
  core: ['María López', 'Lucía Herrera'],
  midday: ['Paty Soto', 'Luis Gómez'],
  after: ['Marta Ruiz', 'Paola Díaz', 'María López'],
  night: ['Sofía Méndez'],
}

export default function Asistencias() {
  const [selectedClass, setSelectedClass] = React.useState(CLASSES[0].id)
  const [attendance, setAttendance] = React.useState(() => {
    const initial = {}
    Object.entries(MOCK_RESERVATIONS).forEach(([classId, clients]) => {
      initial[classId] = clients.map(() => false)
    })
    return initial
  })

  const handleToggle = (index) => {
    setAttendance((prev) => ({
      ...prev,
      [selectedClass]: prev[selectedClass].map((val, idx) => (idx === index ? !val : val)),
    }))
  }

  const reservations = MOCK_RESERVATIONS[selectedClass] || []
  const classInfo = CLASSES.find((c) => c.id === selectedClass)

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Asistencias
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Selecciona una clase para marcar asistencia de los clientes reservados.
      </Typography>

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
              value={selectedClass}
              label="Clase"
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {CLASSES.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.time} · {cls.name} ({cls.coach})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />

          <Typography variant="subtitle1" fontWeight={700}>
            {classInfo ? `${classInfo.time} · ${classInfo.name}` : 'Clase'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reservas: {reservations.length}
          </Typography>

          {reservations.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay clientes reservados para esta clase.
            </Typography>
          ) : (
            <List dense>
              {reservations.map((client, idx) => (
                <ListItem
                  key={`${client}-${idx}`}
                  secondaryAction={(
                    <Checkbox
                      edge="end"
                      checked={attendance[selectedClass]?.[idx] || false}
                      onChange={() => handleToggle(idx)}
                    />
                  )}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={attendance[selectedClass]?.[idx] || false}
                      onChange={() => handleToggle(idx)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText primary={client} />
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      </Paper>
    </Box>
  )
}
