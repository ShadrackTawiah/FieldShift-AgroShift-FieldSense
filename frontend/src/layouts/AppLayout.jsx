
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import './AppLayout.css'

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className={`main-area ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar setMobileOpen={setMobileOpen} />

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppLayout
