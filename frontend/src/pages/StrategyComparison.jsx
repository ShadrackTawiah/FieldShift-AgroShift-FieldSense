
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  Sprout,
  Leaf,
  Droplets,
  CloudSun,
  Target,
  MapPin,
  LoaderCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react'

import { getFarms } from '../services/farms'
import {
  getSoilData,
  getClimateData,
} from '../services/api'

import './StrategyComparison.css'

const strategies = [
  {
    id: 'soil',
    title: 'Soil Health First',
    subtitle: 'Soil improvement',
    description:
      'Prioritizes soil fertility, organic matter, nutrient cycling and crop diversity.',
    focus: 'Soil improvement',
    icon: Leaf,
  },
  {
    id: 'climate',
    title: 'Climate Resilience',
    subtitle: 'Climate adaptation',
    description:
      'Considers recent climate conditions and encourages crop choices and rotations that manage climate risks.',
    focus: 'Climate adaptation',
    icon: CloudSun,
  },
  {
    id: 'water',
    title: 'Water Efficiency',
    subtitle: 'Water management',
    description:
      'Considers recent rainfall, soil characteristics and the need to manage available water carefully.',
    focus: 'Water management',
    icon: Droplets,
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

  const temperatures = getDailyValues(parameters.T2M)
  const rainfall = getDailyValues(parameters.PRECTOTCORR)
  const humidity = getDailyValues(parameters.RH2M)

  return {
    averageTemperature: average(temperatures),
    averageDailyRainfall: average(rainfall),
    totalRainfall: rainfall.length
      ? rainfall.reduce((sum, value) => sum + value, 0)
      : null,
    averageHumidity: average(humidity),
    temperatureDays: temperatures.length,
    rainfallDays: rainfall.length,
    humidityDays: humidity.length,
    period: data?.period || null,
  }
}

function formatValue(value, decimals = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'Unavailable'
  }

  return value.toFixed(decimals)
}

function getSoilObservations(soil) {
  if (!soil?.available) {
    return [
      'No FAO HWSD soil mapping unit was retrieved for this farm.',
      'Soil texture, acidity and organic carbon cannot be assessed from this dataset.',
    ]
  }

  const topsoil = soil.profile?.find((layer) => layer.layer === 'D1')

  if (!topsoil) {
    return ['A usable topsoil layer was not returned by the soil dataset.']
  }

  const observations = []

  if (
    topsoil.ph_water !== null &&
    topsoil.ph_water !== undefined &&
    topsoil.ph_water !== '' &&
    Number.isFinite(Number(topsoil.ph_water))
  ) {
    const ph = Number(topsoil.ph_water)

    observations.push(
      `Estimated topsoil pH is ${ph.toFixed(2)}. ${
        ph < 5.5
          ? 'This is acidic and deserves attention when planning soil management.'
          : ph <= 7.5
            ? 'This is within a broad near-neutral range.'
            : 'This is alkaline and may affect nutrient availability.'
      }`
    )
  }

  if (
    topsoil.organic_carbon_percent !== null &&
    topsoil.organic_carbon_percent !== undefined &&
    topsoil.organic_carbon_percent !== '' &&
    Number.isFinite(Number(topsoil.organic_carbon_percent))
  ) {
    observations.push(
      `Estimated topsoil organic carbon is ${Number(
        topsoil.organic_carbon_percent
      ).toFixed(2)}%. This is a soil carbon indicator, not a direct measurement of all available nutrients.`
    )
  }

  if (
    topsoil.sand_percent !== null &&
    topsoil.sand_percent !== undefined &&
    topsoil.sand_percent !== '' &&
    topsoil.silt_percent !== null &&
    topsoil.silt_percent !== undefined &&
    topsoil.silt_percent !== '' &&
    topsoil.clay_percent !== null &&
    topsoil.clay_percent !== undefined &&
    topsoil.clay_percent !== '' &&
    Number.isFinite(Number(topsoil.sand_percent)) &&
    Number.isFinite(Number(topsoil.silt_percent)) &&
    Number.isFinite(Number(topsoil.clay_percent))
  ) {
    observations.push(
      `Estimated topsoil texture: ${Number(topsoil.sand_percent).toFixed(1)}% sand, ${Number(topsoil.silt_percent).toFixed(1)}% silt and ${Number(topsoil.clay_percent).toFixed(1)}% clay.`
    )
  }

  return observations.length
    ? observations
    : ['The soil profile was retrieved, but the expected topsoil indicators are unavailable.']
}

