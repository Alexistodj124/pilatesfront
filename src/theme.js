// src/theme.js
import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#e0dacb', // beige para el fondo general
      paper: '#e0dacb',   // opcional: para Papers, cards, etc.
    },
  },
})

export default theme
