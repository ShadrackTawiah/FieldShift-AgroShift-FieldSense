
const API_BASE_URL = 'http://127.0.0.1:8000'

// NASA POWER climate data
export async function getClimateData(
  latitude = 4.90,
  longitude = -1.75,
  days = 30
) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    days: String(days),
  })

  const response = await fetch(
    `${API_BASE_URL}/api/climate/power?${params.toString()}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      error.detail || 'Unable to retrieve NASA climate data.'
    )
  }

  return response.json()
}

// FAO Harmonized World Soil Database
export async function getSoilData(latitude, longitude) {
  if (
    !Number.isFinite(Number(latitude)) ||
    !Number.isFinite(Number(longitude))
  ) {
    throw new Error('Valid farm coordinates are required for soil analysis.')
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  })

  const response = await fetch(
    `${API_BASE_URL}/api/soil/hwsd?${params.toString()}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      error.detail || 'Unable to retrieve FAO soil data.'
    )
  }

  return response.json()
}
