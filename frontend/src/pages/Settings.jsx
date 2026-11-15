
import { useEffect, useState } from 'react'

import {
  MapPin,
  Globe,
  Database,
  Bell,
  Info,
  Save,
} from 'lucide-react'

import './Settings.css'

function Settings() {
  const [location, setLocation] = useState('Takoradi')
  const [country, setCountry] = useState('Ghana')
  const [notifications, setNotifications] = useState(true)
  const [units, setUnits] = useState('metric')
  const [saved, setSaved] = useState(false)

  // Load previously saved preferences
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('fieldshift-settings')

      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings)

        setLocation(parsedSettings.location || 'Takoradi')
        setCountry(parsedSettings.country || 'Ghana')
        setNotifications(
          parsedSettings.notifications ?? true
        )
        setUnits(parsedSettings.units || 'metric')
      }
    } catch (error) {
      console.error('Could not load settings:', error)
    }
  }, [])

  function handleSave(event) {
    event.preventDefault()

    try {
      localStorage.setItem(
        'fieldshift-settings',
        JSON.stringify({
          location,
          country,
          notifications,
          units,
        })
      )

      setSaved(true)
    } catch (error) {
      console.error('Could not save settings:', error)
      setSaved(false)
    }
  }

  return (
    <div className="settings-page">

      <section className="settings-hero">
        <span className="settings-eyebrow">
          APPLICATION CONFIGURATION
        </span>

        <h1>Manage your FieldShift preferences.</h1>

        <p>
          Configure your pilot location, measurement units
          and notification preferences.
        </p>
      </section>

      <form onSubmit={handleSave}>

        {/* Location Preferences */}
        <section className="settings-panel">

          <div className="settings-panel-heading">
            <div className="settings-heading-icon">
              <MapPin size={20} />
            </div>

            <div>
              <h2>Location Preferences</h2>
              <p>Set the location used for climate information.</p>
            </div>
          </div>

          <div className="settings-form-grid">

            <div className="settings-field">
              <label htmlFor="location">Pilot location</label>

              <input
                id="location"
                type="text"
                value={location}
                onChange={(event) => {
                  setLocation(event.target.value)
                  setSaved(false)
                }}
                required
              />
            </div>

            <div className="settings-field">
              <label htmlFor="country">Country</label>

              <input
                id="country"
                type="text"
                value={country}
                onChange={(event) => {
                  setCountry(event.target.value)
                  setSaved(false)
                }}
                required
              />
            </div>

          </div>
        </section>

        {/* Measurement Units */}
        <section className="settings-panel">

          <div className="settings-panel-heading">
            <div className="settings-heading-icon">
              <Globe size={20} />
            </div>

            <div>
              <h2>Measurement Units</h2>
              <p>Choose your preferred measurement system.</p>
            </div>
          </div>

          <div className="settings-field">
            <label htmlFor="units">Unit system</label>

            <select
              id="units"
              value={units}
              onChange={(event) => {
                setUnits(event.target.value)
                setSaved(false)
              }}
            >
              <option value="metric">
                Metric (°C, mm, km)
              </option>

              <option value="imperial">
                Imperial (°F, inches, miles)
              </option>
            </select>
          </div>

        </section>

        {/* Notifications */}
        <section className="settings-panel">

          <div className="settings-panel-heading">
            <div className="settings-heading-icon">
              <Bell size={20} />
            </div>

            <div>
              <h2>Notifications</h2>
              <p>Manage application notification preferences.</p>
            </div>
          </div>

          <label className="settings-toggle">
            <div>
              <strong>Enable notifications</strong>

              <span>
                Allow FieldShift to display notification alerts.
              </span>
            </div>

            <input
              type="checkbox"
              checked={notifications}
              onChange={(event) => {
                setNotifications(event.target.checked)
                setSaved(false)
              }}
            />
          </label>

        </section>

        {/* Data Sources */}
        <section className="settings-data-panel">

          <div className="settings-heading-icon">
            <Database size={20} />
          </div>

          <div>
            <h3>Data Sources</h3>

            <p>
              NASA POWER is currently connected for climate
              information. Other environmental data sources
              are awaiting integration.
            </p>
          </div>

        </section>

        {/* Information */}
        <section className="settings-info">
          <Info size={18} />

          <p>
            These preferences are currently saved in this
            browser only. They are not yet synchronized
            across devices or user accounts.
          </p>
        </section>

        {/* Save Preferences */}
        <div className="settings-actions">

          {saved && (
            <span className="settings-saved-message">
              Settings saved in this browser.
            </span>
          )}

          <button type="submit">
            <Save size={16} />
            Save Preferences
          </button>

        </div>

      </form>

    </div>
  )
}

export default Settings
