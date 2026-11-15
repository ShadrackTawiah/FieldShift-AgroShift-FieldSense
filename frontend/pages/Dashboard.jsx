
import { useEffect, useState } from 'react'

import {
  Thermometer,
  CloudRain,
  Droplets,
  Sun,
  RefreshCw,
  AlertCircle,
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
        throw new Error(
          'NASA climate data was not returned successfully.'
        )
      }

      setClimate(data)
    } catch (err) {
      setError(
        err.message || 'Unable to load climate information.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClimate()
  }, [])

  // Convert NASA values to numbers and exclude missing-data values.
  function getDailyValues(parameter) {
    const values = Object.values(
      climate?.parameters?.[parameter] || {}
    )

    return values
      .map(value => Number(value))
      .filter(
        value =>
          Number.isFinite(value) &&
          value !== -999 &&
          value >= 0
      )
  }

  function getAverage(parameter) {
    const values = getDailyValues(parameter)

    if (!values.length) return null

    return (
      values.reduce((total, value) => total + value, 0) /
      values.length
    )
  }

  function getTotal(parameter) {
    const values = getDailyValues(parameter)

    if (!values.length) return null

    return values.reduce((total, value) => total + value, 0)
  }

  const metrics = [
    {
      label: 'Average Temperature',
      value: getAverage('T2M'),
      unit: '°C',
      icon: Thermometer,
      decimals: 1,
    },
    {
      label: 'Total Rainfall',
      value: getTotal('PRECTOTCORR'),
      unit: 'mm',
      icon: CloudRain,
      decimals: 1,
    },
    {
      label: 'Average Humidity',
      value: getAverage('RH2M'),
      unit: '%',
      icon: Droplets,
      decimals: 1,
    },
    {
      label: 'Solar Radiation',
      value: getAverage('ALLSKY_SFC_SW_DWN'),
      unit: 'MJ/m²/day',
      icon: Sun,
      decimals: 2,
    },
  ]

  return (
    <div className="dashboard-page">

      <section className="dashboard-welcome">
        <div className="dashboard-welcome-content">

          <span className="dashboard-eyebrow">
            AGRICULTURAL INTELLIGENCE
          </span>

          <h1>Welcome to FieldShift</h1>

          <p>
            Understand your farm environment, monitor climate
            conditions, and make smarter crop rotation decisions
            using Earth observation data.
          </p>

          <div className="dashboard-location">
            <span className="location-dot"></span>
            Takoradi, Ghana · Pilot Location
          </div>

        </div>
      </section>

      <section className="dashboard-section">

        <div className="dashboard-section-heading">

          <div>
            <span className="dashboard-eyebrow">
              NASA EARTH OBSERVATIONS
            </span>

            <h2>Climate Overview</h2>

            <p>
              Daily climate information retrieved from NASA POWER.
            </p>
          </div>

          <button
            className="dashboard-refresh"
            onClick={loadClimate}
            disabled={loading}
          >
            <RefreshCw size={16} />
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>

        </div>

        {error && (
          <div className="dashboard-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="dashboard-metrics">

          {metrics.map(metric => {
            const Icon = metric.icon

            return (
              <article
                className="dashboard-metric-card"
                key={metric.label}
              >

                <div className="metric-card-top">
                  <div className="metric-icon">
                    <Icon size={21} />
                  </div>
                </div>

                <p>{metric.label}</p>

                <h3>
                  {loading
                    ? '...'
                    : metric.value === null
                      ? '--'
                      : `${metric.value.toFixed(metric.decimals)} ${metric.unit}`}
                </h3>

                <span className="metric-source">
                  NASA POWER · {climate?.period?.days || 30} days
                </span>

              </article>
            )
          })}

        </div>

        {climate && (
          <div className="dashboard-data-note">
            <span>
              Data period: {climate.period.start} to {climate.period.end}
            </span>

            <span>Source: NASA POWER</span>
          </div>
        )}

      </section>

      <section className="dashboard-bottom-grid">

        <article className="dashboard-panel">

          <span className="dashboard-eyebrow">
            ENVIRONMENTAL INTELLIGENCE
          </span>

          <h2>Climate Insights</h2>

          <p>
            Climate information helps evaluate rainfall patterns,
            temperature conditions and potential crop water
            requirements.
          </p>

          <span className="dashboard-coming">
            More analysis coming next
          </span>

        </article>

        <article className="dashboard-panel">

          <span className="dashboard-eyebrow">
            FARM MANAGEMENT
          </span>

          <h2>Farm Overview</h2>

          <p>
            Your farm information and field boundaries will appear
            here after you register a farm.
          </p>

          <span className="dashboard-coming">
            No farm registered yet
          </span>

        </article>

      </section>

    </div>
  )
}

export default Dashboard
