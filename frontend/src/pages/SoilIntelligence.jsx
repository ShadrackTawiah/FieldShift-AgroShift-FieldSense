import { useEffect, useState } from 'react'

import SoilTestRecords from './SoilTestRecords'

import {
  Sprout,
  FlaskConical,
  Droplets,
  Layers,
  Mountain,
  Database,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  MapPin,
  LoaderCircle,
  Info,
} from 'lucide-react'

import { getFarms } from '../services/farms'
import './SoilIntelligence.css'

const API_BASE_URL = 'http://127.0.0.1:8000'

const soilProperties = [
  {
    name: 'Soil pH',
    description: 'Indicates how acidic or alkaline the soil is.',
    icon: FlaskConical,
    unit: 'pH',
    field: 'ph_water',
  },
  {
    name: 'Organic Carbon',
    description: 'Helps assess soil organic matter and soil health.',
    icon: Sprout,
    unit: '%',
    field: 'organic_carbon_percent',
  },
  {
    name: 'Clay Content',
    description: 'Influences soil water retention and drainage.',
    icon: Layers,
    unit: '%',
    field: 'clay_percent',
  },
  {
    name: 'Sand Content',
    description: 'Helps describe soil texture and drainage.',
    icon: Mountain,
    unit: '%',
    field: 'sand_percent',
  },
  {
    name: 'Soil Moisture',
    description: 'Describes the amount of water held in the soil.',
    icon: Droplets,
    unit: '%',
    field: null,
  },
  {
    name: 'Cation Exchange Capacity',
    description: 'Provides information about nutrient-holding capacity.',
    icon: Database,
    unit: 'cmolc/kg',
    field: 'cec_cmolc_kg',
  },
]