function buildStrategyDetails(soil, climate) {
  const topsoil = soil?.available
    ? soil.profile?.find((layer) => layer.layer === 'D1')
    : null

  const ph = Number(topsoil?.ph_water)
  const organicCarbon = Number(topsoil?.organic_carbon_percent)
  const clay = Number(topsoil?.clay_percent)

  const hasPH =
    topsoil?.ph_water !== null &&
    topsoil?.ph_water !== undefined &&
    topsoil?.ph_water !== '' &&
    Number.isFinite(ph)

  const hasOrganicCarbon =
    topsoil?.organic_carbon_percent !== null &&
    topsoil?.organic_carbon_percent !== undefined &&
    topsoil?.organic_carbon_percent !== '' &&
    Number.isFinite(organicCarbon)

  const hasClay =
    topsoil?.clay_percent !== null &&
    topsoil?.clay_percent !== undefined &&
    topsoil?.clay_percent !== '' &&
    Number.isFinite(clay)

  const soilObservations = getSoilObservations(soil)

  const climateObservations = []

  if (
    climate?.averageTemperature !== null &&
    climate?.averageTemperature !== undefined
  ) {
    climateObservations.push(
      `Average temperature over the retrieved period: ${formatValue(climate.averageTemperature)} °C.`
    )
  }

  if (
    climate?.totalRainfall !== null &&
    climate?.totalRainfall !== undefined
  ) {
    climateObservations.push(
      `Total recorded rainfall over the retrieved period: ${formatValue(climate.totalRainfall)} mm.`
    )
  }

  if (
    climate?.averageHumidity !== null &&
    climate?.averageHumidity !== undefined
  ) {
    climateObservations.push(
      `Average relative humidity over the retrieved period: ${formatValue(climate.averageHumidity)}%.`
    )
  }

  const soilActions = []

  if (hasPH && ph < 5.5) {
    soilActions.push(
      'Investigate soil acidity with a representative soil test before deciding whether lime is needed.'
    )
  }

  if (hasOrganicCarbon && organicCarbon < 1) {
    soilActions.push(
      'Consider practices that retain crop residues, add suitable organic materials and reduce unnecessary soil disturbance.'
    )
  }

  soilActions.push(
    'Consider rotating cereal crops with suitable legumes to diversify the crop sequence.'
  )

  const climateActions = [
    'Use local seasonal forecasts and agricultural extension advice before selecting planting dates.',
    'Consider crop varieties and planting windows suited to the farm’s local growing season.',
    'Avoid treating a short recent observation period as a prediction of the next season.',
  ]

  const waterActions = [
    'Check field drainage, water storage and irrigation availability before choosing a production system.',
    'Use soil-moisture monitoring or field observations to guide irrigation decisions.',
    'Match planting dates and crop choices to the expected seasonal water supply.',
  ]

  if (hasClay) {
    waterActions.unshift(
      `The estimated topsoil clay content is ${clay.toFixed(1)}%. Consider how this soil texture affects drainage and water retention, and confirm conditions in the field.`
    )
  }

  if (
    climate?.totalRainfall !== null &&
    climate?.totalRainfall !== undefined
  ) {
    waterActions.push(
      'Use the retrieved rainfall as historical context only; it does not establish future water availability.'
    )
  }

  return {
    soil: {
      evidence: soilObservations,
      actions: soilActions,
      limitations: [
        'HWSD values are mapping-unit estimates at approximately 1 km resolution, not laboratory measurements from the individual field.',
        'A current soil test is needed before calculating fertilizer or lime requirements.',
      ],
      hasEvidence: Boolean(topsoil),
    },

    climate: {
      evidence: climateObservations.length
        ? climateObservations
        : ['No usable NASA POWER temperature, rainfall or humidity observations were retrieved.'],
      actions: climateActions,
      limitations: [
        'Recent climate observations are not a seasonal forecast.',
        'This comparison does not yet include crop-specific climate thresholds, extreme-weather probabilities or future climate projections.',
      ],
      hasEvidence: climateObservations.length > 0,
    },

    water: {
      evidence: [
        ...(climate?.totalRainfall !== null &&
        climate?.totalRainfall !== undefined
          ? [
              `Recent recorded rainfall total: ${formatValue(climate.totalRainfall)} mm.`,
            ]
          : ['Recent rainfall observations are unavailable.']),
        ...(hasClay
          ? [`Estimated topsoil clay content: ${clay.toFixed(1)}%.`]
          : ['Topsoil texture information is unavailable.']),
      ],
      actions: waterActions,
      limitations: [
        'Actual soil moisture, groundwater availability and irrigation volumes are not currently connected.',
        'Rainfall observations alone cannot establish crop water requirements or irrigation needs.',
      ],
      hasEvidence:
        (climate?.totalRainfall !== null &&
          climate?.totalRainfall !== undefined) ||
        hasClay,
    },
  }
}

