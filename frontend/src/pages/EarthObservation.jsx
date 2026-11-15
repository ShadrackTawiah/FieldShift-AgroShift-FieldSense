
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  Satellite,
  Globe2,
  Waves,
  Mountain,
  Sprout,
  Cloud,
  ExternalLink,
  Activity,
  RefreshCw,
  MapPin,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'
import './EarthObservation.css'

import { getFarms } from '../services/farms'

// NASA GIBS MODIS TRUE COLOUR IMAGERY

function getImageryDate() {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - 1)

  return date.toISOString().split('T')[0]
}

const datasets = [
  {
    name: 'Landsat',
    provider: 'NASA / USGS',
    category: 'Land monitoring',
    description:
      'Satellite imagery for observing land cover, vegetation changes and agricultural land conditions.',
    uses: ['Land cover changes', 'Vegetation monitoring', 'Field assessment'],
    icon: Globe2,
    status: 'Planned integration',
    url: 'https://landsat.gsfc.nasa.gov/',
  },
  {
    name: 'MODIS',
    provider: 'NASA',
    category: 'Vegetation monitoring',
    description:
      'Earth observation imagery for tracking vegetation conditions and environmental changes.',
    uses: ['Vegetation trends', 'Land surface conditions', 'Seasonal monitoring'],
    icon: Sprout,
    status: 'Connected',
    url: 'https://modis.gsfc.nasa.gov/',
  },
  {
    name: 'SMAP',
    provider: 'NASA',
    category: 'Soil moisture',
    description:
      'Satellite observations designed to measure moisture in the upper layer of the soil.',
    uses: ['Soil moisture context', 'Drought monitoring', 'Water availability'],
    icon: Waves,
    status: 'Planned integration',
    url: 'https://smap.jpl.nasa.gov/',
  },
  {
    name: 'SRTM',
    provider: 'NASA / USGS',
    category: 'Elevation',
    description:
      'Digital elevation information that helps describe terrain and the topography of farmland.',
    uses: ['Elevation mapping', 'Terrain analysis', 'Slope assessment'],
    icon: Mountain,
    status: 'Planned integration',
    url: 'https://www.earthdata.nasa.gov/data/instruments/srtm',
  },
  {
    name: 'GPM / IMERG',
    provider: 'NASA',
    category: 'Precipitation',
    description:
      'Satellite-based precipitation estimates that help characterize rainfall patterns.',
    uses: ['Rainfall monitoring', 'Precipitation patterns', 'Water planning'],
    icon: Cloud,
    status: 'Planned integration',
    url: 'https://gpm.nasa.gov/data/imerg',
  },
  {
    name: 'NASA POWER',
    provider: 'NASA',
    category: 'Climate data',
    description:
      'Gridded meteorological and solar data currently connected to the FieldShift climate dashboard.',
    uses: ['Temperature', 'Rainfall', 'Humidity', 'Solar radiation'],
    icon: Activity,
    status: 'Connected',
    url: 'https://power.larc.nasa.gov/',
  },
]

