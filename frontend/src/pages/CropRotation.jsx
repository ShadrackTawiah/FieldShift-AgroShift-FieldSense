
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  Sprout,
  Leaf,
  Target,
  RotateCcw,
  Info,
  MapPin,
  LoaderCircle,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  RefreshCw,
  CloudSun,
} from 'lucide-react'

import { getFarms } from '../services/farms'
import {
  getSoilData,
  getClimateData,
} from '../services/api'
import {
  getRotationPlans,
  createRotationPlan,
} from '../services/rotationPlans'

import './CropRotation.css'

const cropOptions = [
  { value: 'maize', label: 'Maize', family: 'cereal' },
  { value: 'rice', label: 'Rice', family: 'cereal' },
  { value: 'cowpea', label: 'Cowpea', family: 'legume' },
  { value: 'groundnut', label: 'Groundnut', family: 'legume' },
  { value: 'cassava', label: 'Cassava', family: 'root' },
  { value: 'yam', label: 'Yam', family: 'root' },
  { value: 'plantain', label: 'Plantain', family: 'perennial' },
  { value: 'vegetables', label: 'Vegetables', family: 'mixed' },
  { value: 'other', label: 'Other', family: 'unknown' },
]

const priorityOptions = [
  { value: 'soil_health', label: 'Improve soil health' },
  { value: 'drought_resistance', label: 'Manage water risk' },
  { value: 'yield', label: 'Support crop production' },
  { value: 'nutrient_management', label: 'Improve nutrient management' },
]

function getCrop(value) {
  return cropOptions.find(
    (crop) => crop.value === String(value || '').toLowerCase()
  )
}

function getCropLabel(value) {
  return getCrop(value)?.label || 'Unspecified crop'
}

function getCropFamily(value) {
  return getCrop(value)?.family || 'unknown'
}

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
  const solar = getDailyValues(parameters.ALLSKY_SFC_SW_DWN)

  return {
    averageTemperature: average(temperatures),
    averageDailyRainfall: average(rainfall),
    totalRainfall: rainfall.length
      ? rainfall.reduce((sum, value) => sum + value, 0)
      : null,
    averageHumidity: average(humidity),
    averageSolarRadiation: average(solar),
    temperatureDays: temperatures.length,
    rainfallDays: rainfall.length,
    humidityDays: humidity.length,
    solarDays: solar.length,
    period: data?.period || null,
    source: data?.source || 'NASA POWER',
  }
}

function getRotationPlan(previousCrop, priority, soil, climate) {
  const previousFamily = getCropFamily(previousCrop)
  const soilPH = soil?.profile?.[0]?.ph_water

  const isAcidic =
    soilPH !== null &&
    soilPH !== undefined &&
    Number.isFinite(Number(soilPH)) &&
    Number(soilPH) < 5.5

  let first
  let second
  let third

  if (previousFamily === 'cereal') {
    first = 'cowpea'
    second = 'cassava'
    third = 'maize'
  } else if (previousFamily === 'legume') {
    first = 'maize'
    second = 'cassava'
    third = 'cowpea'
  } else if (previousFamily === 'root') {
    first = 'cowpea'
    second = 'maize'
    third = 'groundnut'
  } else if (previousFamily === 'perennial') {
    first = 'cowpea'
    second = 'maize'
    third = 'cassava'
  } else {
    first = 'cowpea'
    second = 'maize'
    third = 'cassava'
  }

  if (priority === 'drought_resistance') {
    if (previousFamily !== 'root') {
      first = 'cassava'
      second = previousFamily === 'legume' ? 'maize' : 'cowpea'
      third = previousFamily === 'legume' ? 'cowpea' : 'maize'
    }
  }

  if (priority === 'nutrient_management' || priority === 'soil_health') {
    if (previousFamily !== 'legume') {
      first = 'cowpea'
      second = 'maize'
      third = 'cassava'
    }
  }

  if (previousFamily === 'legume' && first === 'cowpea') {
    first = 'cassava'
    second = 'maize'
    third = 'groundnut'
  }

  const reasons = {
    cowpea:
      'A legume that can contribute to nitrogen fixation when effectively nodulated. Its actual benefit depends on soil conditions and management.',
    groundnut:
      'A legume that can contribute to nitrogen fixation and diversify the crop sequence. Suitable varieties and disease management still matter.',
    maize:
      'A cereal crop that can follow a legume in a rotation. It has a substantial nutrient demand and needs appropriate soil fertility management.',
    cassava:
      'A root crop that can diversify the rotation. It is relatively tolerant of some dry conditions once established, but establishment still needs moisture.',
    yam:
      'A root and tuber crop that can diversify production. It may require staking, suitable soil conditions and careful planting-material selection.',
    rice:
      'A cereal crop with water requirements that depend strongly on the production system and variety.',
    plantain:
      'A perennial crop that occupies land for longer and should be planned differently from short-season annual rotations.',
    vegetables:
      'A broad crop group. The best sequence depends on the vegetable species and its plant family.',
    other:
      'The crop family is not known, so a reliable rotation sequence needs more crop information.',
  }

  const notes = []

  if (isAcidic) {
    notes.push(
      `The HWSD topsoil estimate indicates acidic soil (pH ${Number(soilPH).toFixed(2)}). Confirm with a representative soil test before deciding on lime or other amendments.`
    )
  }

  if (climate?.totalRainfall !== null && climate?.totalRainfall !== undefined) {
    notes.push(
      'Recent rainfall is included as historical context only. It is not a forecast of rainfall during the next growing season.'
    )
  }

  if (!soil) {
    notes.push(
      'Soil information was unavailable for this farm, so soil suitability has not been assessed.'
    )
  }

  if (!climate) {
    notes.push(
      'Recent climate information was unavailable, so water and temperature conditions have not been assessed.'
    )
  }

  if (previousFamily === 'unknown' || previousFamily === 'mixed') {
    notes.push(
      'The previous crop has an uncertain or mixed crop family. Confirm the crop species before relying on this rotation sequence.'
    )
  }

  return {
    crops: [
      { crop: first, reason: reasons[first] },
      { crop: second, reason: reasons[second] },
      { crop: third, reason: reasons[third] },
    ],
    notes,
    priority,
  }
}

