import * as React from 'react'
import { Grid, Typography } from '@mui/material'
import AreaChartIcon from '@mui/icons-material/AreaChart'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import SettingsIcon from '@mui/icons-material/Settings'
import ModuleCard from '../components/ModuleCard'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits'
import MoneyOffIcon from '@mui/icons-material/MoneyOff'
import PortraitIcon from '@mui/icons-material/Portrait'
import EventIcon from '@mui/icons-material/Event'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CardMembershipIcon from '@mui/icons-material/CardMembership'
import AssessmentIcon from '@mui/icons-material/Assessment'

const modules = [
  { to: '/reportes', title: 'Reportes', icon: AreaChartIcon, subtitle: 'Reportes de Ventas' },
  { to: '/ventas',   title: 'Ventas',    icon: PointOfSaleIcon,      subtitle: 'Modulo de Ventas' },
  { to: '/compras',  title: 'Compras',  icon: ProductionQuantityLimitsIcon,       subtitle: 'Compra de productos' },
  { to: '/clientes',   title: 'Clientes',   icon: PortraitIcon,  subtitle: 'Compras por cliente' },
  { to: '/reservas', title: 'Calendario de clases', icon: EventIcon, subtitle: 'Agenda y reservas' },
  { to: '/asistencias', title: 'Asistencias', icon: CheckCircleIcon, subtitle: 'Registro de asistencia' },
  { to: '/suscripciones', title: 'Suscripciones', icon: CardMembershipIcon, subtitle: 'Planes y membresías' },
  { to: '/reportesclases', title: 'Reportes de clases', icon: AssessmentIcon, subtitle: 'Estadísticas de clases' },
  // agrega más objetos para más cuadros
]

export default function Home() {
  return (
    <>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Módulos
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Clases
          </Typography>
          <Grid container spacing={2}>
            {modules.filter(m => m.to === '/reservas' || m.to === '/asistencias' || m.to === '/suscripciones' || m.to === '/reportesclases').map((m) => (
              <Grid key={m.to} item xs={12}>
                <ModuleCard {...m} />
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Productos
          </Typography>
          <Grid container spacing={2}>
            {modules.filter(m => m.to === '/reportes' || m.to === '/ventas' || m.to === '/compras' || m.to === '/clientes').map((m) => (
              <Grid key={m.to} item xs={12}>
                <ModuleCard {...m} />
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </>
  )
}
