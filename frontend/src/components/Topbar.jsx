
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  UserRound,
  LogOut,
  X,
  ArrowRight,
} from 'lucide-react'

import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import './Topbar.css'

const pages = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    keywords: 'home overview summary',
  },
  {
    title: 'Climate Insights',
    path: '/dashboard/climate',
    keywords: 'weather rainfall temperature humidity climate',
  },
  {
    title: 'Earth Observation',
    path: '/dashboard/earth-observation',
    keywords: 'satellite vegetation land earth observation',
  },
  {
    title: 'Soil Intelligence',
    path: '/dashboard/soil',
    keywords: 'soil ph nutrients fertility laboratory test',
  },
  {
    title: 'Farm Management',
    path: '/dashboard/farms',
    keywords: 'farms farm records manage agriculture',
  },
  {
    title: 'Farm Mapping',
    path: '/dashboard/mapping',
    keywords: 'map location coordinates gps',
  },
  {
    title: 'Crop Rotation',
    path: '/dashboard/crop-rotation',
    keywords: 'crops rotation planting seasons',
  },
  {
    title: 'Compare Strategies',
    path: '/dashboard/comparison',
    keywords: 'compare strategies farming decisions',
  },
  {
    title: 'Reports',
    path: '/dashboard/reports',
    keywords: 'reports download pdf farm summary',
  },
  {
    title: 'Settings',
    path: '/dashboard/settings',
    keywords: 'settings preferences account',
  },
  {
    title: 'My Farmer Profile',
    path: '/dashboard/farmer-profile',
    keywords: 'profile personal information farmer',
  },
]

const pageTitles = Object.fromEntries(
  pages.map((page) => [page.path, page.title])
)

