import * as React from 'react'
import { Grid, Typography } from '@mui/material'
import AreaChartIcon from '@mui/icons-material/AreaChart'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import SettingsIcon from '@mui/icons-material/Settings'
import ModuleCard from '../components/ModuleCard'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits'
import MoneyOffIcon from '@mui/icons-material/MoneyOff'
import PortraitIcon from '@mui/icons-material/Portrait';

const modules = [
  { to: '/reportes', title: 'Reportes', icon: AreaChartIcon, subtitle: 'Reportes de Ventas' },
  { to: '/ventas',   title: 'Ventas',    icon: PointOfSaleIcon,      subtitle: 'Modulo de Ventas' },
  { to: '/compras',  title: 'Compras',  icon: ProductionQuantityLimitsIcon,       subtitle: 'Compra de productos' },
  { to: '/clientes',   title: 'Clientes',   icon: PortraitIcon,  subtitle: 'Compras por cliente' },
  // agrega más objetos para más cuadros
]

export default function Home() {
  return (
    <>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Módulos
      </Typography>

      <Grid container spacing={2}>
        {modules.map((m) => (
          <Grid key={m.to} item xs={12} sm={12} md={12} lg={6}>

            <ModuleCard {...m} />
          </Grid>
        ))}
      </Grid>
    </>
  )
}
