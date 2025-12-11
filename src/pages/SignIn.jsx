// src/pages/SignIn.jsx
import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Avatar, Button, CssBaseline, TextField, Box,
  Typography, Container
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { useAuth } from '../context/AuthContext'

export default function SignIn() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = React.useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const username = data.get('user')
    const password = data.get('password')

    try {
      setError('')
      const user = await login(username, password)
      // si quieres, puedes mandar a ventas o a home:
      navigate('/ventas', { replace: true })
    } catch (err) {
      console.error(err)
      setError('Usuario o contraseña incorrectos')
    }
  }

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <Avatar sx={{ m: 1 }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Iniciar Sesión
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="user"
            label="Usuario"
            name="user"
            autoComplete="user"
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
          />

          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Iniciar Sesión
          </Button>
        </Box>
      </Box>
    </Container>
  )
}
