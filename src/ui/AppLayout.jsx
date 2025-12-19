// src/ui/AppLayout.jsx
import * as React from 'react'
import { Outlet, Link as RouterLink, useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useAuth } from '../context/AuthContext'

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [anchorAgenda, setAnchorAgenda] = React.useState(null)
  const [anchorOps, setAnchorOps] = React.useState(null)

  const handleOpenAgenda = (event) => setAnchorAgenda(event.currentTarget)
  const handleOpenOps = (event) => setAnchorOps(event.currentTarget)
  const handleCloseAgenda = () => setAnchorAgenda(null)
  const handleCloseOps = () => setAnchorOps(null)

  const handleLogout = () => {
    logout()                               // limpia contexto + localStorage
    navigate('/signin', { replace: true }) // manda al login
  }

  return (
    <>
      <AppBar
        position="static"
        sx={{ backgroundColor: '#e0dacb', color: 'black' }}
      >
        <Toolbar>
          <Typography sx={{ flexGrow: 1 }} variant="h6">
            Mar'he Pilates
          </Typography>

          {/* Navegación solo si está logueado */}
          {user && (
            <>
              <Button color="inherit" component={RouterLink} to="/">
                Inicio
              </Button>
              <Button color="inherit" onClick={handleOpenAgenda}>
                Clases ▾
              </Button>
              <Menu
                anchorEl={anchorAgenda}
                open={Boolean(anchorAgenda)}
                onClose={handleCloseAgenda}
              >
                <MenuItem component={RouterLink} to="/reservas" onClick={handleCloseAgenda}>
                  Calendario
                </MenuItem>
                <MenuItem component={RouterLink} to="/asistencias" onClick={handleCloseAgenda}>
                  Asistencias
                </MenuItem>
                {isAdmin && (
                  <MenuItem component={RouterLink} to="/suscripciones" onClick={handleCloseAgenda}>
                    Suscripciones
                  </MenuItem>
                )}
                {isAdmin && (
                  <MenuItem component={RouterLink} to="/reportesclases" onClick={handleCloseOps}>
                    Reportes
                  </MenuItem>
                )}
              </Menu>

              <Button color="inherit" onClick={handleOpenOps}>
                Productos ▾
              </Button>
              <Menu
                anchorEl={anchorOps}
                open={Boolean(anchorOps)}
                onClose={handleCloseOps}
              >
                <MenuItem component={RouterLink} to="/ventas" onClick={handleCloseOps}>
                  Ventas
                </MenuItem>
                {isAdmin && (
                  <MenuItem component={RouterLink} to="/compras" onClick={handleCloseOps}>
                    Compras
                  </MenuItem>
                )}
                {isAdmin && (
                  <MenuItem component={RouterLink} to="/clientes" onClick={handleCloseOps}>
                    Clientes
                  </MenuItem>
                )}
                {isAdmin && (
                  <MenuItem component={RouterLink} to="/reportes" onClick={handleCloseOps}>
                    Reportes
                  </MenuItem>
                )}
              </Menu>
              

              {/* Mostrar usuario + Logout */}
              <Typography
                variant="body2"
                sx={{ mx: 2, fontWeight: 500 }}
              >
                {user.username}
              </Typography>

              <Button
                color="inherit"
                onClick={handleLogout}
              >
                Cerrar sesión
              </Button>
            </>
          )}

          {/* Si quisieras que en algún caso se vea el botón de login:
          {!user && (
            <Button color="inherit" component={RouterLink} to="/signin">
              Sign in
            </Button>
          )} */}
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </>
  )
}
