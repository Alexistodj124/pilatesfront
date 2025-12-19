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
  const [paymentSaving, setPaymentSaving] = React.useState(false)
  const [paymentError, setPaymentError] = React.useState('')
  const [paymentForm, setPaymentForm] = React.useState({ client: null, amount: '' })

  const [openClientDialog, setOpenClientDialog] = React.useState(false)
  const [openPlanDialog, setOpenPlanDialog] = React.useState(false)
  const [openEditDialog, setOpenEditDialog] = React.useState(false)
  const [openPaymentDialog, setOpenPaymentDialog] = React.useState(false)
  const [openMembershipsDialog, setOpenMembershipsDialog] = React.useState(false)
  const [membershipsDialogClient, setMembershipsDialogClient] = React.useState(null)
  const [editTarget, setEditTarget] = React.useState(null)

  const [clientForm, setClientForm] = React.useState({
    nombre: '',
    telefono: '',
    email: '',
    plan_id: '',
    fecha_inicio: dayjs().format('YYYY-MM-DD'),
    estado: 'Activa',
  })

  const [planForm, setPlanForm] = React.useState({
    nombre: '',
    max_clases_por_semana: '',
    max_clases_totales: '',
    duracion_dias: '',
    precio: '',
    activo: true,
  })
  const [newMembershipForm, setNewMembershipForm] = React.useState({
    plan_id: '',
    fecha_inicio: dayjs().format('YYYY-MM-DD'),
    estado: 'Activa',
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
      setNewMembershipForm((prev) => ({ ...prev, plan_id: plansData[0]?.id || '' }))
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
        estado: 'Activa',
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

  const getBalance = React.useCallback((client) => {
    if (!client) return null
    if (typeof client.balance === 'number') return client.balance
    if (typeof client.saldo === 'number') return client.saldo
    return null
  }, [])

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
        planMaxClasesTotales: plan?.max_clases_totales,
        vence: latest ? parseDate(latest.fecha_fin) : null,
        saldoActual: getBalance(client),
        activeMemberships: list.filter((m) => m.estado === 'Activa'),
      }
    })
  }, [clients, membershipByClient, planMap, getBalance])

  const [editClientForm, setEditClientForm] = React.useState({
    id: null,
    nombre: '',
    telefono: '',
    email: '',
    activo: true,
  })

  const [editMembershipForm, setEditMembershipForm] = React.useState({
    id: null,
    plan_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'Activa',
    clases_usadas: 0,
  })

  const handleOpenEdit = (client) => {
    setEditTarget(client)
    setEditClientForm({
      id: client.id,
      nombre: client.nombre || '',
      telefono: client.telefono || '',
      email: client.email || '',
      activo: client.activo ?? true,
    })

    if (client.membership) {
      setEditMembershipForm({
        id: client.membership.id,
        plan_id: client.membership.plan_id,
        fecha_inicio: dayjs(client.membership.fecha_inicio).format('YYYY-MM-DD'),
        fecha_fin: dayjs(client.membership.fecha_fin).format('YYYY-MM-DD'),
        estado: client.membership.estado || 'Activa',
        clases_usadas: client.membership.clases_usadas ?? 0,
      })
    } else {
      setEditMembershipForm({
        id: null,
        plan_id: plans[0]?.id || '',
        fecha_inicio: dayjs().format('YYYY-MM-DD'),
        fecha_fin: dayjs().format('YYYY-MM-DD'),
        estado: 'Activa',
        clases_usadas: 0,
      })
    }
    setOpenEditDialog(true)
  }

  const handleOpenPayment = (client) => {
    const balance = getBalance(client)
    setPaymentError('')
    setPaymentForm({
      client,
      amount: balance && balance > 0 ? balance.toFixed(2) : '',
    })
    setOpenPaymentDialog(true)
  }

  const handleOpenMemberships = (client) => {
    setMembershipsDialogClient(client)
    setNewMembershipForm({
      plan_id: plans[0]?.id || '',
      fecha_inicio: dayjs().format('YYYY-MM-DD'),
      estado: 'Activa',
    })
    setOpenMembershipsDialog(true)
  }

  const handleCreateMembership = async () => {
    if (!membershipsDialogClient || !newMembershipForm.plan_id) {
      setError('Selecciona un plan para crear la membresía')
      return
    }
    try {
      setError('')
      const selectedPlan = plans.find((p) => Number(p.id) === Number(newMembershipForm.plan_id))
      const start = dayjs(newMembershipForm.fecha_inicio)
      const end = selectedPlan?.duracion_dias ? start.add(selectedPlan.duracion_dias, 'day') : start.add(30, 'day')

      const resMembership = await fetch(`${API_BASE_URL}/memberships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: membershipsDialogClient.id,
          plan_id: newMembershipForm.plan_id,
          fecha_inicio: start.format('YYYY-MM-DD'),
          fecha_fin: end.format('YYYY-MM-DD'),
          estado: newMembershipForm.estado,
          clases_usadas: 0,
        }),
      })
      if (!resMembership.ok) throw new Error('No se pudo crear la membresía')

      setOpenMembershipsDialog(false)
      loadData()
    } catch (err) {
      console.error(err)
      setError('No se pudo crear la membresía')
    }
  }

  const handleSubmitPayment = async () => {
    if (!paymentForm.client) return
    const balance = getBalance(paymentForm.client)
    const amountNumber = Number(paymentForm.amount)

    if (!paymentForm.amount || Number.isNaN(amountNumber) || amountNumber <= 0) {
      setPaymentError('Ingresa un monto válido')
      return
    }
    if (balance !== null && amountNumber > balance) {
      setPaymentError('El pago no puede ser mayor al saldo pendiente')
      return
    }

    try {
      setPaymentSaving(true)
      setPaymentError('')
      setError('')

      const paymentPayload = {
        client_id: paymentForm.client.id,
        amount: amountNumber,
        tipo: 'payment',
        nota: 'Pago aplicado a saldo',
      }

      const res = await fetch(`${API_BASE_URL}/account-movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload),
      })
      const contentType = res.headers.get('content-type') || ''
      const text = await res.text()
      let parsedError
      if (contentType.includes('application/json')) {
        try {
          parsedError = JSON.parse(text)
        } catch (parseErr) {
          parsedError = null
        }
      }

      if (!res.ok) {
        const message = parsedError?.error || parsedError?.message || text || 'No se pudo registrar el pago'
        throw new Error(message)
      }

      setOpenPaymentDialog(false)
      setPaymentForm({ client: null, amount: '' })
      loadData()
    } catch (err) {
      setPaymentError('No se pudo registrar el pago')
    } finally {
      setPaymentSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editTarget) return
    try {
      setError('')
      const clientPayload = {
        nombre: editClientForm.nombre,
        telefono: editClientForm.telefono,
        email: editClientForm.email,
        activo: editClientForm.activo,
      }
      const resClient = await fetch(`${API_BASE_URL}/clients/${editClientForm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientPayload),
      })
      if (!resClient.ok) throw new Error('No se pudo actualizar el cliente')

      setOpenEditDialog(false)
      setEditTarget(null)
      loadData()
    } catch (err) {
      console.error(err)
      setError('No se pudo actualizar el cliente')
    }
  }

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
              <TableCell align="right">Membresías activas</TableCell>
              <TableCell align="right">Saldo</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {enhancedClients.map((c) => (
              <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenEdit(c)}>
                <TableCell>{c.nombre}</TableCell>
                <TableCell>{c.telefono}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenMemberships(c)
                    }}
                    color={c.activeMemberships.length === 0 ? 'error' : 'primary'}
                  >
                    {c.activeMemberships.length}
                  </Button>
                </TableCell>
                <TableCell align="right">
                  {(() => {
                    const balance = c.saldoActual
                    const display = balance === null ? '—' : `Q${balance.toFixed(2)}`
                    const isPending = balance !== null && balance > 0
                    return (
                      <Typography color={isPending ? 'error.main' : 'text.primary'} fontWeight={isPending ? 700 : 400}>
                        {display}
                      </Typography>
                    )
                  })()}
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenPayment(c)
                    }}
                    disabled={!c.saldoActual || c.saldoActual <= 0}
                  >
                    Registrar pago
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {enhancedClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
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
              <MenuItem value="Activa">Activa</MenuItem>
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

      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>Registrar pago</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body1" fontWeight={600}>
              Cliente: {paymentForm.client?.nombre || '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Saldo pendiente: {paymentForm.client?.saldoActual != null ? `Q${paymentForm.client.saldoActual.toFixed(2)}` : 'No disponible'}
            </Typography>
            <TextField
              label="Monto a pagar"
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
              error={!!paymentError}
              helperText={paymentError || 'El monto no puede superar el saldo pendiente.'}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)} disabled={paymentSaving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSubmitPayment} disabled={paymentSaving}>
            {paymentSaving ? 'Guardando...' : 'Guardar pago'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openMembershipsDialog} onClose={() => setOpenMembershipsDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Membresías de {membershipsDialogClient?.nombre || ''}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Activas: {membershipsDialogClient?.activeMemberships?.length || 0}
            </Typography>
            <Stack spacing={1}>
              {(membershipByClient[membershipsDialogClient?.id] || [])
                .filter((m) => m.estado === 'Activa')
                .map((m) => {
                const plan = planMap[m.plan_id]
                return (
                  <Paper key={m.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {plan?.nombre || 'Plan'} · {m.estado}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dayjs(m.fecha_inicio).format('YYYY-MM-DD')} → {dayjs(m.fecha_fin).format('YYYY-MM-DD')}
                    </Typography>
                    {typeof m.clases_usadas === 'number' && (
                      <Typography variant="body2" color="text.secondary">
                        Clases usadas: {m.clases_usadas}
                      </Typography>
                    )}
                  </Paper>
                )
              })}
              {(membershipByClient[membershipsDialogClient?.id] || []).filter((m) => m.estado === 'Activa').length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No hay membresías activas para este cliente.
                </Typography>
              )}
            </Stack>
            <Divider />
            <Typography variant="subtitle1" fontWeight={700}>
              Agregar membresía
            </Typography>
            <Stack spacing={2}>
              <TextField
                select
                label="Plan"
                value={newMembershipForm.plan_id}
                onChange={(e) => setNewMembershipForm({ ...newMembershipForm, plan_id: Number(e.target.value) })}
                fullWidth
              >
                {plans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.nombre} · Q{plan.precio}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Fecha inicio"
                type="date"
                value={newMembershipForm.fecha_inicio}
                onChange={(e) => setNewMembershipForm({ ...newMembershipForm, fecha_inicio: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                select
                label="Estado"
                value={newMembershipForm.estado}
                onChange={(e) => setNewMembershipForm({ ...newMembershipForm, estado: e.target.value })}
                fullWidth
              >
                <MenuItem value="Activa">Activa</MenuItem>
                <MenuItem value="En pausa">En pausa</MenuItem>
                <MenuItem value="Vencido">Vencido</MenuItem>
              </TextField>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMembershipsDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateMembership} disabled={!membershipsDialogClient}>
            Guardar membresía
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Editar cliente</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Datos del cliente
            </Typography>
            <TextField
              label="Nombre"
              value={editClientForm.nombre}
              onChange={(e) => setEditClientForm({ ...editClientForm, nombre: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Teléfono"
              value={editClientForm.telefono}
              onChange={(e) => setEditClientForm({ ...editClientForm, telefono: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email"
              value={editClientForm.email}
              onChange={(e) => setEditClientForm({ ...editClientForm, email: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Activa"
              value={editClientForm.activo ? 'true' : 'false'}
              onChange={(e) => setEditClientForm({ ...editClientForm, activo: e.target.value === 'true' })}
              fullWidth
            >
              <MenuItem value="true">Activa</MenuItem>
              <MenuItem value="false">Inactiva</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={!editClientForm.nombre.trim() || !editClientForm.telefono.trim()}
          >
            Guardar cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
