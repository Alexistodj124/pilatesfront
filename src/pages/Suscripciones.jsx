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
  Alert,
} from '@mui/material'
import dayjs from 'dayjs'
import { API_BASE_URL } from '../config/api'

const parseDate = (value) => (value ? dayjs(value) : null)

export default function Suscripciones() {
  const [plans, setPlans] = React.useState([])
  const [clients, setClients] = React.useState([])
  const [memberships, setMemberships] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const [openClientDialog, setOpenClientDialog] = React.useState(false)
  const [openPlanDialog, setOpenPlanDialog] = React.useState(false)

  const [clientForm, setClientForm] = React.useState({
    nombre: '',
    telefono: '',
    email: '',
    plan_id: '',
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

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [plansRes, clientsRes, membershipsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/membership-plans`),
        fetch(`${API_BASE_URL}/clients`),
        fetch(`${API_BASE_URL}/memberships`),
      ])

      if (!plansRes.ok || !clientsRes.ok || !membershipsRes.ok) {
        throw new Error('Error al cargar datos de suscripciones')
      }

      const [plansData, clientsData, membershipsData] = await Promise.all([
        plansRes.json(),
        clientsRes.json(),
        membershipsRes.json(),
      ])

      setPlans(plansData)
      setClients(clientsData)
      setMemberships(membershipsData)

      setClientForm((prev) => ({
        ...prev,
        plan_id: plansData[0]?.id || '',
      }))
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar datos de suscripciones')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleSavePlan = async () => {
    try {
      const payload = {
        nombre: planForm.nombre,
        max_clases_por_semana: planForm.max_clases_por_semana ? Number(planForm.max_clases_por_semana) : null,
        max_clases_totales: planForm.max_clases_totales ? Number(planForm.max_clases_totales) : null,
        duracion_dias: planForm.duracion_dias ? Number(planForm.duracion_dias) : null,
        precio: planForm.precio ? Number(planForm.precio) : 0,
        activo: true,
      }

      const res = await fetch(`${API_BASE_URL}/membership-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('No se pudo crear el plan')
      const data = await res.json()
      setOpenPlanDialog(false)
      setPlanForm({
        nombre: '',
        max_clases_por_semana: '',
        max_clases_totales: '',
        duracion_dias: '',
        precio: '',
        activo: true,
      })
      setClientForm((prev) => ({ ...prev, plan_id: data.id }))
      loadData()
    } catch (err) {
      console.error(err)
      setError('No se pudo crear el plan')
    }
  }

  const handleSaveClient = async () => {
    try {
      setError('')
      const resClient = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: clientForm.nombre,
          telefono: clientForm.telefono,
          email: clientForm.email,
          activo: true,
        }),
      })
      if (!resClient.ok) throw new Error('No se pudo crear el cliente')
      const clientData = await resClient.json()

      const selectedPlan = plans.find((p) => Number(p.id) === Number(clientForm.plan_id))
      const start = dayjs(clientForm.fecha_inicio)
      const end = selectedPlan?.duracion_dias ? start.add(selectedPlan.duracion_dias, 'day') : start.add(30, 'day')

      const resMembership = await fetch(`${API_BASE_URL}/memberships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientData.id,
          plan_id: clientForm.plan_id,
          fecha_inicio: start.format('YYYY-MM-DD'),
          fecha_fin: end.format('YYYY-MM-DD'),
          estado: clientForm.estado,
          clases_usadas: 0,
        }),
      })
      if (!resMembership.ok) throw new Error('No se pudo crear la membresía')

      setOpenClientDialog(false)
      setClientForm({
        nombre: '',
        telefono: '',
        email: '',
        plan_id: plans[0]?.id || '',
        fecha_inicio: dayjs().format('YYYY-MM-DD'),
        estado: 'Activo',
      })
      loadData()
    } catch (err) {
      console.error(err)
      setError('No se pudo crear el cliente o su membresía')
    }
  }

  const planMap = React.useMemo(() => {
    const map = {}
    plans.forEach((p) => {
      map[p.id] = p
    })
    return map
  }, [plans])

  const membershipByClient = React.useMemo(() => {
    const map = {}
    memberships.forEach((m) => {
      if (!map[m.client_id]) map[m.client_id] = []
      map[m.client_id].push(m)
    })
    return map
  }, [memberships])

  const enhancedClients = React.useMemo(() => {
    return clients.map((client) => {
      const list = membershipByClient[client.id] || []
      const latest = list
        .slice()
        .sort((a, b) => dayjs(b.fecha_fin).valueOf() - dayjs(a.fecha_fin).valueOf())[0]

      const plan = latest ? planMap[latest.plan_id] : null
      return {
        ...client,
        membership: latest,
        planName: plan?.nombre || '—',
        planPrice: plan?.precio,
        vence: latest ? parseDate(latest.fecha_fin) : null,
      }
    })
  }, [clients, membershipByClient, planMap])

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Suscripciones
        </Typography>
        <Button variant="contained" onClick={() => setOpenClientDialog(true)} disabled={plans.length === 0}>
          Agregar cliente
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
                  {c.membership ? (
                    <Chip
                      size="small"
                      label={c.membership.estado}
                      color={c.membership.estado === 'Activo' ? 'success' : 'warning'}
                      variant={c.membership.estado === 'Activo' ? 'filled' : 'outlined'}
                    />
                  ) : (
                    <Chip size="small" label="Sin membresía" variant="outlined" />
                  )}
                </TableCell>
                <TableCell>{c.vence ? c.vence.format('YYYY-MM-DD') : '—'}</TableCell>
                <TableCell align="right">{c.membership?.clases_usadas ?? '—'}</TableCell>
              </TableRow>
            ))}
            {enhancedClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">
                    {loading ? 'Cargando...' : 'No hay clientes con suscripción aún.'}
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
              Los planes se crean usando la API ya conectada.
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
