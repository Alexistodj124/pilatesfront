import * as React from 'react'
import { Box, Typography } from '@mui/material'

export default function CategoryTile({ label, selected, onClick, icon: Icon }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        width: 80,
        flex: '0 0 auto',
        aspectRatio: '1 / 1',
        borderRadius: 2,
        display: 'grid',
        placeItems: 'center',
        px: 1,
        bgcolor: selected ? 'primary.main' : 'background.paper',
        color: selected ? 'primary.contrastText' : 'text.primary',
        border: (theme) => `1px solid ${selected ? 'transparent' : theme.palette.divider}`,
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
      }}
    >
      <Box sx={{ textAlign: 'center', lineHeight: 1 }}>
        {Icon && <Icon sx={{ fontSize: 26, mb: 0.5 }} />}
        <Typography variant="caption" noWrap>{label}</Typography>
      </Box>
    </Box>
  )
}
