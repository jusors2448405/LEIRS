import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

const StatusAdminLayout = ({ user, onLogout }) => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  React.useEffect(() => {
    if (!user || user.role !== 'status_admin') {
      navigate('/')
    }
  }, [user, navigate])

  if (!user) return null

  return (
    <div className="min-h-screen">
      <Sidebar
        role="status_admin"
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:ml-64">
        <Navbar
          user={user}
          onLogout={onLogout}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default StatusAdminLayout
