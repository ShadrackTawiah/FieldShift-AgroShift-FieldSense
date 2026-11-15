
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  FileText,
  Download,
  BarChart3,
  CloudSun,
  Sprout,
  MapPin,
  Info,
  LoaderCircle,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Thermometer,
  Leaf,
} from 'lucide-react'

import { getFarms } from '../services/farms'
import {
  getSoilData,
  getClimateData,
} from '../services/api'

import './Reports.css'

const reportSections = [
  {
    title: 'Climate Analysis',
    description: 'Temperature, rainfall, humidity and available solar radiation.',
    icon: CloudSun,
  },
  {
    title: 'Soil Intelligence',
    description: 'Soil properties and the available FAO soil profile.',
    icon: Sprout,
  },
  {
    title: 'Farm Location',
    description: 'Registered farm details and GPS coordinates.',
    icon: MapPin,
  },
  {
    title: 'Crop Rotation',
    description: 'Rotation plans will be included after they are saved to the farm record.',
    icon: BarChart3,
  },
]

function getDailyValues(parameter) {
  if (!parameter || typeof parameter !== 'object') return []

  return Object.values(parameter)
    .map(Number)
    .filter((value) => Number.isFinite(value) && value !== -999)
}

function average(values) {
  if (!values.length) return null

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function summarizeClimate(data) {
  const parameters = data?.parameters || {}

  const temperature = getDailyValues(parameters.T2M)
  const rainfall = getDailyValues(parameters.PRECTOTCORR)
  const humidity = getDailyValues(parameters.RH2M)
  const solar = getDailyValues(parameters.ALLSKY_SFC_SW_DWN)

  return {
    averageTemperature: average(temperature),
    averageDailyRainfall: average(rainfall),
    totalRainfall: rainfall.length
      ? rainfall.reduce((sum, value) => sum + value, 0)
      : null,
    averageHumidity: average(humidity),
    averageSolar: average(solar),
    temperatureDays: temperature.length,
    rainfallDays: rainfall.length,
    humidityDays: humidity.length,
    solarDays: solar.length,
    period: data?.period || null,
    source: data?.source || 'NASA POWER',
    units: data?.units || {},
  }
}

function formatValue(value, decimals = 1) {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    !Number.isFinite(Number(value))
  ) {
    return 'Unavailable'
  }

  return Number(value).toFixed(decimals)
}

function hasValue(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== '' &&
    Number.isFinite(Number(value))
  )
}

