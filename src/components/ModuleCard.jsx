import * as React from 'react'
import { Card, CardActionArea, Box, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function ModuleCard({ to, title, icon: Icon, subtitle }) {
  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
      }}
    >
      <CardActionArea component={RouterLink} to={to}>
        {/* Contenedor alto (responsivo) */}
        <Box
          sx={{
            height: { xs: 160, sm: 200, md: 240, lg: 280 }, // ↑ hazlos más grandes aquí
            display: 'grid',
            placeItems: 'center',
            p: { xs: 2, md: 3 },
            bgcolor: 'background.paper',
          }}
        >

          <Box sx={{ textAlign: 'center' }}>
            {Icon && <Icon sx={{ fontSize: 48, mb: 1 }} />}
            <Typography variant="h6">{title}</Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  )
}