function Topbar({ setMobileOpen }) {
  const location = useLocation()
  const navigate = useNavigate()

  const { user, profile, logoutFarmer } = useAuth()

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const searchRef = useRef(null)
  const searchContainerRef = useRef(null)
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  const title = pageTitles[location.pathname] || 'FieldShift'

  const farmerName =
    profile?.full_name ||
    user?.email?.split('@')[0] ||
    'Farmer'

  const profileImage = profile?.profile_image_url

  const searchResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    if (!query) return pages.slice(0, 5)

    return pages.filter((page) => {
      const searchableText =
        `${page.title} ${page.path} ${page.keywords}`.toLowerCase()

      return searchableText.includes(query)
    })
  }, [searchTerm])

  function openSearch() {
    setSearchOpen(true)
    setNotificationsOpen(false)
    setProfileMenuOpen(false)
  }

  function closeSearch() {
    setSearchOpen(false)
    setSearchTerm('')
  }

  function goToPage(path) {
    navigate(path)
    closeSearch()
    setNotificationsOpen(false)
    setProfileMenuOpen(false)
  }

  function handleSearchSubmit(event) {
    event.preventDefault()

    if (searchResults.length > 0) {
      goToPage(searchResults[0].path)
    }
  }

  async function handleLogout() {
    if (loggingOut) return

    try {
      setLoggingOut(true)
      await logoutFarmer()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
      alert(error.message || 'Unable to log out. Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

  // Focus search input when the search panel opens.
  useEffect(() => {
    if (searchOpen) {
      searchRef.current?.focus()
    }
  }, [searchOpen])

  // Keyboard shortcuts and Escape key.
  useEffect(() => {
    function handleKeyDown(event) {
      const isSearchShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'k'

      if (isSearchShortcut) {
        event.preventDefault()
        openSearch()
      }

      if (event.key === 'Escape') {
        closeSearch()
        setNotificationsOpen(false)
        setProfileMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Close dropdowns when clicking outside.
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setSearchOpen(false)
        setSearchTerm('')
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false)
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  // Close open panels after changing routes.
  useEffect(() => {
    closeSearch()
    setNotificationsOpen(false)
    setProfileMenuOpen(false)
  }, [location.pathname])

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMobileOpen?.(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="topbar-page-heading">
          <h1>{title}</h1>
          <p>Farm intelligence and decision support</p>
        </div>
      </div>

      <div className="topbar-actions">

        {/* SEARCH */}
        <div
          className={`topbar-search-wrapper ${
            searchOpen ? 'search-is-open' : ''
          }`}
          ref={searchContainerRef}
        >
          {!searchOpen ? (
            <button
              type="button"
              className="topbar-search"
              onClick={openSearch}
              aria-label="Open search"
            >
              <Search size={18} />
              <span>Search anything...</span>
              <kbd>Ctrl K</kbd>
            </button>
          ) : (
            <form
              className="topbar-search-form"
              onSubmit={handleSearchSubmit}
            >
              <Search size={18} />

              <input
                ref={searchRef}
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search FieldShift pages..."
                aria-label="Search FieldShift pages"
                autoComplete="off"
              />

              <button
                type="button"
                className="search-close-button"
                onClick={closeSearch}
                aria-label="Close search"
              >
                <X size={17} />
              </button>
            </form>
          )}

          {searchOpen && (
            <div className="topbar-search-results">
              <div className="search-results-heading">
                {searchTerm.trim()
                  ? 'Search results'
                  : 'Quick navigation'}
              </div>

              {searchResults.length > 0 ? (
                searchResults.map((page) => (
                  <button
                    type="button"
                    key={page.path}
                    className={`search-result-item ${
                      location.pathname === page.path
                        ? 'active-search-result'
                        : ''
                    }`}
                    onClick={() => goToPage(page.path)}
                  >
                    <div className="search-result-icon">
                      <Search size={15} />
                    </div>

                    <div className="search-result-text">
                      <strong>{page.title}</strong>
                      <span>{page.path}</span>
                    </div>

                    <ArrowRight size={15} />
                  </button>
                ))
              ) : (
                <div className="search-empty-state">
                  <Search size={22} />
                  <strong>No matching pages found</strong>
                  <span>Try another search term.</span>
                </div>
              )}

              <div className="search-results-footer">
                Press Enter to open the first result
              </div>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS */}
        <div className="topbar-dropdown-wrapper" ref={notificationRef}>
          <button
            type="button"
            className={`notification-button ${
              notificationsOpen ? 'dropdown-active' : ''
            }`}
            onClick={() => {
              setNotificationsOpen((previous) => !previous)
              setProfileMenuOpen(false)
              setSearchOpen(false)
            }}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell size={19} />
          </button>

          {notificationsOpen && (
            <div className="topbar-dropdown notification-dropdown">
              <div className="dropdown-heading">
                <strong>Notifications</strong>
                <span>Updates</span>
              </div>

              <div className="notification-empty">
                <div className="notification-empty-icon">
                  <Bell size={21} />
                </div>

                <strong>No new notifications</strong>
                <p>
                  You will see important farm and platform updates here.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* PROFILE */}
        <div className="topbar-dropdown-wrapper" ref={profileRef}>
          <button
            type="button"
            className="profile-button"
            onClick={() => {
              setProfileMenuOpen((previous) => !previous)
              setNotificationsOpen(false)
              setSearchOpen(false)
            }}
            aria-label="Open farmer account menu"
            aria-expanded={profileMenuOpen}
          >
            <div className="profile-avatar">
              {profileImage ? (
                <img src={profileImage} alt="Farmer profile" />
              ) : (
                <UserRound size={20} />
              )}
            </div>

            <div className="profile-info">
              <strong>{farmerName}</strong>
              <span>Farmer Account</span>
            </div>

            <ChevronDown
              size={16}
              className={profileMenuOpen ? 'chevron-rotated' : ''}
            />
          </button>

          {profileMenuOpen && (
            <div className="topbar-dropdown profile-dropdown">
              <div className="profile-dropdown-user">
                <strong>{farmerName}</strong>
                <span>{user?.email || 'Farmer Account'}</span>
              </div>

              <Link
                to="/dashboard/farmer-profile"
                className="profile-dropdown-link"
                onClick={() => setProfileMenuOpen(false)}
              >
                <UserRound size={17} />
                <span>My Farmer Profile</span>
              </Link>

              <button
                type="button"
                className="profile-dropdown-logout"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <LogOut size={17} />
                <span>
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* LOGOUT BUTTON */}
        <button
          type="button"
          className="topbar-logout-button"
          onClick={handleLogout}
          disabled={loggingOut}
          title="Log out of your account"
        >
          <LogOut size={17} />
          <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </header>
  )
}

export default Topbar
