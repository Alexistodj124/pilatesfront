// src/context/AuthContext.jsx
import * as React from 'react'
import { API_BASE_URL } from '../config/api'

const AuthContext = React.createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(() => {
    try {
      const stored = localStorage.getItem('kiara_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // 🟢 login: llama a tu /auth/login
  const login = async (username, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Error en login:', errText)
      throw new Error('Credenciales inválidas')
    }

    const data = await res.json()
    // data: { id, username, is_admin }
    setUser(data)
    localStorage.setItem('kiara_user', JSON.stringify(data))
    return data
  }

  // 🔴 logout
  const logout = () => {
    setUser(null)
    localStorage.removeItem('kiara_user')
  }

  const value = {
    user,
    isAdmin: !!user?.is_admin,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar en cualquier componente
export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}
