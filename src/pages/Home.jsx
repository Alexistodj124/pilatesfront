import * as React from 'react'
import { Box, Grid, Typography } from '@mui/material'
import AreaChartIcon from '@mui/icons-material/AreaChart'
import ModuleCard from '../components/ModuleCard'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits'
import PortraitIcon from '@mui/icons-material/Portrait'
import EventIcon from '@mui/icons-material/Event'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CardMembershipIcon from '@mui/icons-material/CardMembership'
import AssessmentIcon from '@mui/icons-material/Assessment'

const sections = [
  {
    title: 'Clases',
    items: [
      { to: '/reservas', title: 'Calendario de clases', icon: EventIcon, subtitle: 'Agenda y reservas' },
      { to: '/asistencias', title: 'Asistencias', icon: CheckCircleIcon, subtitle: 'Registro de asistencia' },
      { to: '/suscripciones', title: 'Suscripciones', icon: CardMembershipIcon, subtitle: 'Planes y membresías' },
      { to: '/reportesclases', title: 'Reportes de clases', icon: AssessmentIcon, subtitle: 'Estadísticas de clases' },
    ],
  },
  {
    title: 'Productos',
    items: [
      { to: '/reportes', title: 'Reportes', icon: AreaChartIcon, subtitle: 'Reportes de Ventas' },
      { to: '/ventas',   title: 'Ventas',    icon: PointOfSaleIcon,      subtitle: 'Modulo de Ventas' },
      { to: '/compras',  title: 'Compras',  icon: ProductionQuantityLimitsIcon,       subtitle: 'Compra de productos' },
      { to: '/clientes',   title: 'Clientes',   icon: PortraitIcon,  subtitle: 'Compras por cliente' },
    ],
  },
]

export default function Home() {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #f1e9dd 0%, #d8cbb8 100%)',
        p: { xs: 2, md: 3 },
        borderRadius: 4,
      }}
    >
      <Box
        sx={{
          backgroundColor: 'rgba(255,255,255,0.8)',
          borderRadius: 3,
          p: { xs: 2, md: 3 },
          mb: 3,
          boxShadow: '0 12px 35px rgba(0,0,0,0.08)',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Bienvenida, Mar&apos;he Pilates
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Administra tus clases, membresías y operaciones desde un solo lugar.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {sections.map((section) => (
          <Grid item xs={12} key={section.title}>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.9)',
                boxShadow: '0 8px 28px rgba(0,0,0,0.06)',
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
                {section.title}
              </Typography>
              <Grid container spacing={2}>
                {section.items.map((m) => (
                  <Grid key={m.to} item xs={12} sm={6} md={3}>
                    <Box sx={{ height: '100%' }}>
                      <ModuleCard {...m} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
