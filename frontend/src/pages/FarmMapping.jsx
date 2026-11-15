
import { useState } from 'react'

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from 'react-leaflet'

import {
  MapPin,
  Crosshair,
  Layers,
  Info,
  Search,
  LoaderCircle,
  LocateFixed,
  X,
} from 'lucide-react'

import 'leaflet/dist/leaflet.css'
import './FarmMapping.css'

const pilotLocation = {
  name: 'Takoradi Pilot Location',
  latitude: 4.90,
  longitude: -1.75,
}

function FarmMapping() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const [selectedLocation, setSelectedLocation] = useState({
    name: pilotLocation.name,
    latitude: pilotLocation.latitude,
    longitude: pilotLocation.longitude,
  })

  // SEARCH FOR LOCATIONS

  async function handleSearch(event) {
    event.preventDefault()

    if (!search.trim()) {
      setError('Enter a location to search.')
      return
    }

    try {
      setSearching(true)
      setError('')
      setResults([])

      const params = new URLSearchParams({
        q: search.trim(),
        limit: '7',
      })

      const response = await fetch(
        `https://photon.komoot.io/api/?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error('Location search is temporarily unavailable.')
      }

      const data = await response.json()

      if (!data.features || data.features.length === 0) {
        setError('No matching locations found. Try another search.')
        return
      }

      setResults(data.features)
    } catch (err) {
      setError(
        err.message || 'Unable to search for this location.'
      )
    } finally {
      setSearching(false)
    }
  }

  // FORMAT LOCATION NAME

  function getLocationName(properties) {
    return [
      properties.name,
      properties.street,
      properties.district,
      properties.city,
      properties.state,
      properties.country,
    ]
      .filter(Boolean)
      .filter((item, index, array) => array.indexOf(item) === index)
      .join(', ')
  }

  // SELECT A SEARCH RESULT

  function handleSelectLocation(place) {
    const [longitude, latitude] = place.geometry.coordinates

    const name =
      getLocationName(place.properties || {}) ||
      'Selected Location'

    setSelectedLocation({
      name,
      latitude,
      longitude,
    })

    setSearch(name)
    setResults([])
    setError('')
  }

  // RETURN TO PILOT LOCATION

  function handleResetLocation() {
    setSelectedLocation({
      name: pilotLocation.name,
      latitude: pilotLocation.latitude,
      longitude: pilotLocation.longitude,
    })

    setSearch('')
    setResults([])
    setError('')
  }

  return (
    <div className="farm-mapping-page">

      {/* HERO */}

      <section className="mapping-hero">

        <span className="mapping-eyebrow">
          GEOSPATIAL FARM INTELLIGENCE
        </span>

        <h1>
          Map your farm.
          <br />
          <span>Understand your land.</span>
        </h1>

        <p>
          Search for locations, explore geographical
          positions and prepare your land for spatial
          analysis, climate monitoring and crop
          rotation planning.
        </p>

        <div className="mapping-location-tag">
          <MapPin size={15} />
          {selectedLocation.name}
        </div>

      </section>

      {/* LOCATION SEARCH */}

      <section className="mapping-search-section">

        <div className="mapping-search-heading">
          <div className="mapping-search-icon">
            <Search size={21} />
          </div>

          <div>
            <h2>Search for a Location</h2>

            <p>
              Find a town, community, farm or landmark
              anywhere in the world.
            </p>
          </div>
        </div>

        <form
          className="mapping-search-form"
          onSubmit={handleSearch}
        >

          <div className="mapping-search-input-wrapper">
            <MapPin size={19} />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setError('')
              }}
              placeholder="Search e.g. Sankor, Western Region, Ghana"
              aria-label="Search for a location"
            />

            {search && (
              <button
                type="button"
                className="mapping-clear-search"
                onClick={() => {
                  setSearch('')
                  setResults([])
                  setError('')
                }}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="mapping-search-button"
            disabled={searching}
          >
            {searching ? (
              <>
                <LoaderCircle size={17} className="mapping-spinner" />
                Searching...
              </>
            ) : (
              <>
                <Search size={17} />
                Search Location
              </>
            )}
          </button>

        </form>

        {error && (
          <div className="mapping-search-error">
            {error}
          </div>
        )}

        {/* SEARCH RESULTS */}

        {results.length > 0 && (
          <div className="mapping-search-results">

            <div className="mapping-results-heading">
              <strong>Search Results</strong>

              <span>
                {results.length} locations found
              </span>
            </div>

            {results.map((place, index) => {
              const name = getLocationName(
                place.properties || {}
              )

              const [longitude, latitude] =
                place.geometry.coordinates

              return (
                <button
                  type="button"
                  key={`${longitude}-${latitude}-${index}`}
                  className="mapping-result-item"
                  onClick={() => handleSelectLocation(place)}
                >
                  <span className="mapping-result-icon">
                    <MapPin size={18} />
                  </span>

                  <span className="mapping-result-text">
                    <strong>
                      {name || 'Unnamed Location'}
                    </strong>

                    <small>
                      {latitude.toFixed(5)}, {longitude.toFixed(5)}
                    </small>
                  </span>

                  <span className="mapping-result-action">
                    View on Map
                  </span>
                </button>
              )
            })}

          </div>
        )}

      </section>

      {/* LOCATION SUMMARY */}

      <section className="mapping-summary-grid">

        <article className="mapping-summary-card">

          <div className="mapping-summary-icon">
            <MapPin size={20} />
          </div>

          <span>Selected Location</span>

          <strong>
            {selectedLocation.name}
          </strong>

        </article>

        <article className="mapping-summary-card">

          <div className="mapping-summary-icon">
            <Crosshair size={20} />
          </div>

          <span>Latitude</span>

          <strong>
            {selectedLocation.latitude.toFixed(5)}°
          </strong>

        </article>

        <article className="mapping-summary-card">

          <div className="mapping-summary-icon">
            <Layers size={20} />
          </div>

          <span>Longitude</span>

          <strong>
            {selectedLocation.longitude.toFixed(5)}°
          </strong>

        </article>

      </section>

      {/* INTERACTIVE MAP */}

      <section className="mapping-main-panel">

        <div className="mapping-panel-heading">

          <div>
            <span className="mapping-eyebrow">
              INTERACTIVE MAP
            </span>

            <h2>Farm Location Explorer</h2>

            <p>
              Explore the selected location on the map.
              Select another search result to move the marker.
            </p>
          </div>

          <span className="mapping-status">
            <span></span>
            Map Active
          </span>

        </div>

        <div className="mapping-selected-location">

          <div>
            <MapPin size={17} />

            <div>
              <strong>{selectedLocation.name}</strong>

              <span>
                {selectedLocation.latitude.toFixed(5)},
                {' '}
                {selectedLocation.longitude.toFixed(5)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetLocation}
            className="mapping-reset-button"
          >
            <LocateFixed size={16} />
            Reset to Takoradi
          </button>

        </div>

        <div className="farm-map-container">

          <MapContainer
            key={`${selectedLocation.latitude}-${selectedLocation.longitude}`}
            center={[
              selectedLocation.latitude,
              selectedLocation.longitude,
            ]}
            zoom={13}
            scrollWheelZoom={true}
            className="farm-leaflet-map"
          >

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <CircleMarker
              center={[
                selectedLocation.latitude,
                selectedLocation.longitude,
              ]}
              radius={11}
              pathOptions={{
                color: '#ffffff',
                weight: 3,
                fillColor: '#16a34a',
                fillOpacity: 1,
              }}
            >

              <Popup>
                <strong>{selectedLocation.name}</strong>

                <br />

                Latitude: {selectedLocation.latitude.toFixed(5)}

                <br />

                Longitude: {selectedLocation.longitude.toFixed(5)}
              </Popup>

            </CircleMarker>

          </MapContainer>

        </div>

        <div className="mapping-map-footer">
          <span>
            <MapPin size={15} />
            Selected location marker
          </span>

          <span>
            Map data © OpenStreetMap contributors
          </span>
        </div>

      </section>

      {/* INFORMATION */}

      <section className="mapping-information-panel">

        <div className="mapping-information-icon">
          <Info size={21} />
        </div>

        <div>
          <h3>About Location Mapping</h3>

          <p>
            FieldShift uses geographical coordinates to
            identify the location of a farm and support
            location-based agricultural analysis. Search
            results provide approximate place positions.
            Always verify that the marker is on your actual
            farm before using its coordinates for analysis.
            This map currently displays a location marker,
            not a verified farm boundary.
          </p>
        </div>

      </section>

    </div>
  )
}

export default FarmMapping