function Reports() {
  const [farms, setFarms] = useState([])
  const [selectedFarmId, setSelectedFarmId] = useState('')
  const [loadingFarms, setLoadingFarms] = useState(true)
  const [loadingReport, setLoadingReport] = useState(false)

  const [soilData, setSoilData] = useState(null)
  const [climateData, setClimateData] = useState(null)
  const [reportGenerated, setReportGenerated] = useState(false)

  const [error, setError] = useState('')
  const [soilMessage, setSoilMessage] = useState('')
  const [climateMessage, setClimateMessage] = useState('')

  const selectedFarm = useMemo(
    () =>
      farms.find(
        (farm) => String(farm.id) === String(selectedFarmId)
      ),
    [farms, selectedFarmId]
  )

  const latitude = Number(selectedFarm?.latitude)
  const longitude = Number(selectedFarm?.longitude)

  const hasCoordinates =
    selectedFarm?.latitude !== null &&
    selectedFarm?.latitude !== undefined &&
    selectedFarm?.latitude !== '' &&
    selectedFarm?.longitude !== null &&
    selectedFarm?.longitude !== undefined &&
    selectedFarm?.longitude !== '' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180

  const climateSummary = useMemo(
    () => (climateData ? summarizeClimate(climateData) : null),
    [climateData]
  )

  const topsoil = soilData?.available
    ? soilData.profile?.find((layer) => layer.layer === 'D1')
    : null

  useEffect(() => {
    let active = true

    async function loadFarms() {
      try {
        setLoadingFarms(true)
        setError('')

        const data = await getFarms()

        if (!active) return

        const farmList = Array.isArray(data) ? data : []

        setFarms(farmList)

        const firstFarm =
          farmList.find((farm) => {
            const lat = Number(farm.latitude)
            const lng = Number(farm.longitude)

            return (
              farm.latitude !== null &&
              farm.latitude !== undefined &&
              farm.latitude !== '' &&
              farm.longitude !== null &&
              farm.longitude !== undefined &&
              farm.longitude !== '' &&
              Number.isFinite(lat) &&
              Number.isFinite(lng) &&
              lat >= -90 &&
              lat <= 90 &&
              lng >= -180 &&
              lng <= 180
            )
          }) || farmList[0]

        if (firstFarm) {
          setSelectedFarmId(String(firstFarm.id))
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load registered farms.')
        }
      } finally {
        if (active) setLoadingFarms(false)
      }
    }

    loadFarms()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    setSoilData(null)
    setClimateData(null)
    setReportGenerated(false)
    setSoilMessage('')
    setClimateMessage('')
    setError('')
  }, [selectedFarmId])

  async function generateReport() {
    if (!selectedFarm) {
      setError('Please select a registered farm.')
      return
    }

    if (!hasCoordinates) {
      setError(
        'This farm has no valid GPS coordinates. Update its location in Farm Management before generating a report.'
      )
      return
    }

    setLoadingReport(true)
    setError('')
    setSoilData(null)
    setClimateData(null)
    setSoilMessage('')
    setClimateMessage('')
    setReportGenerated(false)

    try {
      const [soilResult, climateResult] = await Promise.allSettled([
        getSoilData(latitude, longitude),
        getClimateData(latitude, longitude, 30),
      ])

      let retrievedSoil = null
      let retrievedClimate = null

      if (soilResult.status === 'fulfilled') {
        if (soilResult.value?.available) {
          retrievedSoil = soilResult.value
        } else {
          setSoilMessage(
            soilResult.value?.message ||
              'No FAO HWSD soil mapping unit was found for this location.'
          )
        }
      } else {
        setSoilMessage(
          soilResult.reason?.message ||
            'Unable to retrieve FAO soil data.'
        )
      }

      if (climateResult.status === 'fulfilled') {
        if (climateResult.value?.success) {
          retrievedClimate = climateResult.value
        } else {
          setClimateMessage(
            'NASA POWER did not return usable climate information.'
          )
        }
      } else {
        setClimateMessage(
          climateResult.reason?.message ||
            'Unable to retrieve NASA climate data.'
        )
      }

      setSoilData(retrievedSoil)
      setClimateData(retrievedClimate)

      if (!retrievedSoil && !retrievedClimate) {
        setError(
          'Neither soil nor climate data could be retrieved. Check your backend and farm coordinates. You can try again.'
        )
        return
      }

      setReportGenerated(true)
    } catch (err) {
      setError(
        err.message || 'An unexpected error occurred while generating the report.'
      )
    } finally {
      setLoadingReport(false)
    }
  }

  function handlePrint() {
    if (!reportGenerated) return
    window.print()
  }

  if (loadingFarms) {
    return (
      <div className="reports-page">
        <div className="reports-loading">
          <LoaderCircle size={26} className="reports-spin" />
          <p>Loading your registered farms...</p>
        </div>
      </div>
    )
  }

  const reportDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const locationText = selectedFarm
    ? [
        selectedFarm.community,
        selectedFarm.district,
        selectedFarm.region,
        selectedFarm.country,
      ]
        .filter(Boolean)
        .join(', ')
    : ''

  const solarUnit =
    climateSummary?.units?.ALLSKY_SFC_SW_DWN ||
    climateData?.units?.solar_radiation ||
    'MJ/m²/day'

  return (
    <div className="reports-page">
      <section className="reports-hero">
        <span className="reports-eyebrow">
          AGRICULTURAL REPORTING
        </span>

        <h1>Your farm intelligence, in one place.</h1>

        <p>
          Prepare structured agricultural reports using climate
          observations, soil indicators and registered farm information.
        </p>

        <div className="reports-location">
          <MapPin size={15} />
          {selectedFarm
            ? locationText || 'Farm location not specified'
            : 'No farm selected'}
        </div>
      </section>

      {farms.length === 0 ? (
        <section className="reports-empty">
          <Sprout size={32} />
          <h2>No registered farms found</h2>
          <p>
            Register a farm in Farm Management before generating a
            farm intelligence report.
          </p>

          <Link
            to="/dashboard/farms"
            className="reports-primary-button"
          >
            Go to Farm Management
          </Link>
        </section>
      ) : (
        <>
          <section className="reports-farm-panel">
            <div className="reports-heading">
              <span className="reports-eyebrow">
                REPORT CONFIGURATION
              </span>
              <h2>Select a farm</h2>
              <p>
                The report will use the selected farm's registered GPS
                coordinates.
              </p>
            </div>

            <div className="reports-farm-controls">
              <select
                value={selectedFarmId}
                onChange={(event) =>
                  setSelectedFarmId(event.target.value)
                }
                aria-label="Select farm for report"
              >
                {farms.map((farm) => (
                  <option key={farm.id} value={String(farm.id)}>
                    {farm.farm_name}
                    {farm.community ? ` · ${farm.community}` : ''}
                  </option>
                ))}
              </select>

              {selectedFarm && (
                <div className="reports-farm-coordinates">
                  <MapPin size={16} />
                  <span>
                    {hasCoordinates
                      ? `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                      : 'Valid GPS coordinates are required'}
                  </span>
                </div>
              )}
            </div>

            {!hasCoordinates && (
              <div className="reports-warning">
                <AlertTriangle size={17} />
                <span>
                  Edit this farm in Farm Management and add its actual
                  GPS coordinates before generating a report.
                </span>
              </div>
            )}

            {error && (
              <div className="reports-error">
                <AlertTriangle size={17} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              className="reports-generate-button"
              onClick={generateReport}
              disabled={loadingReport || !hasCoordinates}
            >
              {loadingReport ? (
                <>
                  <LoaderCircle size={17} className="reports-spin" />
                  Retrieving farm intelligence...
                </>
              ) : (
                <>
                  <FileText size={17} />
                  Generate farm report
                </>
              )}
            </button>
          </section>

          <section className="reports-overview">
            <div className="reports-heading">
              <span className="reports-eyebrow">
                REPORT CENTRE
              </span>

              <h2>Available report sections</h2>

              <p>
                Data availability is updated after retrieving information
                for your selected farm.
              </p>
            </div>

            <div className="reports-grid">
              {reportSections.map((section, index) => {
                const Icon = section.icon

                let status = 'Not retrieved'

                if (index === 0) {
                  status = climateData ? 'Retrieved' : 'Not retrieved'
                } else if (index === 1) {
                  status = soilData ? 'Retrieved' : 'Not retrieved'
                } else if (index === 2) {
                  status = hasCoordinates ? 'Available' : 'Missing GPS'
                } else {
                  status = 'Not saved yet'
                }

                const available =
                  status === 'Retrieved' || status === 'Available'

                return (
                  <article className="report-card" key={section.title}>
                    <div className="report-card-icon">
                      <Icon size={21} />
                    </div>

                    <h3>{section.title}</h3>

                    <p>{section.description}</p>

                    <span
                      className={`report-status ${
                        available ? 'report-status-available' : ''
                      }`}
                    >
                      {status}
                    </span>
                  </article>
                )
              })}
            </div>
          </section>

          {reportGenerated && (
            <section className="reports-preview">
              <div className="reports-preview-heading">
                <div>
                  <span className="reports-eyebrow">
                    REPORT PREVIEW
                  </span>
                  <h2>Farm intelligence report</h2>
                  <p>
                    Review the information before printing or saving
                    it as a PDF.
                  </p>
                </div>

                <button
                  type="button"
                  className="reports-print-button"
                  onClick={handlePrint}
                >
                  <Download size={16} />
                  Print / Save as PDF
                </button>
              </div>

              <div className="reports-print-area">
                <header className="reports-document-header">
                  <div>
                    <span>AGROSHIFT FIELDSENSE</span>
                    <h2>Farm Intelligence Report</h2>
                    <p>Generated on {reportDate}</p>
                  </div>
                  <FileText size={30} />
                </header>

                <section className="reports-document-section">
                  <h3>1. Farm information</h3>

                  <div className="reports-document-grid">
                    <div>
                      <span>Farm name</span>
                      <strong>{selectedFarm?.farm_name || 'Unavailable'}</strong>
                    </div>
                    <div>
                      <span>Farm location</span>
                      <strong>{locationText || 'Not provided'}</strong>
                    </div>
                    <div>
                      <span>Farm size</span>
                      <strong>
                        {hasValue(selectedFarm?.farm_size_acres)
                          ? `${selectedFarm.farm_size_acres} acres`
                          : 'Not provided'}
                      </strong>
                    </div>
                    <div>
                      <span>GPS coordinates</span>
                      <strong>
                        {hasCoordinates
                          ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                          : 'Unavailable'}
                      </strong>
                    </div>
                    <div>
                      <span>Main crops</span>
                      <strong>
                        {Array.isArray(selectedFarm?.main_crops) &&
                        selectedFarm.main_crops.length
                          ? selectedFarm.main_crops.join(', ')
                          : 'Not provided'}
                      </strong>
                    </div>
                    <div>
                      <span>Previous crop</span>
                      <strong>
                        {selectedFarm?.previous_crop || 'Not provided'}
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="reports-document-section">
                  <h3>2. Climate analysis</h3>

                  {climateSummary ? (
                    <>
                      <div className="reports-document-grid">
                        <div>
                          <span>Average temperature</span>
                          <strong>
                            {formatValue(climateSummary.averageTemperature)} °C
                          </strong>
                        </div>
                        <div>
                          <span>Total rainfall</span>
                          <strong>
                            {climateSummary.totalRainfall === null
                              ? 'Unavailable'
                              : `${formatValue(climateSummary.totalRainfall)} mm`}
                          </strong>
                        </div>
                        <div>
                          <span>Average daily rainfall</span>
                          <strong>
                            {climateSummary.averageDailyRainfall === null
                              ? 'Unavailable'
                              : `${formatValue(climateSummary.averageDailyRainfall)} mm/day`}
                          </strong>
                        </div>
                        <div>
                          <span>Average humidity</span>
                          <strong>
                            {climateSummary.averageHumidity === null
                              ? 'Unavailable'
                              : `${formatValue(climateSummary.averageHumidity)}%`}
                          </strong>
                        </div>
                        <div>
                          <span>Solar radiation</span>
                          <strong>
                            {climateSummary.averageSolar === null
                              ? 'Unavailable'
                              : `${formatValue(climateSummary.averageSolar)} ${solarUnit}`}
                          </strong>
                        </div>
                        <div>
                          <span>Observation period</span>
                          <strong>
                            {climateSummary.period
                              ? `${climateSummary.period.start} to ${climateSummary.period.end}`
                              : 'Unavailable'}
                          </strong>
                        </div>
                      </div>

                      <p className="reports-document-note">
                        Source: {climateSummary.source}. These are recent
                        historical observations, not a seasonal forecast.
                        Missing parameter values are excluded from the calculations.
                      </p>
                    </>
                  ) : (
                    <p className="reports-unavailable">
                      Climate information was not available for this report.
                      {climateMessage ? ` ${climateMessage}` : ''}
                    </p>
                  )}
                </section>

                <section className="reports-document-section">
                  <h3>3. Soil intelligence</h3>

                  {topsoil ? (
                    <>
                      <div className="reports-document-grid">
                        <div>
                          <span>Topsoil pH</span>
                          <strong>
                            {formatValue(topsoil.ph_water, 2)}
                          </strong>
                        </div>
                        <div>
                          <span>Sand</span>
                          <strong>
                            {formatValue(topsoil.sand_percent)}%
                          </strong>
                        </div>
                        <div>
                          <span>Silt</span>
                          <strong>
                            {formatValue(topsoil.silt_percent)}%
                          </strong>
                        </div>
                        <div>
                          <span>Clay</span>
                          <strong>
                            {formatValue(topsoil.clay_percent)}%
                          </strong>
                        </div>
                        <div>
                          <span>Organic carbon</span>
                          <strong>
                            {formatValue(topsoil.organic_carbon_percent)}%
                          </strong>
                        </div>
                        <div>
                          <span>Bulk density</span>
                          <strong>
                            {formatValue(topsoil.bulk_density_g_cm3, 2)} g/cm³
                          </strong>
                        </div>
                        <div>
                          <span>CEC</span>
                          <strong>
                            {formatValue(topsoil.cec_cmolc_kg, 2)} cmolc/kg
                          </strong>
                        </div>
                        <div>
                          <span>Total nitrogen</span>
                          <strong>
                            {formatValue(topsoil.total_nitrogen_g_kg, 2)} g/kg
                          </strong>
                        </div>
                      </div>

                      <p className="reports-document-note">
                        Source: {soilData.source || 'FAO HWSD'}, version{' '}
                        {soilData.dataset_version || 'Unavailable'}.
                        Mapping unit: {soilData.mapping_unit_id || 'Unavailable'}.
                        Approximate spatial resolution:{' '}
                        {soilData.spatial_resolution || 'Unavailable'}.
                        These are mapping-unit estimates, not individual
                        field laboratory results.
                      </p>

                      {soilData.profile?.length > 0 && (
                        <div className="reports-table-wrapper">
                          <h4>Soil profile by depth</h4>
                          <table className="reports-soil-table">
                            <thead>
                              <tr>
                                <th>Depth</th>
                                <th>Sand %</th>
                                <th>Silt %</th>
                                <th>Clay %</th>
                                <th>Organic C %</th>
                                <th>pH</th>
                              </tr>
                            </thead>
                            <tbody>
                              {soilData.profile.map((layer) => (
                                <tr key={layer.layer}>
                                  <td>
                                    {layer.top_depth_cm}–{layer.bottom_depth_cm} cm
                                  </td>
                                  <td>{formatValue(layer.sand_percent)}</td>
                                  <td>{formatValue(layer.silt_percent)}</td>
                                  <td>{formatValue(layer.clay_percent)}</td>
                                  <td>
                                    {formatValue(layer.organic_carbon_percent)}
                                  </td>
                                  <td>{formatValue(layer.ph_water, 2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="reports-unavailable">
                      Soil information was not available for this report.
                      {soilMessage ? ` ${soilMessage}` : ''}
                    </p>
                  )}
                </section>

                <section className="reports-document-section">
                  <h3>4. Crop rotation and strategy analysis</h3>
                  <p className="reports-unavailable">
                    No saved crop rotation plan or comparison result is
                    available for this farm yet. These results will be
                    included when the application stores completed analyses.
                  </p>
                </section>

                <section className="reports-document-section">
                  <h3>5. Data limitations</h3>
                  <ul className="reports-limitations-list">
                    <li>
                      NASA POWER climate observations describe the retrieved
                      historical period and are not a future seasonal forecast.
                    </li>
                    <li>
                      FAO HWSD soil values are spatial mapping estimates and
                      may not represent every part of the selected farm.
                    </li>
                    <li>
                      No soil moisture, laboratory test, measured yield,
                      fertilizer requirement or irrigation volume is
                      inferred from unavailable data.
                    </li>
                    <li>
                      Field verification and local agricultural extension
                      advice are recommended before making farm decisions.
                    </li>
                  </ul>
                </section>

                <footer className="reports-document-footer">
                  AGROSHIFT FIELDSENSE · Field intelligence for a better tomorrow.
                </footer>
              </div>
            </section>
          )}
        </>
      )}

      <section className="reports-note">
        <Info size={19} />
        <p>
          Reports distinguish NASA climate observations, FAO modelled soil
          information and actual farm records. Missing information is
          identified rather than presented as a measured value.
        </p>
      </section>
    </div>
  )
}

export default Reports
