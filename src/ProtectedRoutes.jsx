// src/ProtectedRoutes.jsx
import * as React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Solo requiere estar logueado
export function RequireAuth({ children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    // si no hay usuario -> manda a /signin
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  return children
}

// Requiere ser admin
export function RequireAdmin({ children }) {
  const { user, isAdmin } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    // logueado pero NO admin -> lo mandamos al POS (ventas)
    return <Navigate to="/ventas" replace />
  }

  return children
}