function formatNumber(value, decimals = 1) {
  const number = Number(value)

  if (
    value === null ||
    value === undefined ||
    value === '' ||
    !Number.isFinite(number)
  ) {
    return 'Unavailable'
  }

  return number.toFixed(decimals)
}

function CropRotation() {
  const [farms, setFarms] = useState([])
  const [selectedFarmId, setSelectedFarmId] = useState('')
  const [previousCrop, setPreviousCrop] = useState('')
  const [farmSize, setFarmSize] = useState('')
  const [priority, setPriority] = useState('soil_health')

  const [soilData, setSoilData] = useState(null)
  const [climateData, setClimateData] = useState(null)
  const [climateSummary, setClimateSummary] = useState(null)

  const [loadingFarms, setLoadingFarms] = useState(true)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [error, setError] = useState('')
  const [soilMessage, setSoilMessage] = useState('')
  const [climateMessage, setClimateMessage] = useState('')
  const [rotationPlan, setRotationPlan] = useState(null)

  const [savedPlans, setSavedPlans] = useState([])
  const [loadingSavedPlans, setLoadingSavedPlans] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [historyError, setHistoryError] = useState('')

  const selectedFarm = useMemo(
    () => farms.find((farm) => String(farm.id) === String(selectedFarmId)),
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

  const topsoil = soilData?.available
    ? soilData.profile?.find((layer) => layer.layer === 'D1')
    : null

  // Load the farmer's registered farms.
  useEffect(() => {
    let active = true

    async function loadFarms() {
      try {
        setLoadingFarms(true)
        setError('')

        const data = await getFarms()

        if (!active) return

        setFarms(data)

        const farmWithCoordinates = data.find(
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
        )

        const initialFarm = farmWithCoordinates || data[0]

        if (initialFarm) {
          setSelectedFarmId(String(initialFarm.id))
          setPreviousCrop(initialFarm.previous_crop || '')
          setFarmSize(
            initialFarm.farm_size_acres !== null &&
            initialFarm.farm_size_acres !== undefined
              ? String(initialFarm.farm_size_acres)
              : ''
          )
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load your registered farms.')
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

  // Update the form and clear old analysis when the farm changes.
  useEffect(() => {
    if (!selectedFarm) return

    setPreviousCrop(selectedFarm.previous_crop || '')

    setFarmSize(
      selectedFarm.farm_size_acres !== null &&
      selectedFarm.farm_size_acres !== undefined
        ? String(selectedFarm.farm_size_acres)
        : ''
    )

    setSoilData(null)
    setClimateData(null)
    setClimateSummary(null)
    setRotationPlan(null)
    setSoilMessage('')
    setClimateMessage('')
    setSaveMessage('')
    setError('')
  }, [selectedFarmId])

  // Retrieve saved plans for the selected farm.
  useEffect(() => {
    let active = true

    async function loadSavedPlans() {
      if (!selectedFarmId) {
        setSavedPlans([])
        return
      }

      try {
        setLoadingSavedPlans(true)
        setHistoryError('')

        const plans = await getRotationPlans(selectedFarmId)

        if (active) {
          setSavedPlans(plans)
        }
      } catch (err) {
        if (active) {
          setHistoryError(
            err.message || 'Unable to retrieve saved rotation plans.'
          )
        }
      } finally {
        if (active) {
          setLoadingSavedPlans(false)
        }
      }
    }

    loadSavedPlans()

    return () => {
      active = false
    }
  }, [selectedFarmId])

  // Retrieve soil and climate information for the selected farm.
  async function loadFarmIntelligence() {
    if (!selectedFarm) {
      setError('Please select a registered farm.')
      return false
    }

    if (!hasCoordinates) {
      setError(
        'This farm does not have valid GPS coordinates. Edit the farm in Farm Management before requesting an analysis.'
      )
      return false
    }

    setLoadingAnalysis(true)
    setError('')
    setRotationPlan(null)
    setSoilData(null)
    setClimateData(null)
    setClimateSummary(null)
    setSoilMessage('')
    setClimateMessage('')

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
          setSoilData(retrievedSoil)
          setSoilMessage('')
        } else {
          setSoilMessage(
            soilResult.value?.message ||
              'No FAO HWSD soil mapping unit was available at these coordinates.'
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
          setClimateData(retrievedClimate)
          setClimateSummary(summarizeClimate(retrievedClimate))
        } else {
          setClimateMessage('NASA POWER did not return usable climate data.')
        }
      } else {
        setClimateMessage(
          climateResult.reason?.message ||
            'Unable to retrieve NASA POWER climate information.'
        )
      }

      if (!retrievedSoil && !retrievedClimate) {
        setError(
          'Neither soil nor climate data could be retrieved for this farm. Check the backend and farm coordinates, then try again.'
        )
        return false
      }

      return {
        soil: retrievedSoil,
        climate: retrievedClimate
          ? summarizeClimate(retrievedClimate)
          : null,
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve farm intelligence.')
      return false
    } finally {
      setLoadingAnalysis(false)
    }
  }

  // Generate a preliminary crop rotation proposal.
  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaveMessage('')
    setRotationPlan(null)

    if (!selectedFarm) {
      setError('Please register or select a farm first.')
      return
    }

    if (!hasCoordinates) {
      setError(
        'Valid farm GPS coordinates are required. Please update this farm in Farm Management.'
      )
      return
    }

    if (!previousCrop) {
      setError('Please select the previous crop.')
      return
    }

    if (
      !farmSize ||
      !Number.isFinite(Number(farmSize)) ||
      Number(farmSize) <= 0
    ) {
      setError('Enter a valid farm size.')
      return
    }

    const loaded = await loadFarmIntelligence()

    if (!loaded) return

    const plan = getRotationPlan(
      previousCrop,
      priority,
      loaded.soil,
      loaded.climate
    )

    setRotationPlan(plan)
  }

  // Save the generated plan to Supabase.
  async function handleSavePlan() {
    if (!rotationPlan || !selectedFarm) return

    try {
      setSavingPlan(true)
      setSaveMessage('')
      setError('')

      const savedPlan = await createRotationPlan({
        farm_id: selectedFarm.id,
        previous_crop: previousCrop,
        farm_size_acres: Number(farmSize),
        priority,
        rotation_plan: rotationPlan,
        soil_snapshot: soilData,
        climate_snapshot: climateSummary,
      })

      setSavedPlans((current) => [
        savedPlan,
        ...current.filter((plan) => plan.id !== savedPlan.id),
      ])

      setSaveMessage('Your crop rotation plan has been saved successfully.')
    } catch (err) {
      setSaveMessage(
        err.message || 'Unable to save this crop rotation plan.'
      )
    } finally {
      setSavingPlan(false)
    }
  }

  // Refresh farm intelligence and generate a fresh proposal.
  async function handleRefresh() {
    if (!selectedFarm || !hasCoordinates) return

    setRotationPlan(null)
    setSaveMessage('')

    const loaded = await loadFarmIntelligence()

    if (loaded && previousCrop) {
      const plan = getRotationPlan(
        previousCrop,
        priority,
        loaded.soil,
        loaded.climate
      )

      setRotationPlan(plan)
    }
  }

  if (loadingFarms) {
    return (
      <div className="crop-rotation-page">
        <div className="crop-rotation-loading">
          <LoaderCircle className="spin" size={28} />
          <p>Loading your registered farms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="crop-rotation-page">
      <div className="crop-rotation-header">
        <div>
          <span className="crop-rotation-eyebrow">
            FARM DECISION SUPPORT
          </span>

          <h1>Crop Rotation Planner</h1>

          <p>
            Explore a preliminary crop sequence using your farm records,
            available soil estimates and recent NASA climate observations.
          </p>
        </div>

        <div className="crop-rotation-header-icon">
          <Sprout size={30} />
        </div>
      </div>

      {farms.length === 0 ? (
        <div className="crop-rotation-empty">
          <Sprout size={34} />
          <h2>No registered farms found</h2>

          <p>
            Register a farm in Farm Management before creating a crop
            rotation plan.
          </p>

          <Link
            to="/dashboard/farms"
            className="crop-rotation-primary-button"
          >
            Go to Farm Management
          </Link>
        </div>
      ) : (
        <>
          <div className="crop-rotation-main-grid">
            <section className="crop-rotation-form-card">
              <div className="crop-rotation-section-heading">
                <div className="crop-rotation-section-icon">
                  <Target size={20} />
                </div>

                <div>
                  <h2>Farm and rotation details</h2>
                  <p>Choose the farm and define your planning priority.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="crop-rotation-field">
                  <label htmlFor="rotation-farm">Registered farm</label>

                  <select
                    id="rotation-farm"
                    value={selectedFarmId}
                    onChange={(event) => {
                      setSelectedFarmId(event.target.value)
                      setRotationPlan(null)
                      setSaveMessage('')
                    }}
                  >
                    {farms.map((farm) => (
                      <option key={farm.id} value={String(farm.id)}>
                        {farm.farm_name}
                        {farm.community ? ` · ${farm.community}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedFarm && (
                  <div className="crop-rotation-farm-summary">
                    <MapPin size={17} />

                    <div>
                      <strong>
                        {selectedFarm.community ||
                          selectedFarm.district ||
                          selectedFarm.region ||
                          'Farm location'}
                      </strong>

                      <span>
                        {hasCoordinates
                          ? `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                          : 'GPS coordinates missing or invalid'}
                      </span>
                    </div>
                  </div>
                )}

                {!hasCoordinates && (
                  <div className="crop-rotation-warning">
                    <AlertTriangle size={17} />

                    <span>
                      Update this farm's GPS coordinates in Farm Management
                      before generating a data-based plan.
                    </span>
                  </div>
                )}

                <div className="crop-rotation-field">
                  <label htmlFor="previous-crop">Previous crop</label>

                  <select
                    id="previous-crop"
                    value={previousCrop}
                    onChange={(event) => setPreviousCrop(event.target.value)}
                    required
                  >
                    <option value="">Select previous crop</option>

                    {cropOptions.map((crop) => (
                      <option key={crop.value} value={crop.value}>
                        {crop.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="crop-rotation-field">
                  <label htmlFor="rotation-size">Farm size (acres)</label>

                  <input
                    id="rotation-size"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={farmSize}
                    onChange={(event) => setFarmSize(event.target.value)}
                    placeholder="Enter farm size"
                    required
                  />
                </div>

                <div className="crop-rotation-field">
                  <label htmlFor="rotation-priority">
                    Main planning priority
                  </label>

                  <select
                    id="rotation-priority"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="crop-rotation-error">
                    <AlertTriangle size={17} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="crop-rotation-submit"
                  disabled={loadingAnalysis || !hasCoordinates}
                >
                  {loadingAnalysis ? (
                    <>
                      <LoaderCircle size={18} className="spin" />
                      Analysing farm data...
                    </>
                  ) : (
                    <>
                      <Sprout size={18} />
                      Generate rotation plan
                    </>
                  )}
                </button>
              </form>
            </section>

            <section className="crop-rotation-data-card">
              <div className="crop-rotation-section-heading">
                <div className="crop-rotation-section-icon">
                  <Leaf size={20} />
                </div>

                <div>
                  <h2>Farm intelligence</h2>
                  <p>Data retrieved for the selected farm.</p>
                </div>
              </div>

              <div className="crop-rotation-data-block">
                <div className="crop-rotation-data-title">
                  <Leaf size={17} />
                  <strong>FAO soil profile</strong>

                  <span className={soilData ? 'data-available' : 'data-pending'}>
                    {soilData ? 'Retrieved' : 'Not retrieved'}
                  </span>
                </div>

                {topsoil ? (
                  <div className="crop-rotation-metrics">
                    <div>
                      <span>Topsoil pH</span>
                      <strong>{formatNumber(topsoil.ph_water, 2)}</strong>
                    </div>

                    <div>
                      <span>Clay</span>
                      <strong>{formatNumber(topsoil.clay_percent)}%</strong>
                    </div>

                    <div>
                      <span>Organic carbon</span>
                      <strong>
                        {formatNumber(topsoil.organic_carbon_percent)}%
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="crop-rotation-muted">
                    {soilMessage || 'Generate a plan to retrieve soil estimates.'}
                  </p>
                )}

                {soilData && (
                  <small>
                    HWSD v{soilData.dataset_version} · Mapping unit{' '}
                    {soilData.mapping_unit_id} · Approx. 1 km resolution
                  </small>
                )}
              </div>

              <div className="crop-rotation-data-block">
                <div className="crop-rotation-data-title">
                  <CloudSun size={17} />
                  <strong>NASA POWER climate</strong>

                  <span className={climateSummary ? 'data-available' : 'data-pending'}>
                    {climateSummary ? 'Retrieved' : 'Not retrieved'}
                  </span>
                </div>

                {climateSummary ? (
                  <div className="crop-rotation-metrics">
                    <div>
                      <span>Average temperature</span>
                      <strong>
                        {climateSummary.averageTemperature === null
                          ? 'Unavailable'
                          : `${formatNumber(climateSummary.averageTemperature)}°C`}
                      </strong>
                    </div>

                    <div>
                      <span>Rainfall total</span>
                      <strong>
                        {climateSummary.totalRainfall === null
                          ? 'Unavailable'
                          : `${formatNumber(climateSummary.totalRainfall)} mm`}
                      </strong>
                    </div>

                    <div>
                      <span>Average humidity</span>
                      <strong>
                        {climateSummary.averageHumidity === null
                          ? 'Unavailable'
                          : `${formatNumber(climateSummary.averageHumidity)}%`}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="crop-rotation-muted">
                    {climateMessage ||
                      'Generate a plan to retrieve recent climate data.'}
                  </p>
                )}

                {climateSummary?.period && (
                  <small>
                    {climateSummary.period.start} to {climateSummary.period.end}
                    {' · '}Recent observations, not a seasonal forecast
                  </small>
                )}
              </div>

              <button
                type="button"
                className="crop-rotation-refresh"
                onClick={handleRefresh}
                disabled={loadingAnalysis || !hasCoordinates}
              >
                <RefreshCw size={16} />
                Refresh farm data
              </button>
            </section>
          </div>

          {rotationPlan && (
            <section className="crop-rotation-results">
              <div className="crop-rotation-results-heading">
                <div>
                  <span className="crop-rotation-eyebrow">
                    PRELIMINARY ROTATION PROPOSAL
                  </span>

                  <h2>Your three-season sequence</h2>

                  <p>
                    Previous crop: <strong>{getCropLabel(previousCrop)}</strong>
                    {' · '}Farm size: <strong>{farmSize} acres</strong>
                  </p>

                  <div className="crop-rotation-save-area">
                    <button
                      type="button"
                      className="crop-rotation-save-button"
                      onClick={handleSavePlan}
                      disabled={savingPlan}
                    >
                      {savingPlan ? (
                        <>
                          <LoaderCircle size={17} className="spin" />
                          Saving plan...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={17} />
                          Save Rotation Plan
                        </>
                      )}
                    </button>

                    {saveMessage && (
                      <p className="crop-rotation-save-message">
                        {saveMessage}
                      </p>
                    )}
                  </div>
                </div>

                <CheckCircle2 size={28} />
              </div>

              <div className="crop-rotation-season-grid">
                {rotationPlan.crops.map((item, index) => (
                  <article
                    className="crop-rotation-season-card"
                    key={`${item.crop}-${index}`}
                  >
                    <span className="crop-rotation-season-number">
                      SEASON {index + 1}
                    </span>

                    <div className="crop-rotation-season-icon">
                      {index === 0 ? <Sprout size={25} /> : <WheatIcon />}
                    </div>

                    <h3>{getCropLabel(item.crop)}</h3>
                    <p>{item.reason}</p>
                  </article>
                ))}
              </div>

              <div className="crop-rotation-explanation">
                <div className="crop-rotation-explanation-title">
                  <Info size={19} />
                  <strong>Data interpretation and limitations</strong>
                </div>

                <ul>
                  {rotationPlan.notes.length > 0 ? (
                    rotationPlan.notes.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))
                  ) : (
                    <li>
                      The available soil and climate information was retrieved,
                      but this sequence is still a preliminary crop-family
                      rotation proposal.
                    </li>
                  )}

                  <li>
                    The sequence does not yet account for field-specific pest
                    and disease history, crop varieties, planting dates,
                    irrigation capacity, market demand or laboratory soil tests.
                  </li>

                  <li>
                    Farm size is recorded for planning context; it is not used
                    to estimate yield or input quantities.
                  </li>
                </ul>
              </div>
            </section>
          )}

          {/* Saved rotation plan history */}
          <section className="crop-rotation-history">
            <div className="crop-rotation-section-heading">
              <div className="crop-rotation-section-icon">
                <RotateCcw size={20} />
              </div>

              <div>
                <h2>Saved rotation plans</h2>
                <p>
                  Previous plans saved for {selectedFarm?.farm_name}.
                </p>
              </div>
            </div>

            {loadingSavedPlans ? (
              <div className="crop-rotation-history-loading">
                <LoaderCircle size={20} className="spin" />
                <span>Loading saved plans...</span>
              </div>
            ) : historyError ? (
              <p className="crop-rotation-history-error">
                {historyError}
              </p>
            ) : savedPlans.length === 0 ? (
              <div className="crop-rotation-history-empty">
                <Sprout size={25} />
                <strong>No saved plans yet</strong>
                <p>
                  Generate a rotation plan and save it to keep a record
                  for this farm.
                </p>
              </div>
            ) : (
              <div className="crop-rotation-history-list">
                {savedPlans.map((savedPlan) => {
                  const savedCrops =
                    savedPlan.rotation_plan?.crops || []

                  const savedDate = new Date(savedPlan.created_at)

                  return (
                    <article
                      className="crop-rotation-history-card"
                      key={savedPlan.id}
                    >
                      <div className="crop-rotation-history-top">
                        <div>
                          <span className="crop-rotation-season-number">
                            SAVED ROTATION PLAN
                          </span>

                          <h3>
                            {getCropLabel(savedPlan.previous_crop)} →{' '}
                            {savedCrops
                              .map((item) => getCropLabel(item.crop))
                              .join(' → ')}
                          </h3>
                        </div>

                        <CheckCircle2 size={21} />
                      </div>

                      <div className="crop-rotation-history-details">
                        <span>
                          <strong>Farm size:</strong>{' '}
                          {formatNumber(Number(savedPlan.farm_size_acres))} acres
                        </span>

                        <span>
                          <strong>Priority:</strong>{' '}
                          {priorityOptions.find(
                            (item) => item.value === savedPlan.priority
                          )?.label || savedPlan.priority}
                        </span>

                        <span>
                          <strong>Date:</strong>{' '}
                          {Number.isNaN(savedDate.getTime())
                            ? 'Date unavailable'
                            : savedDate.toLocaleString()}
                        </span>
                      </div>

                      <div className="crop-rotation-history-seasons">
                        {savedCrops.map((item, index) => (
                          <span key={`${savedPlan.id}-${index}`}>
                            Season {index + 1}: {getCropLabel(item.crop)}
                          </span>
                        ))}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <div className="crop-rotation-information">
            <div className="crop-rotation-information-icon">
              <Droplets size={20} />
            </div>

            <div>
              <strong>How this planner works</strong>

              <p>
                The current version uses crop-family rotation rules and checks
                available FAO soil and NASA POWER data. It does not yet calculate
                a validated yield prediction, fertilizer rate, irrigation
                schedule or planting calendar. Verify recommendations with
                local agricultural extension guidance before making farm
                investment decisions.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function WheatIcon() {
  return <Leaf size={25} />
}

export default CropRotation
