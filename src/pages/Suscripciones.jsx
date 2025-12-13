import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
} from '@mui/material'
import dayjs from 'dayjs'

const initialPlans = [
  { id: 1, nombre: 'Mensual', max_clases_por_semana: 4, max_clases_totales: null, duracion_dias: 30, precio: 350, activo: true },
  { id: 2, nombre: 'Trimestral', max_clases_por_semana: 5, max_clases_totales: null, duracion_dias: 90, precio: 900, activo: true },
  { id: 3, nombre: 'Paquete 10 clases', max_clases_por_semana: null, max_clases_totales: 10, duracion_dias: 60, precio: 500, activo: true },
]

const initialClients = [
  {
    id: 1,
    nombre: 'Carla Pérez',
    telefono: '5555-1111',
    email: 'carla@example.com',
    activo: true,
    membership: {
      plan_id: 1,
      fecha_inicio: dayjs().subtract(5, 'day'),
      fecha_fin: dayjs().add(25, 'day'),
      estado: 'Activo',
      clases_usadas: 2,
    },
  },
  {
    id: 2,
    nombre: 'Luis Gómez',
    telefono: '5555-2222',
    email: 'luis@example.com',
    activo: true,
    membership: {
      plan_id: 3,
      fecha_inicio: dayjs().subtract(10, 'day'),
      fecha_fin: dayjs().add(50, 'day'),
      estado: 'Activo',
      clases_usadas: 4,
    },
  },
  {
    id: 3,
    nombre: 'Marta Ruiz',
    telefono: '5555-3333',
    email: 'marta@example.com',
    activo: false,
    membership: {
      plan_id: 2,
      fecha_inicio: dayjs().subtract(80, 'day'),
      fecha_fin: dayjs().add(10, 'day'),
      estado: 'En pausa',
      clases_usadas: 6,
    },
  },
]