function StrategyComparison() {
  const [farms, setFarms] = useState([])
  const [selectedFarmId, setSelectedFarmId] = useState('')
  const [selectedStrategies, setSelectedStrategies] = useState([
    'soil',
    'climate',
  ])

  const [soilData, setSoilData] = useState(null)
  const [climateData, setClimateData] = useState(null)

  const [loadingFarms, setLoadingFarms] = useState(true)
  const [loadingComparison, setLoadingComparison] = useState(false)

  const [error, setError] = useState('')
  const [soilMessage, setSoilMessage] = useState('')
  const [climateMessage, setClimateMessage] = useState('')
  const [comparisonReady, setComparisonReady] = useState(false)

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
    selectedFarm?.longitude !== null &&
    selectedFarm?.longitude !== undefined &&
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

  const strategyDetails = useMemo(
    () => buildStrategyDetails(soilData, climateSummary),
    [soilData, climateSummary]
  )

  useEffect(() => {
    let active = true

    async function loadFarms() {
      try {
        setLoadingFarms(true)
        setError('')

        const data = await getFarms()

        if (!active) return

        setFarms(data)

        const firstFarm =
          data.find(
            (farm) =>
              farm.latitude !== null &&
              farm.latitude !== undefined &&
              farm.longitude !== null &&
              farm.longitude !== undefined &&
              Number.isFinite(Number(farm.latitude)) &&
              Number.isFinite(Number(farm.longitude)) &&
              Number(farm.latitude) >= -90 &&
              Number(farm.latitude) <= 90 &&
              Number(farm.longitude) >= -180 &&
              Number(farm.longitude) <= 180
          ) || data[0]

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
    setSoilMessage('')
    setClimateMessage('')
    setComparisonReady(false)
    setError('')
  }, [selectedFarmId])

  function toggleStrategy(strategyId) {
    setSelectedStrategies((current) => {
      if (current.includes(strategyId)) {
        if (current.length <= 2) return current

        return current.filter((item) => item !== strategyId)
      }

      return [...current, strategyId]
    })

    setComparisonReady(false)
  }

  async function runComparison() {
    if (!selectedFarm) {
      setError('Select a registered farm first.')
      return
    }

    if (!hasCoordinates) {
      setError(
        'This farm does not have valid GPS coordinates. Update its location in Farm Management before comparing strategies.'
      )
      return
    }

    if (selectedStrategies.length < 2) {
      setError('Select at least two strategies to compare.')
      return
    }

    setLoadingComparison(true)
    setError('')
    setSoilData(null)
    setClimateData(null)
    setSoilMessage('')
    setClimateMessage('')
    setComparisonReady(false)

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
              'No FAO HWSD soil mapping unit was found for these coordinates.'
          )
        }
      } else {
        setSoilMessage(
          soilResult.reason?.message ||
            'Unable to retrieve FAO soil information.'
        )
      }

      if (climateResult.status === 'fulfilled') {
        if (climateResult.value?.success) {
          retrievedClimate = climateResult.value
        } else {
          setClimateMessage('NASA POWER did not return usable climate data.')
        }
      } else {
        setClimateMessage(
          climateResult.reason?.message ||
            'Unable to retrieve NASA POWER climate information.'
        )
      }

      setSoilData(retrievedSoil)
      setClimateData(retrievedClimate)

      if (!retrievedSoil && !retrievedClimate) {
        setError(
          'Neither soil nor climate data could be retrieved. Check your backend and farm coordinates, then try again.'
        )
        return
      }

      setComparisonReady(true)
    } catch (err) {
      setError(err.message || 'Unable to complete the strategy comparison.')
    } finally {
      setLoadingComparison(false)
    }
  }

  if (loadingFarms) {
    return (
      <div className="strategy-comparison-page">
        <div className="strategy-loading">
          <LoaderCircle size={27} className="strategy-spin" />
          <p>Loading your registered farms...</p>
        </div>
      </div>
    )
  }

  const selectedStrategyDetails = strategies.filter((strategy) =>
    selectedStrategies.includes(strategy.id)
  )

  return (
    <div className="strategy-comparison-page">
      <section className="strategy-hero">
        <div className="strategy-hero-content">
          <span className="strategy-eyebrow">
            AGRICULTURAL STRATEGY ANALYSIS
          </span>
          <h1>Compare strategies. Make informed decisions.</h1>
          <p>
            Compare agricultural priorities using available farm soil
            information and recent NASA climate observations.
          </p>
        </div>

        <div className="strategy-hero-icon">
          <Target size={32} />
        </div>
      </section>

      {farms.length === 0 ? (
        <section className="strategy-empty">
          <Sprout size={34} />
          <h2>No registered farms found</h2>
          <p>
            Register a farm with GPS coordinates before comparing
            agricultural strategies.
          </p>

          <Link
            to="/dashboard/farms"
            className="strategy-primary-button"
          >
            Go to Farm Management
          </Link>
        </section>
      ) : (
        <>
          <section className="strategy-farm-panel">
            <div className="strategy-section-heading">
              <div className="strategy-section-icon">
                <MapPin size={19} />
              </div>
              <div>
                <h2>Select your farm</h2>
                <p>
                  Comparisons use the location of the selected farm.
                </p>
              </div>
            </div>

            <div className="strategy-farm-controls">
              <select
                value={selectedFarmId}
                onChange={(event) =>
                  setSelectedFarmId(event.target.value)
                }
                aria-label="Select registered farm"
              >
                {farms.map((farm) => (
                  <option key={farm.id} value={String(farm.id)}>
                    {farm.farm_name}
                    {farm.community ? ` · ${farm.community}` : ''}
                  </option>
                ))}
              </select>

              <div className="strategy-farm-location">
                <MapPin size={15} />
                <span>
                  {selectedFarm?.community ||
                    selectedFarm?.district ||
                    selectedFarm?.region ||
                    'Farm location not specified'}
                </span>
                {hasCoordinates && (
                  <small>
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </small>
                )}
              </div>
            </div>

            {!hasCoordinates && (
              <div className="strategy-warning">
                <AlertTriangle size={17} />
                <span>
                  This farm has no valid GPS coordinates. Edit the farm in
                  Farm Management before running a comparison.
                </span>
              </div>
            )}
          </section>

          <section className="strategy-selection-section">
            <div className="strategy-section-heading">
              <div className="strategy-section-icon">
                <Target size={19} />
              </div>
              <div>
                <h2>Choose strategies to compare</h2>
                <p>
                  Select at least two strategies. You can compare all three.
                </p>
              </div>
            </div>

            <div className="strategy-card-grid">
              {strategies.map((strategy) => {
                const Icon = strategy.icon
                const selected = selectedStrategies.includes(strategy.id)

                return (
                  <button
                    type="button"
                    key={strategy.id}
                    className={`strategy-option-card ${
                      selected ? 'selected' : ''
                    }`}
                    onClick={() => toggleStrategy(strategy.id)}
                    aria-pressed={selected}
                  >
                    <div className="strategy-option-top">
                      <div className="strategy-option-icon">
                        <Icon size={23} />
                      </div>
                      <span className="strategy-check">
                        {selected ? <CheckCircle2 size={21} /> : null}
                      </span>
                    </div>

                    <h3>{strategy.title}</h3>
                    <p>{strategy.description}</p>
                    <span className="strategy-focus">
                      {strategy.focus}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="strategy-selection-footer">
              <div>
                <span className="strategy-selection-label">
                  CURRENT SELECTION
                </span>
                <strong>
                  {selectedStrategies.length} strategies selected
                </strong>
                <p>
                  {selectedStrategyDetails
                    .map((strategy) => strategy.title)
                    .join(' · ')}
                </p>
              </div>

              <button
                type="button"
                className="strategy-run-button"
                onClick={runComparison}
                disabled={
                  loadingComparison ||
                  selectedStrategies.length < 2 ||
                  !hasCoordinates
                }
              >
                {loadingComparison ? (
                  <>
                    <LoaderCircle size={17} className="strategy-spin" />
                    Analysing farm...
                  </>
                ) : (
                  <>
                    <Target size={17} />
                    Compare selected strategies
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="strategy-error">
                <AlertTriangle size={17} />
                <span>{error}</span>
              </div>
            )}
          </section>

          {comparisonReady && (
            <section className="strategy-results">
              <div className="strategy-results-heading">
                <div>
                  <span className="strategy-eyebrow">
                    FARM-BASED COMPARISON
                  </span>
                  <h2>Strategy evidence and trade-offs</h2>
                  <p>
                    {selectedFarm?.farm_name} ·{' '}
                    {selectedFarm?.community ||
                      selectedFarm?.district ||
                      'Selected farm'}
                  </p>
                </div>

                <button
                  type="button"
                  className="strategy-refresh-button"
                  onClick={runComparison}
                  disabled={loadingComparison}
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>

              <div className="strategy-data-status">
                <div>
                  <Leaf size={17} />
                  <span>FAO soil data</span>
                  <strong>
                    {soilData ? 'Retrieved' : 'Unavailable'}
                  </strong>
                </div>
                <div>
                  <CloudSun size={17} />
                  <span>NASA POWER data</span>
                  <strong>
                    {climateData ? 'Retrieved' : 'Unavailable'}
                  </strong>
                </div>
              </div>

              {(soilMessage || climateMessage) && (
                <div className="strategy-warning">
                  <Info size={17} />
                  <span>
                    {[soilMessage, climateMessage]
                      .filter(Boolean)
                      .join(' ')}
                    {' '}The comparison below uses only the data that was
                    successfully retrieved.
                  </span>
                </div>
              )}

              <div className="strategy-comparison-grid">
                {selectedStrategyDetails.map((strategy) => {
                  const Icon = strategy.icon
                  const details = strategyDetails[strategy.id]

                  return (
                    <article
                      className="strategy-result-card"
                      key={strategy.id}
                    >
                      <div className="strategy-result-title">
                        <div className="strategy-option-icon">
                          <Icon size={22} />
                        </div>
                        <div>
                          <h3>{strategy.title}</h3>
                          <span>{strategy.subtitle}</span>
                        </div>
                      </div>

                      <div className="strategy-evidence-section">
                        <h4>Evidence from this farm</h4>
                        <ul>
                          {details.evidence.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="strategy-evidence-section">
                        <h4>Management considerations</h4>
                        <ul>
                          {details.actions.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="strategy-limitations">
                        <h4>What is not yet measured</h4>
                        <ul>
                          {details.limitations.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="strategy-evidence-status">
                        {details.hasEvidence ? (
                          <>
                            <CheckCircle2 size={16} />
                            Farm evidence available
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={16} />
                            Limited farm evidence
                          </>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>

              <div className="strategy-no-ranking">
                <Info size={19} />
                <div>
                  <strong>No overall winner is calculated</strong>
                  <p>
                    These strategies have different objectives. This version
                    presents available evidence and management trade-offs;
                    it does not calculate validated performance scores,
                    yield predictions or profitability rankings.
                  </p>
                </div>
              </div>

              <div className="strategy-source-note">
                <strong>Data sources and interpretation</strong>
                <p>
                  Soil estimates: FAO Harmonized World Soil Database v2.0,
                  approximately 1 km mapping resolution.
                  {climateSummary?.period
                    ? ` Climate observations: NASA POWER, ${climateSummary.period.start} to ${climateSummary.period.end}.`
                    : ' NASA POWER climate observations were unavailable.'}
                  {' '}Recent climate observations are historical context,
                  not a seasonal forecast. Field measurements and local
                  agricultural advice are needed before making farm
                  investment decisions.
                </p>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default StrategyComparison
