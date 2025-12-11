// src/router.jsx
import * as React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './ui/AppLayout.jsx'
import Home from './pages/Home.jsx'
import SignIn from './pages/SignIn.jsx'
import NotFound from './pages/NotFound.jsx'
import Ventas from './pages/Ventas.jsx'
import Compras from './pages/Compras.jsx'
import Reportes from './pages/Reportes.jsx'
import Clientes from './pages/Clientes.jsx'
import { RequireAuth, RequireAdmin } from './ProtectedRoutes.jsx'

const router = createBrowserRouter(
  [
    {
      element: <AppLayout />,
      children: [
        {
          index: true,
          element: (
            <RequireAuth>
              <Home />
            </RequireAuth>
          ),
        },
        { path: 'signin', element: <SignIn /> },
        {
          path: 'ventas',
          element: (
            <RequireAuth>
              <Ventas />
            </RequireAuth>
          ),
        },
        {
          path: 'compras',
          element: (
            <RequireAdmin>
              <Compras />
            </RequireAdmin>
          ),
        },
        {
          path: 'reportes',
          element: (
            <RequireAdmin>
              <Reportes />
            </RequireAdmin>
          ),
        },
        {
          path: 'clientes',
          element: (
            <RequireAdmin>
              <Clientes />
            </RequireAdmin>
          ),
        },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  {
    basename: '/marehpilates',
  }
)

export default router

