// src/auth.js
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('usuario')
    if (!raw) return null
    return JSON.parse(raw)         // { id, username, is_admin }
  } catch (e) {
    console.error('Error leyendo usuario de localStorage', e)
    return null
  }
}
