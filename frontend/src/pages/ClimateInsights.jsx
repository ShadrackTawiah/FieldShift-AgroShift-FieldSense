
import { useEffect, useState } from 'react'

import {
  Thermometer,
  CloudRain,
  Droplets,
  Sun,
  RefreshCw,
  AlertCircle,
  Activity,
} from 'lucide-react'

import { getClimateData } from '../services/api'
import './ClimateInsights.css'

function ClimateInsights() {
  const [climate, setClimate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadClimate() {
    setLoading(true)
    setError('')

    try {
      const data = await getClimateData()

      if (!data.success) {
        throw new Error('NASA POWER data was not returned successfully.')
      }

      setClimate(data)
    } catch (err) {
      setError(err.message || 'Unable to retrieve climate data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClimate()
  }, [])

  function getValues(parameter) {
    return Object.values(climate?.parameters?.[parameter] || {})
      .map(Number)
      .filter(value =>
        Number.isFinite(value) &&
        value !== -999 &&
        value >= 0
      )
  }

  function getAverage(parameter) {
    const values = getValues(parameter)

    if (!values.length) return null

    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  function getTotal(parameter) {
    const values = getValues(parameter)

    if (!values.length) return null

    return values.reduce((sum, value) => sum + value, 0)
  }

  const indicators = [
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
      label: 'Average Solar Radiation',
      value: getAverage('ALLSKY_SFC_SW_DWN'),
      unit: 'kWh/m²/day',
      icon: Sun,
      decimals: 2,
    },
  ]

  const rainfall = getTotal('PRECTOTCORR')
  const temperature = getAverage('T2M')
  const humidity = getAverage('RH2M')
  const solarRadiation = getAverage('ALLSKY_SFC_SW_DWN')

  return (
    <div className="climate-insights-page">

      <section className="climate-hero">
        <span className="climate-eyebrow">
          NASA EARTH OBSERVATION INTELLIGENCE
        </span>

        <h1>Climate Insights</h1>

        <p>
          Understand changing environmental conditions through
          NASA climate data and explore what they may mean for
          agricultural decisions.
        </p>

        <div className="climate-location">
          <span className="climate-location-dot"></span>
          Takoradi, Ghana · Pilot Location
        </div>
      </section>

      <section className="climate-content">

        <div className="climate-heading">
          <div>
            <span className="climate-eyebrow">
              ENVIRONMENTAL MONITORING
            </span>

            <h2>Climate Indicators</h2>

            <p>
              Summary of available daily NASA POWER observations.
            </p>
          </div>

          <button
            type="button"
            className="climate-refresh"
            onClick={loadClimate}
            disabled={loading}
          >
            <RefreshCw size={16} />
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>

        {error && (
          <div className="climate-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="climate-indicators">
          {indicators.map(item => {
            const Icon = item.icon

            return (
              <article className="climate-indicator" key={item.label}>
                <div className="climate-indicator-icon">
                  <Icon size={21} />
                </div>

                <p>{item.label}</p>

                <h3>
                  {loading
                    ? '...'
                    : item.value === null
                      ? '--'
                      : `${item.value.toFixed(item.decimals)} ${item.unit}`}
                </h3>

                <span>NASA POWER</span>
              </article>
            )
          })}
        </div>

        <article className="climate-analysis-panel">
          <div className="climate-panel-heading">
            <div className="climate-panel-icon">
              <Activity size={20} />
            </div>

            <div>
              <h2>Environmental Summary</h2>
              <p>Interpretation of the available observation period</p>
            </div>
          </div>

          {loading ? (
            <p className="climate-analysis-message">
              Loading environmental observations...
            </p>
          ) : (
            <div className="climate-analysis-list">

              <div>
                <strong>Temperature</strong>
                <p>
                  {temperature === null
                    ? 'No valid temperature data is currently available.'
                    : `The average temperature during this period was ${temperature.toFixed(1)} °C.`}
                </p>
              </div>

              <div>
                <strong>Rainfall</strong>
                <p>
                  {rainfall === null
                    ? 'No valid rainfall data is currently available.'
                    : `Recorded daily rainfall estimates total ${rainfall.toFixed(1)} mm during the available period.`}
                </p>
              </div>

              <div>
                <strong>Humidity</strong>
                <p>
                  {humidity === null
                    ? 'No valid humidity data is currently available.'
                    : `Average relative humidity during this period was ${humidity.toFixed(1)}%.`}
                </p>
              </div>

              <div>
                <strong>Solar Radiation</strong>
                <p>
                  {solarRadiation === null
                    ? 'NASA POWER returned missing solar radiation values for this period. No estimate is displayed.'
                    : `Average solar radiation was ${solarRadiation.toFixed(2)} kWh/m²/day.`}
                </p>
              </div>

            </div>
          )}
        </article>

        {climate && (
          <div className="climate-source-note">
            Data period: {climate.period.start} to {climate.period.end}.
            Source: NASA POWER. Values are gridded estimates, not
            direct measurements from an individual farm.
          </div>
        )}

      </section>

    </div>
  )
}

export default ClimateInsights