export default function Suscripciones() {
  const [plans, setPlans] = React.useState(initialPlans)
  const [clients, setClients] = React.useState(initialClients)
  const [openClientDialog, setOpenClientDialog] = React.useState(false)
  const [openPlanDialog, setOpenPlanDialog] = React.useState(false)

  const [clientForm, setClientForm] = React.useState({
    nombre: '',
    telefono: '',
    email: '',
    plan_id: 1,
    fecha_inicio: dayjs().format('YYYY-MM-DD'),
    estado: 'Activo',
  })

  const [planForm, setPlanForm] = React.useState({
    nombre: '',
    max_clases_por_semana: '',
    max_clases_totales: '',
    duracion_dias: '',
    precio: '',
    activo: true,
  })

  const resetClientForm = () => {
    setClientForm({
      nombre: '',
      telefono: '',
      email: '',
      plan_id: plans[0]?.id || '',
      fecha_inicio: dayjs().format('YYYY-MM-DD'),
      estado: 'Activo',
    })
  }

  const handleSavePlan = () => {
    const newId = plans.length ? Math.max(...plans.map(p => p.id)) + 1 : 1
    const newPlan = {
      ...planForm,
      id: newId,
      max_clases_por_semana: planForm.max_clases_por_semana ? Number(planForm.max_clases_por_semana) : null,
      max_clases_totales: planForm.max_clases_totales ? Number(planForm.max_clases_totales) : null,
      duracion_dias: planForm.duracion_dias ? Number(planForm.duracion_dias) : null,
      precio: planForm.precio ? Number(planForm.precio) : 0,
      activo: true,
    }
    setPlans((prev) => [...prev, newPlan])
    setPlanForm({
      nombre: '',
      max_clases_por_semana: '',
      max_clases_totales: '',
      duracion_dias: '',
      precio: '',
      activo: true,
    })
    setOpenPlanDialog(false)
    setClientForm((prev) => ({ ...prev, plan_id: newId }))
  }

  const handleSaveClient = () => {
    const plan = plans.find(p => p.id === Number(clientForm.plan_id))
    if (!plan) return

    const start = dayjs(clientForm.fecha_inicio)
    const end = plan.duracion_dias ? start.add(plan.duracion_dias, 'day') : start.add(30, 'day')

    const newClient = {
      id: clients.length ? Math.max(...clients.map(c => c.id)) + 1 : 1,
      nombre: clientForm.nombre,
      telefono: clientForm.telefono,
      email: clientForm.email,
      activo: true,
      membership: {
        plan_id: plan.id,
        fecha_inicio: start,
        fecha_fin: end,
        estado: clientForm.estado,
        clases_usadas: 0,
      },
    }

    setClients((prev) => [...prev, newClient])
    setOpenClientDialog(false)
    resetClientForm()
  }

  const enhancedClients = React.useMemo(() => {
    return clients.map((client) => {
      const plan = plans.find(p => p.id === client.membership.plan_id)
      return {
        ...client,
        planName: plan?.nombre || '—',
        planPrice: plan?.precio,
        vence: client.membership.fecha_fin,
      }
    })
  }, [clients, plans])

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Suscripciones
        </Typography>
        <Button variant="contained" onClick={() => setOpenClientDialog(true)}>
          Agregar cliente
        </Button>
      </Stack>

      <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Planes de membresía
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {plans.map((plan) => (
            <Chip
              key={plan.id}
              label={`${plan.nombre} · Q${plan.precio}`}
              color={plan.activo ? 'success' : 'default'}
              sx={{ mb: 1 }}
            />
          ))}
          <Button size="small" variant="outlined" onClick={() => setOpenPlanDialog(true)}>
            Nuevo plan
          </Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Vence</TableCell>
              <TableCell align="right">Clases usadas</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {enhancedClients.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>{c.nombre}</TableCell>
                <TableCell>{c.telefono}</TableCell>
                <TableCell>{c.planName}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={c.membership.estado}
                    color={c.membership.estado === 'Activo' ? 'success' : 'warning'}
                    variant={c.membership.estado === 'Activo' ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>{dayjs(c.vence).format('YYYY-MM-DD')}</TableCell>
                <TableCell align="right">{c.membership.clases_usadas}</TableCell>
              </TableRow>
            ))}
            {enhancedClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">
                    No hay clientes con suscripción aún.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openClientDialog} onClose={() => setOpenClientDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nueva suscripción</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Nombre"
              value={clientForm.nombre}
              onChange={(e) => setClientForm({ ...clientForm, nombre: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Teléfono"
              value={clientForm.telefono}
              onChange={(e) => setClientForm({ ...clientForm, telefono: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email"
              value={clientForm.email}
              onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
              fullWidth
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                select
                label="Plan"
                value={clientForm.plan_id}
                onChange={(e) => setClientForm({ ...clientForm, plan_id: Number(e.target.value) })}
                fullWidth
              >
                {plans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.nombre} · Q{plan.precio}
                  </MenuItem>
                ))}
              </TextField>
              <Button variant="outlined" onClick={() => setOpenPlanDialog(true)}>
                Nuevo plan
              </Button>
            </Stack>
            <TextField
              label="Fecha inicio"
              type="date"
              value={clientForm.fecha_inicio}
              onChange={(e) => setClientForm({ ...clientForm, fecha_inicio: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              select
              label="Estado"
              value={clientForm.estado}
              onChange={(e) => setClientForm({ ...clientForm, estado: e.target.value })}
              fullWidth
            >
              <MenuItem value="Activo">Activo</MenuItem>
              <MenuItem value="En pausa">En pausa</MenuItem>
              <MenuItem value="Vencido">Vencido</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClientDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveClient}
            disabled={!clientForm.nombre.trim() || !clientForm.telefono.trim()}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPlanDialog} onClose={() => setOpenPlanDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nuevo plan de membresía</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Nombre"
              value={planForm.nombre}
              onChange={(e) => setPlanForm({ ...planForm, nombre: e.target.value })}
              fullWidth
              required
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Máx. clases por semana"
                type="number"
                value={planForm.max_clases_por_semana}
                onChange={(e) => setPlanForm({ ...planForm, max_clases_por_semana: e.target.value })}
                fullWidth
              />
              <TextField
                label="Máx. clases totales"
                type="number"
                value={planForm.max_clases_totales}
                onChange={(e) => setPlanForm({ ...planForm, max_clases_totales: e.target.value })}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Duración (días)"
                type="number"
                value={planForm.duracion_dias}
                onChange={(e) => setPlanForm({ ...planForm, duracion_dias: e.target.value })}
                fullWidth
              />
              <TextField
                label="Precio"
                type="number"
                value={planForm.precio}
                onChange={(e) => setPlanForm({ ...planForm, precio: e.target.value })}
                fullWidth
              />
            </Stack>
            <Divider />
            <Typography variant="body2" color="text.secondary">
              Los planes se crean localmente para demo; el backend aún no está conectado.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPlanDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSavePlan}
            disabled={!planForm.nombre.trim() || !planForm.precio}
          >
            Guardar plan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
