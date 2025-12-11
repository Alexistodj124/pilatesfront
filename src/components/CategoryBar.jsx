import * as React from 'react'
import { Box, Stack } from '@mui/material'
import CategoryTile from './CategoryTile'

// Puedes pasar icons desde @mui/icons-material por props si quieres
export default function CategoryBar({ categories, selected, onSelect }) {
  return (
    <Box sx={{ overflowX: 'auto', pb: 1, mb: 2 }}>
      <Stack direction="row" spacing={1.5} sx={{ minWidth: '100%', pr: 1 }}>
        {categories.map((c) => (
          <CategoryTile
            key={c.id}
            label={c.label}
            icon={c.icon}
            selected={selected === c.id}
            onClick={() => onSelect(c.id)}
          />
        ))}
      </Stack>
    </Box>
  )
}