function SoilIntelligence() {
  const [farms, setFarms] = useState([])
  const [selectedFarmId, setSelectedFarmId] = useState('')
  const [soilData, setSoilData] = useState(null)

  const [farmsLoading, setFarmsLoading] = useState(true)
  const [soilLoading, setSoilLoading] = useState(false)

  const [error, setError] = useState('')
  const [farmError, setFarmError] = useState('')

  const selectedFarm = farms.find(
    farm => String(farm.id) === String(selectedFarmId)
  )

  const hasCoordinates =
    selectedFarm &&
    selectedFarm.latitude !== null &&
    selectedFarm.latitude !== undefined &&
    selectedFarm.longitude !== null &&
    selectedFarm.longitude !== undefined &&
    Number.isFinite(Number(selectedFarm.latitude)) &&
    Number.isFinite(Number(selectedFarm.longitude)) &&
    Number(selectedFarm.latitude) >= -90 &&
    Number(selectedFarm.latitude) <= 90 &&
    Number(selectedFarm.longitude) >= -180 &&
    Number(selectedFarm.longitude) <= 180

  // LOAD THE FARMER'S REGISTERED FARMS
  async function loadFarms() {
    setFarmsLoading(true)
    setFarmError('')

    try {
      const result = await getFarms()

      setFarms(result)

      const firstFarm = result.find(
        farm =>
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
      ) || result[0]

      setSelectedFarmId(firstFarm ? String(firstFarm.id) : '')
    } catch (err) {
      console.error('Farm loading error:', err)

      setFarmError(
        err.message || 'Unable to load your registered farms.'
      )
    } finally {
      setFarmsLoading(false)
    }
  }

  useEffect(() => {
    loadFarms()
  }, [])

  // RETRIEVE SOIL DATA FOR THE SELECTED FARM
  async function loadSoilData() {
    if (!selectedFarm || !hasCoordinates) {
      setSoilData(null)
      setError('')
      return
    }

    setSoilLoading(true)
    setError('')
    setSoilData(null)

    try {
      const latitude = Number(selectedFarm.latitude)
      const longitude = Number(selectedFarm.longitude)

      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
      })

      const response = await fetch(
        `${API_BASE_URL}/api/soil/hwsd?${params.toString()}`
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail || 'Unable to retrieve soil information.'
        )
      }

      setSoilData(result)

      if (!result.available) {
        setError(
          result.message || 'No soil data is available for this location.'
        )
      }
    } catch (err) {
      console.error('Soil data error:', err)

      setError(
        err.message || 'Unable to connect to the soil data service.'
      )
    } finally {
      setSoilLoading(false)
    }
  }

  useEffect(() => {
    if (farmsLoading) return

    if (selectedFarmId && hasCoordinates) {
      loadSoilData()
    } else {
      setSoilData(null)
      setError('')
    }
  }, [selectedFarmId, farmsLoading])

  const topsoil = soilData?.available
    ? soilData.profile?.find(layer => layer.layer === 'D1')
    : null

  const formatValue = value => {
    if (
      value === null ||
      value === undefined ||
      !Number.isFinite(Number(value))
    ) {
      return 'Unavailable'
    }

    return Number(value).toFixed(2)
  }

  return (
    <div className="soil-page">

      {/* HERO */}
      <section className="soil-hero">
        <span className="soil-eyebrow">
          SOIL & LAND INTELLIGENCE
        </span>

        <h1>Know the soil beneath your farm.</h1>

        <p>
          Explore soil properties that influence crop growth,
          water availability, nutrient retention and agricultural
          resilience.
        </p>

        <div className="soil-location">
          <span className="soil-location-dot"></span>

          {selectedFarm
            ? `${selectedFarm.farm_name} · ${selectedFarm.community || selectedFarm.region || selectedFarm.country || 'Registered Farm'}`
            : 'Select a registered farm to begin'}
        </div>
      </section>

      {/* FARM SELECTION */}
      <section className="soil-farm-selector">
        <div>
          <span className="soil-eyebrow">
            FARM LOCATION
          </span>

          <h2>Select a farm</h2>

          <p>
            Soil information will be retrieved using the selected
            farm's registered GPS coordinates.
          </p>
        </div>

        <div className="soil-farm-control">
          {farmsLoading ? (
            <div className="soil-loading">
              <LoaderCircle size={18} className="soil-spin" />
              Loading your farms...
            </div>
          ) : farms.length > 0 ? (
            <select
              value={selectedFarmId}
              onChange={event => {
                setSelectedFarmId(event.target.value)
              }}
            >
              {farms.map(farm => (
                <option key={farm.id} value={farm.id}>
                  {farm.farm_name}
                </option>
              ))}
            </select>
          ) : (
            <div className="soil-empty-message">
              No registered farms found. Add a farm in Farm Management.
            </div>
          )}
        </div>

        {selectedFarm && (
          <div className="soil-coordinate-info">
            <MapPin size={16} />

            {hasCoordinates
              ? `Latitude: ${selectedFarm.latitude} · Longitude: ${selectedFarm.longitude}`
              : 'GPS coordinates are missing or invalid for this farm.'}
          </div>
        )}

        {farmError && (
          <p className="soil-error">{farmError}</p>
        )}

        {selectedFarm && hasCoordinates && (
          <button
            type="button"
            className="soil-refresh-button"
            onClick={loadSoilData}
            disabled={soilLoading}
          >
            <RefreshCw
              size={16}
              className={soilLoading ? 'soil-spin' : ''}
            />
            Refresh soil data
          </button>
        )}
      </section>

      {/* LABORATORY SOIL TEST RECORDS */}
      {!farmsLoading && selectedFarm && (
        <SoilTestRecords
          farmId={selectedFarm.id}
          farmName={selectedFarm.farm_name}
        />
      )}

      {/* LOADING */}
      {soilLoading && (
        <div className="soil-status-panel">
          <LoaderCircle size={22} className="soil-spin" />

          <div>
            <strong>Retrieving soil information</strong>
            <p>
              Searching the FAO Harmonized World Soil Database
              for this farm's location.
            </p>
          </div>
        </div>
      )}

      {/* ERROR / NO DATA */}
      {!farmsLoading && !soilLoading && error && (
        <div className="soil-data-panel">
          <div className="soil-data-icon">
            <AlertCircle size={22} />
          </div>

          <div className="soil-data-content">
            <span className="soil-eyebrow">
              SOIL DATA STATUS
            </span>

            <h2>Soil information unavailable</h2>

            <p>{error}</p>
          </div>
        </div>
      )}

      {!farmsLoading && !soilLoading && !selectedFarm && !farmError && (
        <div className="soil-data-panel">
          <div className="soil-data-icon">
            <Info size={22} />
          </div>

          <div className="soil-data-content">
            <h2>No farm selected</h2>

            <p>
              Register a farm with GPS coordinates in Farm Management
              before retrieving its soil information.
            </p>
          </div>
        </div>
      )}

      {!farmsLoading && selectedFarm && !hasCoordinates && (
        <div className="soil-data-panel">
          <div className="soil-data-icon">
            <AlertCircle size={22} />
          </div>

          <div className="soil-data-content">
            <h2>Farm coordinates required</h2>

            <p>
              This farm does not have valid GPS coordinates.
              Update its location in Farm Management to retrieve soil data.
              You can still enter laboratory soil-test records above.
            </p>
          </div>
        </div>
      )}

      {/* SOIL PROPERTY CARDS */}
      {soilData?.available && topsoil && (
        <>
          <section className="soil-section">

            <div className="soil-section-heading">
              <div>
                <span className="soil-eyebrow">
                  TOPSOIL CHARACTERISTICS · 0–20 CM
                </span>

                <h2>Important Soil Properties</h2>

                <p>
                  Estimated soil characteristics for the selected
                  farm's mapped soil unit.
                </p>
              </div>
            </div>

            <div className="soil-property-grid">
              {soilProperties.map(property => {
                const Icon = property.icon

                const value = property.field
                  ? topsoil[property.field]
                  : null

                return (
                  <article
                    className="soil-property-card"
                    key={property.name}
                  >
                    <div className="soil-property-icon">
                      <Icon size={21} />
                    </div>

                    <h3>{property.name}</h3>

                    <p>{property.description}</p>

                    <span>
                      Unit: {property.unit}
                    </span>

                    <div className="soil-value-placeholder">
                      {value !== null && value !== undefined
                        ? `${formatValue(value)} ${property.unit}`
                        : 'Not available in this dataset'}
                    </div>
                  </article>
                )
              })}
            </div>

          </section>

          {/* ADDITIONAL TOPSOIL INDICATORS */}
          <section className="soil-section">
            <div className="soil-section-heading">
              <div>
                <span className="soil-eyebrow">
                  ADDITIONAL INDICATORS
                </span>

                <h2>More About Your Soil</h2>
              </div>
            </div>

            <div className="soil-extra-grid">

              <article className="soil-extra-card">
                <span>Bulk Density</span>
                <strong>
                  {formatValue(topsoil.bulk_density_g_cm3)}
                </strong>
                <small>g/cm³</small>
              </article>

              <article className="soil-extra-card">
                <span>Total Nitrogen</span>
                <strong>
                  {formatValue(topsoil.total_nitrogen_g_kg)}
                </strong>
                <small>g/kg</small>
              </article>

              <article className="soil-extra-card">
                <span>Soil Mapping Unit</span>
                <strong>
                  {soilData.mapping_unit_id}
                </strong>
                <small>HWSD identifier</small>
              </article>

            </div>
          </section>

          {/* SOIL DEPTH PROFILE */}
          <section className="soil-section">

            <div className="soil-section-heading">
              <div>
                <span className="soil-eyebrow">
                  SOIL PROFILE ANALYSIS
                </span>

                <h2>Soil Properties by Depth</h2>

                <p>
                  Explore how soil composition changes from the
                  surface down to 200 centimetres.
                </p>
              </div>
            </div>

            <div className="soil-profile-table-wrapper">
              <table className="soil-profile-table">
                <thead>
                  <tr>
                    <th>Depth</th>
                    <th>Sand</th>
                    <th>Silt</th>
                    <th>Clay</th>
                    <th>Organic Carbon</th>
                    <th>pH</th>
                    <th>CEC</th>
                  </tr>
                </thead>

                <tbody>
                  {soilData.profile.map(layer => (
                    <tr key={layer.layer}>
                      <td>
                        <strong>
                          {layer.top_depth_cm}–{layer.bottom_depth_cm} cm
                        </strong>
                      </td>

                      <td>{formatValue(layer.sand_percent)}%</td>
                      <td>{formatValue(layer.silt_percent)}%</td>
                      <td>{formatValue(layer.clay_percent)}%</td>
                      <td>
                        {formatValue(layer.organic_carbon_percent)}%
                      </td>
                      <td>{formatValue(layer.ph_water)}</td>
                      <td>{formatValue(layer.cec_cmolc_kg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </section>

          {/* DATA SOURCE */}
          <section className="soil-data-panel">

            <div className="soil-data-icon">
              <Database size={22} />
            </div>

            <div className="soil-data-content">
              <span className="soil-eyebrow">
                DATA INTEGRATION STATUS
              </span>

              <h2>FAO soil database connected</h2>

              <p>
                Soil profile retrieved successfully from
                {` ${soilData.source}`}. The dataset provides
                approximately 1 km spatial resolution and
                mapping-unit weighted estimates.
              </p>

              <div className="soil-source-details">
                <span>
                  Dataset version: {soilData.dataset_version}
                </span>

                <span>
                  Mapping unit: {soilData.mapping_unit_id}
                </span>

                <span>
                  Resolution: {soilData.spatial_resolution}
                </span>
              </div>

              <a
                href="https://www.fao.org/soils-portal/data-hub/soil-maps-and-databases/harmonized-world-soil-database-v12/en/"
                target="_blank"
                rel="noreferrer"
              >
                Explore FAO HWSD
                <ExternalLink size={14} />
              </a>
            </div>

          </section>

          {/* HWSD ESTIMATE LIMITATION */}
          <div className="soil-estimate-warning">
            <AlertCircle size={19} />

            <p>
              <strong>Important:</strong> These are mapping-unit
              weighted estimates, not laboratory measurements
              or exact measurements of the selected farm.
              Actual soil conditions may vary within the mapped
              area. Soil moisture is not provided by this dataset.
              Laboratory testing is recommended before making
              major fertilizer or soil-treatment decisions.
            </p>
          </div>
        </>
      )}

      {/* WHAT IS NOT YET MEASURED */}
      <section className="soil-section">
        <div className="soil-section-heading">
          <div>
            <span className="soil-eyebrow">
              DATA LIMITATIONS
            </span>

            <h2>What Is Not Yet Measured</h2>

            <p>
              AgroShift distinguishes mapped estimates from
              actual laboratory measurements.
            </p>
          </div>
        </div>

        <div className="soil-method-grid">

          <div>
            <strong>Field-level soil measurements</strong>
            <p>
              HWSD values are mapping-unit estimates at approximately
              1 km resolution. They are not laboratory measurements
              collected directly from this individual farm.
            </p>
          </div>

          <div>
            <strong>Soil moisture</strong>
            <p>
              The current HWSD integration does not provide a
              measured soil-moisture value for this farm.
            </p>
          </div>

          <div>
            <strong>Fertilizer and lime requirements</strong>
            <p>
              A current laboratory soil test and appropriate
              agronomic interpretation are needed before calculating
              reliable fertilizer or lime application rates.
            </p>
          </div>

        </div>
      </section>

      {/* WHY SOIL INTELLIGENCE MATTERS */}
      <section className="soil-method-panel">
        <h2>Why soil intelligence matters</h2>

        <div className="soil-method-grid">

          <div>
            <strong>Crop suitability</strong>
            <p>
              Soil texture, pH and organic carbon can help
              assess conditions for different crops.
            </p>
          </div>

          <div>
            <strong>Water management</strong>
            <p>
              Soil properties help explain how water enters,
              moves through and remains in the soil.
            </p>
          </div>

          <div>
            <strong>Crop rotation</strong>
            <p>
              Soil information can support decisions about
              nutrient management and crop sequencing.
            </p>
          </div>

        </div>
      </section>

      <p className="soil-source-note">
        Sources: FAO Harmonized World Soil Database v2.0 and
        farmer-entered laboratory records. Mapping-unit estimates
        are not a substitute for laboratory soil testing or
        field measurements.
      </p>

    </div>
  )
}

export default SoilIntelligence