function EarthObservation() {
  const [farms, setFarms] = useState([])
  const [selectedFarmId, setSelectedFarmId] = useState('')
  const [loadingFarms, setLoadingFarms] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [imageryDate, setImageryDate] = useState(getImageryDate())

  const selectedFarm = farms.find(
    (farm) => farm.id === selectedFarmId
  )

  const hasCoordinates =
    selectedFarm &&
    Number.isFinite(Number(selectedFarm.latitude)) &&
    Number.isFinite(Number(selectedFarm.longitude)) &&
    selectedFarm.latitude !== null &&
    selectedFarm.longitude !== null

  const mapCenter = hasCoordinates
    ? [
        Number(selectedFarm.latitude),
        Number(selectedFarm.longitude),
      ]
    : [4.90, -1.75]

  async function loadFarms() {
    try {
      setError('')
      setRefreshing(true)

      const data = await getFarms()

      setFarms(data)

      setSelectedFarmId((currentId) => {
        const currentFarm = data.find(
          (farm) => farm.id === currentId
        )

        if (currentFarm) return currentFarm.id

        const farmWithCoordinates = data.find(
          (farm) =>
            farm.latitude !== null &&
            farm.longitude !== null
        )

        return farmWithCoordinates?.id || data[0]?.id || ''
      })
    } catch (err) {
      setError(err.message || 'Unable to load registered farms.')
    } finally {
      setLoadingFarms(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadFarms()
  }, [])

  function refreshImagery() {
    setImageryDate(getImageryDate())
  }

  return (
    <div className="earth-observation-page">

      {/* HERO SECTION */}

      <section className="earth-hero">
        <span className="earth-eyebrow">
          SATELLITE & REMOTE SENSING
        </span>

        <h1>See your farm from space.</h1>

        <p>
          Explore real satellite imagery and Earth observation
          information to understand farmland, vegetation and
          changing environmental conditions.
        </p>

        <div className="earth-hero-meta">
          <Satellite size={17} />
          NASA Earth Data · FieldShift
        </div>
      </section>

      {/* SATELLITE IMAGERY VIEWER */}

      <section className="earth-section">

        <div className="earth-section-heading">
          <div>
            <span className="earth-eyebrow">
              SATELLITE EARTH OBSERVATION VIEWER
            </span>

            <h2>Satellite Imagery</h2>

            <p>
              Explore NASA MODIS Terra true-colour imagery
              around your registered farm.
            </p>
          </div>
        </div>

        {/* FARM SELECTION */}

        <div className="earth-viewer-controls">

          <div className="earth-farm-selector">
            <label htmlFor="earth-farm-select">
              Select your farm
            </label>

            <select
              id="earth-farm-select"
              value={selectedFarmId}
              onChange={(event) =>
                setSelectedFarmId(event.target.value)
              }
              disabled={loadingFarms || farms.length === 0}
            >
              <option value="">
                {loadingFarms
                  ? 'Loading farms...'
                  : farms.length === 0
                    ? 'No registered farms'
                    : 'Select a farm'}
              </option>

              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.farm_name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="earth-refresh-button"
            onClick={() => {
              loadFarms()
              refreshImagery()
            }}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'earth-spinning' : ''}
            />
            Refresh
          </button>

        </div>

        {error && (
          <div className="earth-error">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        {/* SELECTED FARM INFORMATION */}

        {selectedFarm && (
          <div className="earth-selected-farm">

            <div className="earth-selected-farm-icon">
              <MapPin size={20} />
            </div>

            <div>
              <strong>{selectedFarm.farm_name}</strong>

              <span>
                {selectedFarm.community || 'Community not provided'}
                {selectedFarm.region
                  ? ` · ${selectedFarm.region}`
                  : ''}
              </span>
            </div>

            {hasCoordinates && (
              <div className="earth-farm-coordinates">
                {Number(selectedFarm.latitude).toFixed(4)},
                {' '}
                {Number(selectedFarm.longitude).toFixed(4)}
              </div>
            )}

          </div>
        )}

        {!loadingFarms && farms.length === 0 && (
          <div className="earth-notice">
            <AlertCircle size={18} />

            <div>
              <strong>No farms registered</strong>

              <p>
                Register a farm before viewing its location
                in the satellite viewer.
              </p>

              <Link
                to="/dashboard/farms"
                className="earth-register-link"
              >
                Register a farm <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}

        {selectedFarm && !hasCoordinates && (
          <div className="earth-notice">
            <AlertCircle size={18} />

            <div>
              <strong>Farm coordinates are missing</strong>

              <p>
                Add latitude and longitude to this farm in
                Farm Management to centre the satellite map
                on its location.
              </p>

              <Link
                to="/dashboard/farms"
                className="earth-register-link"
              >
                Update farm details <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}

        {/* NASA MAP */}

        <div className="earth-map-container">

          <div className="earth-map-heading">
            <div>
              <span className="earth-map-label">
                <span className="earth-live-dot" />
                NASA GIBS SATELLITE IMAGERY
              </span>

              <h3>
                {hasCoordinates
                  ? selectedFarm.farm_name
                  : 'Ghana overview'}
              </h3>
            </div>

            <span className="earth-map-date">
              Imagery date: {imageryDate}
            </span>
          </div>

          <div className="earth-map">
            <MapContainer
              key={
                hasCoordinates
                  ? `${selectedFarm.id}-${mapCenter.join(',')}`
                  : 'ghana-overview'
              }
              center={mapCenter}
              zoom={hasCoordinates ? 11 : 6}
              scrollWheelZoom={true}
              className="earth-leaflet-map"
            >

              <TileLayer
                attribution='Imagery courtesy NASA Global Imagery Browse Services (GIBS)'
                url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${imageryDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`}
                maxNativeZoom={9}
                maxZoom={12}
              />

              {hasCoordinates && (
                <CircleMarker
                  center={mapCenter}
                  radius={9}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 3,
                    fillColor: '#16a34a',
                    fillOpacity: 1,
                  }}
                >
                  <Popup>
                    <strong>{selectedFarm.farm_name}</strong>
                    <br />
                    Registered farm location
                  </Popup>
                </CircleMarker>
              )}

            </MapContainer>
          </div>

          <div className="earth-map-footer">
            <span>
              <Satellite size={15} />
              Source: NASA GIBS / MODIS Terra
            </span>

            <span>
              <CheckCircle2 size={15} />
              Satellite imagery layer
            </span>
          </div>

        </div>

        <div className="earth-notice earth-imagery-note">
          <AlertCircle size={18} />

          <div>
            <strong>Understanding this imagery</strong>

            <p>
              This is NASA satellite true-colour imagery,
              not a live camera feed. Cloud cover, image
              availability and the satellite's spatial
              resolution can affect what you see. The map
              marker identifies your registered farm
              coordinates; it does not represent a verified
              farm boundary.
            </p>
          </div>
        </div>

      </section>

      {/* DATASET CATALOGUE */}

      <section className="earth-section">

        <div className="earth-section-heading">
          <div>
            <span className="earth-eyebrow">
              DATA CATALOGUE
            </span>

            <h2>Earth Observation Sources</h2>

            <p>
              Global datasets that can support agricultural
              monitoring and decision-making.
            </p>
          </div>
        </div>

        <div className="earth-dataset-grid">

          {datasets.map((dataset) => {
            const Icon = dataset.icon

            return (
              <article
                className="earth-dataset-card"
                key={dataset.name}
              >

                <div className="earth-card-top">
                  <div className="earth-dataset-icon">
                    <Icon size={22} />
                  </div>

                  <span
                    className={
                      dataset.status === 'Connected'
                        ? 'earth-status earth-status-connected'
                        : 'earth-status'
                    }
                  >
                    {dataset.status}
                  </span>
                </div>

                <span className="earth-category">
                  {dataset.category}
                </span>

                <h3>{dataset.name}</h3>

                <span className="earth-provider">
                  {dataset.provider}
                </span>

                <p className="earth-description">
                  {dataset.description}
                </p>

                <div className="earth-uses">
                  <strong>Potential applications</strong>

                  <ul>
                    {dataset.uses.map((use) => (
                      <li key={use}>{use}</li>
                    ))}
                  </ul>
                </div>

                <a
                  href={dataset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="earth-source-link"
                >
                  Explore dataset
                  <ExternalLink size={14} />
                </a>

              </article>
            )
          })}

        </div>

      </section>

      {/* INFORMATION PANEL */}

      <section className="earth-information">
        <div className="earth-information-icon">
          <Satellite size={23} />
        </div>

        <div>
          <h3>Understanding the data</h3>

          <p>
            NASA Earth observation products have different
            spatial resolutions, update schedules and coverage.
            FieldShift displays satellite imagery from NASA GIBS.
            Other datasets such as SMAP, GPM, Landsat and SRTM
            require their own data integrations before their
            measurements can be displayed.
          </p>
        </div>
      </section>

    </div>
  )
}

export default EarthObservation
