
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CloudSun,
  Satellite,
  Sprout,
  Layers3,
  Map,
  GitCompareArrows,
  FileChartColumn,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  UserRound,
  Tractor,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'

const navigation = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'FARM INTELLIGENCE',
    items: [
      { name: 'Climate Insights', path: '/dashboard/climate', icon: CloudSun },
      { name: 'Earth Observation', path: '/dashboard/earth-observation', icon: Satellite },
      { name: 'Soil Intelligence', path: '/dashboard/soil', icon: Layers3 },
      { name: 'Farm Management', path: '/dashboard/farms', icon: Tractor },
      { name: 'Farm Mapping', path: '/dashboard/mapping', icon: Map },
    ],
  },
  {
    title: 'DECISION SUPPORT',
    items: [
      { name: 'Crop Rotation', path: '/dashboard/crop-rotation', icon: Sprout },
      { name: 'Compare Strategies', path: '/dashboard/comparison', icon: GitCompareArrows },
      { name: 'Reports', path: '/dashboard/reports', icon: FileChartColumn },
    ],
  },
]

function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, profile } = useAuth()

  const farmerName =
    profile?.full_name || user?.email?.split('@')[0] || 'Farmer'

  const profileImage = profile?.profile_image_url

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* BRAND */}
        <div className="sidebar-brand">
          <div className="brand-icon">
            <img
              src="/images/fieldshift-hero.jpg"
              alt="FieldShift Logo"
              className="sidebar-logo"
            />
          </div>

          {!collapsed && (
            <div className="brand-text">
              <h2>FieldShift</h2>
              <span>AGROSHIFT FIELDSENSE</span>
            </div>
          )}

          <button
            className="sidebar-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="sidebar-content">
          {navigation.map((group) => (
            <div className="nav-group" key={group.title}>
              {!collapsed && (
                <p className="nav-heading">{group.title}</p>
              )}

              {group.items.map(({ name, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  end
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? name : ''}
                >
                  <Icon size={19} />
                  {!collapsed && <span>{name}</span>}
                </NavLink>
              ))}
            </div>
          ))}

          {/* FARMER ACCOUNT */}
          <div className="nav-group">
            {!collapsed && (
              <p className="nav-heading">FARMER ACCOUNT</p>
            )}

            <NavLink
              to="/dashboard/farmer-profile"
              end
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
              title={collapsed ? 'My Farmer Profile' : ''}
            >
              <div className="sidebar-profile-avatar">
                {profileImage ? (
                  <img src={profileImage} alt="Farmer profile" />
                ) : (
                  <UserRound size={19} />
                )}
              </div>

              {!collapsed && <span>My Farmer Profile</span>}
            </NavLink>
          </div>
        </div>

        {/* SIDEBAR BOTTOM */}
        <div className="sidebar-bottom">
          <NavLink
            to="/dashboard/settings"
            end
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
            onClick={() => setMobileOpen(false)}
            title={collapsed ? 'Settings' : ''}
          >
            <Settings size={19} />
            {!collapsed && <span>Settings</span>}
          </NavLink>

          {/* FARMER USER CARD */}
          <NavLink
            to="/dashboard/farmer-profile"
            className={`sidebar-user-card ${collapsed ? 'sidebar-user-card-collapsed' : ''}`}
            onClick={() => setMobileOpen(false)}
            title={collapsed ? farmerName : ''}
          >
            <div className="sidebar-user-image">
              {profileImage ? (
                <img src={profileImage} alt="Farmer profile" />
              ) : (
                <UserRound size={20} />
              )}
            </div>

            {!collapsed && (
              <div className="sidebar-user-details">
                <strong>{farmerName}</strong>
                <span>Farmer Account</span>
              </div>
            )}
          </NavLink>

          {/* FOOTER */}
          <div className="sidebar-footer">
            {!collapsed && (
              <>
                <span>POWERED BY NASA EARTH DATA</span>
                <p>Field intelligence for a better tomorrow.</p>
              </>
            )}
          </div>
        </div>

        {/* COLLAPSE BUTTON */}
        <button
          className="collapse-button"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>
      </aside>
    </>
  )
}

export default Sidebar
