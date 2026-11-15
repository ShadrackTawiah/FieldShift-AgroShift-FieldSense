
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  CloudSun,
  Droplets,
  Sprout,
  Satellite,
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Activity,
  Leaf,
  Plus,
  RefreshCw,
  AlertCircle,
  Thermometer,
} from 'lucide-react'

import { getClimateData } from '../services/api'
import './Dashboard.css'

function Dashboard() {
  const [climate, setClimate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadClimate() {
    setLoading(true)
    setError('')

    try {
      const data = await getClimateData()

      if (!data.success) {
        throw new Error('NASA climate data was not returned successfully.')
      }

      setClimate(data)
    } catch (err) {
      setError(err.message || 'Unable to connect to NASA POWER.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClimate()
  }, [])

  function getValues(parameter) {
    const values = Object.values(
      climate?.parameters?.[parameter] || {}
    )

    return values.filter(
      value =>
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0
    )
  }

  function getAverage(parameter) {
    const values = getValues(parameter)

    if (!values.length) return null

    return values.reduce((sum, value) => sum + value, 0) /
      values.length
  }

  function getTotal(parameter) {
    const values = getValues(parameter)

    if (!values.length) return null

    return values.reduce((sum, value) => sum + value, 0)
  }

  const stats = [
    {
      label: 'Average Temperature',
      value: getAverage('T2M'),
      unit: '°C',
      detail: 'NASA POWER · 30 days',
      icon: Thermometer,
      decimals: 1,
    },
    {
      label: 'Average Humidity',
      value: getAverage('RH2M'),
      unit: '%',
      detail: 'NASA POWER · 30 days',
      icon: Droplets,
      decimals: 1,
    },
    {
      label: 'Total Rainfall',
      value: getTotal('PRECTOTCORR'),
      unit: 'mm',
      detail: 'NASA POWER · 30 days',
      icon: CloudSun,
      decimals: 1,
    },
    {
      label: 'Solar Radiation',
      value: getAverage('ALLSKY_SFC_SW_DWN'),
      unit: 'kWh/m²/day',
      detail: 'NASA POWER · 30 days',
      icon: Sprout,
      decimals: 2,
    },
  ]

  return (
    <div className="dashboard">

      <section className="welcome-section">
        <div>
          <span className="welcome-eyebrow">
            <Leaf size={14} /> AGRICULTURAL INTELLIGENCE
          </span>

          <h2>
            Understand your land. <span>Grow smarter.</span>
          </h2>

          <p>
            Monitor environmental conditions and discover better
            agricultural decisions through Earth observation data.
          </p>

          <div className="welcome-actions">
            <Link to="/dashboard/farms" className="primary-action">
              <Plus size={17} /> Add Your Farm
            </Link>

            <Link to="/dashboard/climate" className="secondary-action">
              Explore Insights <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="welcome-illustration">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=700"
            alt="Green agricultural landscape"
          />

          <div className="image-label">
            <Satellite size={17} />
            <span>EARTH OBSERVATION</span>
          </div>
        </div>
      </section>

      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <h3>Environmental Overview</h3>
            <p>Monitor your farm's environmental indicators.</p>
          </div>

          <div className="data-status">
            <span
              className={climate ? 'status-connected' : 'status-pending'}
            />

            {loading
              ? 'Connecting to NASA...'
              : climate
                ? 'NASA data connected'
                : 'Data unavailable'}
          </div>
        </div>

        {error && (
          <div className="dashboard-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="stats-grid">

          {stats.map((stat) => {
            const Icon = stat.icon

            return (
              <div className="stat-card" key={stat.label}>

                <div className="stat-top">
                  <div className="stat-icon">
                    <Icon size={20} />
                  </div>

                  <ArrowUpRight
                    size={17}
                    className="stat-arrow"
                  />
                </div>

                <p>{stat.label}</p>

                <div className="stat-value">
                  {loading
                    ? '...'
                    : stat.value === null
                      ? '--'
                      : stat.value.toFixed(stat.decimals)}

                  <span>
                    {stat.value === null && !loading ? '' : stat.unit}
                  </span>
                </div>

                <small>
                  {loading ? 'Retrieving data...' : stat.detail}
                </small>

              </div>
            )
          })}

        </div>

        <div className="dashboard-refresh-row">
          {climate && (
            <span>
              Data period: {climate.period.start} to {climate.period.end}
            </span>
          )}

          <button
            className="dashboard-refresh"
            onClick={loadClimate}
            disabled={loading}
          >
            <RefreshCw size={15} />
            {loading ? 'Loading...' : 'Refresh NASA Data'}
          </button>
        </div>

      </section>

      <section className="dashboard-lower">

        <div className="dashboard-panel climate-panel">

          <div className="panel-heading">
            <div>
              <h3>Climate Monitoring</h3>
              <p>NASA POWER environmental observations</p>
            </div>

            <CloudSun size={21} />
          </div>

          {climate ? (
            <div className="climate-summary">
              <div>
                <span>Average temperature</span>
                <strong>
                  {getAverage('T2M')?.toFixed(1) ?? '--'}°C
                </strong>
              </div>

              <div>
                <span>Average humidity</span>
                <strong>
                  {getAverage('RH2M')?.toFixed(1) ?? '--'}%
                </strong>
              </div>

              <div>
                <span>Total rainfall</span>
                <strong>
                  {getTotal('PRECTOTCORR')?.toFixed(1) ?? '--'} mm
                </strong>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Activity size={30} />

              <h4>
                {loading
                  ? 'Loading climate observations'
                  : 'Climate data unavailable'}
              </h4>

              <p>
                {loading
                  ? 'Retrieving environmental data from NASA POWER.'
                  : 'Check your backend connection and try refreshing the data.'}
              </p>
            </div>
          )}

        </div>

        <div className="dashboard-panel farm-panel">

          <div className="panel-heading">
            <div>
              <h3>My Farm</h3>
              <p>Farm location and profile</p>
            </div>

            <MapPin size={21} />
          </div>

          <div className="farm-empty">
            <div className="farm-empty-icon">
              <Sprout size={27} />
            </div>

            <h4>No farm registered yet</h4>

            <p>
              Add your farm to begin receiving location-based insights.
            </p>

            <Link
              to="/dashboard/farms"
              className="farm-add-button"
            >
              Register a farm <ArrowRight size={15} />
            </Link>
          </div>

        </div>

      </section>

      <div className="dashboard-source-note">
        <Satellite size={15} />
        Climate estimates sourced from NASA POWER. These are gridded
        estimates, not direct measurements from an individual farm.
      </div>

    </div>
  )
}

export default Dashboard
