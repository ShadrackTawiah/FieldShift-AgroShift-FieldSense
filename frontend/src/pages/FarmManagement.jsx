
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  ArrowLeft,
  Plus,
  MapPin,
  Sprout,
  Trash2,
  RefreshCw,
  X,
  Tractor,
  Satellite,
  CheckCircle2,
  Pencil,
} from 'lucide-react'

import {
  getFarms,
  createFarm,
  updateFarm,
  deleteFarm,
} from '../services/farms'

import './FarmManagement.css'

const initialForm = {
  farm_name: '',
  country: 'Ghana',
  region: '',
  district: '',
  community: '',
  latitude: '',
  longitude: '',
  farm_size_acres: '',
  main_crops: [],
  previous_crop: '',
  irrigation_available: false,
}

const cropOptions = [
  'Maize',
  'Cassava',
  'Cowpea',
  'Groundnut',
  'Rice',
  'Yam',
  'Plantain',
  'Vegetables',
]

function FarmManagement() {
  const navigate = useNavigate()

  const [farms, setFarms] = useState([])
  const [form, setForm] = useState(initialForm)
  const [showForm, setShowForm] = useState(false)
  const [editingFarmId, setEditingFarmId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // LOAD FARM RECORDS

  async function loadFarms() {
    try {
      setLoading(true)
      setError('')

      const data = await getFarms()
      setFarms(data)
    } catch (err) {
      setError(err.message || 'Unable to load your farms.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFarms()
  }, [])

  // HANDLE FORM INPUTS

  function handleChange(event) {
    const { name, value, type, checked } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // HANDLE CROP SELECTION

  function handleCropChange(crop) {
    setForm((current) => ({
      ...current,
      main_crops: current.main_crops.includes(crop)
        ? current.main_crops.filter((item) => item !== crop)
        : [...current.main_crops, crop],
    }))
  }

  // OPEN FORM FOR A NEW FARM

  function handleNewFarm() {
    setForm(initialForm)
    setEditingFarmId(null)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  // OPEN FORM TO EDIT AN EXISTING FARM

  function handleEditFarm(farm) {
    setForm({
      farm_name: farm.farm_name || '',
      country: farm.country || 'Ghana',
      region: farm.region || '',
      district: farm.district || '',
      community: farm.community || '',
      latitude: farm.latitude ?? '',
      longitude: farm.longitude ?? '',
      farm_size_acres: farm.farm_size_acres ?? '',
      main_crops: farm.main_crops || [],
      previous_crop: farm.previous_crop || '',
      irrigation_available: farm.irrigation_available || false,
    })

    setEditingFarmId(farm.id)
    setShowForm(true)
    setError('')
    setSuccess('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // SAVE NEW OR UPDATED FARM

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!form.farm_name.trim()) {
      setError('Please enter your farm name.')
      return
    }

    const latitude =
      form.latitude === '' ? null : Number(form.latitude)

    const longitude =
      form.longitude === '' ? null : Number(form.longitude)

    const farmSize =
      form.farm_size_acres === ''
        ? null
        : Number(form.farm_size_acres)

    // Validate coordinate ranges

    if (
      (latitude !== null &&
        (!Number.isFinite(latitude) ||
          latitude < -90 ||
          latitude > 90)) ||
      (longitude !== null &&
        (!Number.isFinite(longitude) ||
          longitude < -180 ||
          longitude > 180))
    ) {
      setError('Please enter valid latitude and longitude coordinates.')
      return
    }

    // Require both coordinates together

    if (
      (latitude === null && longitude !== null) ||
      (latitude !== null && longitude === null)
    ) {
      setError('Please enter both latitude and longitude, or leave both empty.')
      return
    }

    if (
      farmSize !== null &&
      (!Number.isFinite(farmSize) || farmSize <= 0)
    ) {
      setError('Farm size must be greater than zero.')
      return
    }

    const farmDetails = {
      farm_name: form.farm_name.trim(),
      country: form.country.trim(),
      region: form.region.trim() || null,
      district: form.district.trim() || null,
      community: form.community.trim() || null,
      latitude,
      longitude,
      farm_size_acres: farmSize,
      main_crops: form.main_crops,
      previous_crop: form.previous_crop || null,
      irrigation_available: form.irrigation_available,
    }

    try {
      setSaving(true)

      if (editingFarmId) {
        await updateFarm(editingFarmId, farmDetails)

        setSuccess('Farm details updated successfully.')
      } else {
        await createFarm(farmDetails)

        setSuccess('Your farm has been registered successfully.')
      }

      setForm(initialForm)
      setEditingFarmId(null)
      setShowForm(false)

      await loadFarms()
    } catch (err) {
      setError(err.message || 'Unable to save your farm.')
    } finally {
      setSaving(false)
    }
  }

  // CANCEL FORM

  function handleCancel() {
    setForm(initialForm)
    setEditingFarmId(null)
    setShowForm(false)
    setError('')
  }

  // DELETE FARM

  async function handleDelete(farm) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${farm.farm_name}"?`
    )

    if (!confirmed) return

    try {
      setError('')
      setSuccess('')

      await deleteFarm(farm.id)

      setSuccess('Farm deleted successfully.')
      await loadFarms()
    } catch (err) {
      setError(err.message || 'Unable to delete this farm.')
    }
  }

  return (
    <div className="farm-management-page">



      {/* HERO SECTION */}

      <section className="farm-hero">
        <div className="farm-hero-content">
          <span className="farm-eyebrow">
            FARM MANAGEMENT
          </span>

          <h1>
            Manage your farms
            <br />
            <span>with confidence.</span>
          </h1>

          <p>
            Register and manage your farms to receive
            location-based climate, soil and agricultural
            insights through FieldShift.
          </p>

          <div className="farm-hero-meta">
            <Tractor size={17} />
            FieldShift · Farm Intelligence
          </div>

          <div className="farm-hero-highlights">
            <span>
              <CheckCircle2 size={14} />
              Farm records
            </span>

            <span>
              <CheckCircle2 size={14} />
              Location insights
            </span>

            <span>
              <CheckCircle2 size={14} />
              Crop information
            </span>
          </div>
        </div>

        <div className="farm-hero-visual">
          <div className="farm-hero-circle farm-circle-one" />
          <div className="farm-hero-circle farm-circle-two" />

          <div className="farm-hero-icon">
            <Sprout size={76} strokeWidth={1.2} />
          </div>

          <div className="farm-hero-floating-card">
            <Satellite size={18} />

            <div>
              <strong>Farm intelligence</strong>
              <span>Powered by Earth data</span>
            </div>
          </div>
        </div>
      </section>

      {/* ALERT MESSAGES */}

      {error && (
        <div className="farm-alert farm-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="farm-alert farm-alert-success">
          {success}
        </div>
      )}

      {/* REGISTERED FARMS */}

      <section className="farm-section">

        <div className="farm-section-heading">
          <div>
            <span className="farm-eyebrow">
              YOUR AGRICULTURAL LAND
            </span>

            <h2>Registered Farms</h2>

            <p>
              Your farms saved in FieldShift.
              Manage your farm records and location details.
            </p>
          </div>

          <div className="farm-section-actions">

            <button
              type="button"
              className="farm-refresh-button"
              onClick={loadFarms}
              disabled={loading}
            >
              <RefreshCw
                size={15}
                className={loading ? 'farm-spinning' : ''}
              />
              Refresh
            </button>

            <button
              type="button"
              className="farm-add-button"
              onClick={handleNewFarm}
            >
              <Plus size={17} />
              Add New Farm
            </button>

          </div>
        </div>

        {/* REGISTRATION / EDIT FORM */}

        {showForm && (
          <form className="farm-form" onSubmit={handleSubmit}>

            <div className="farm-form-heading">
              <div>
                <span className="farm-eyebrow">
                  {editingFarmId ? 'EDIT FARM DETAILS' : 'FARM REGISTRATION'}
                </span>

                <h2>
                  {editingFarmId ? 'Update Your Farm' : 'Register a New Farm'}
                </h2>

                <p>
                  {editingFarmId
                    ? 'Update your farm information, including its GPS coordinates.'
                    : 'Provide accurate information about your farm.'}
                </p>
              </div>
            </div>

            <div className="farm-form-grid">

              <div className="farm-field">
                <label>Farm name *</label>
                <input
                  name="farm_name"
                  value={form.farm_name}
                  onChange={handleChange}
                  placeholder="e.g. Green Valley Farm"
                  required
                />
              </div>

              <div className="farm-field">
                <label>Country</label>
                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                />
              </div>

              <div className="farm-field">
                <label>Region</label>
                <input
                  name="region"
                  value={form.region}
                  onChange={handleChange}
                  placeholder="e.g. Western Region"
                />
              </div>

              <div className="farm-field">
                <label>District</label>
                <input
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  placeholder="Enter district"
                />
              </div>

              <div className="farm-field">
                <label>Community</label>
                <input
                  name="community"
                  value={form.community}
                  onChange={handleChange}
                  placeholder="Enter community"
                />
              </div>

              <div className="farm-field">
                <label>Farm size (acres)</label>
                <input
                  type="number"
                  name="farm_size_acres"
                  value={form.farm_size_acres}
                  onChange={handleChange}
                  min="0.01"
                  step="any"
                  placeholder="e.g. 5"
                />
              </div>

              <div className="farm-field">
                <label>Latitude</label>
                <input
                  type="number"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  step="any"
                  placeholder="e.g. 4.90"
                />
              </div>

              <div className="farm-field">
                <label>Longitude</label>
                <input
                  type="number"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  step="any"
                  placeholder="e.g. -1.75"
                />
              </div>

              <div className="farm-field">
                <label>Previous crop</label>
                <select
                  name="previous_crop"
                  value={form.previous_crop}
                  onChange={handleChange}
                >
                  <option value="">Select previous crop</option>

                  {cropOptions.map((crop) => (
                    <option key={crop} value={crop}>
                      {crop}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* MAIN CROPS */}

            <div className="farm-crops-section">
              <label>Main crops grown on this farm</label>

              <div className="farm-crop-options">
                {cropOptions.map((crop) => (
                  <label key={crop} className="farm-crop-option">
                    <input
                      type="checkbox"
                      checked={form.main_crops.includes(crop)}
                      onChange={() => handleCropChange(crop)}
                    />

                    <span>{crop}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* IRRIGATION */}

            <label className="farm-irrigation-option">
              <input
                type="checkbox"
                name="irrigation_available"
                checked={form.irrigation_available}
                onChange={handleChange}
              />

              <span>
                Does this farm have irrigation facilities?
              </span>
            </label>

            {/* FORM BUTTONS */}

            <div className="farm-form-actions">

              <button
                type="button"
                className="farm-cancel-button"
                onClick={handleCancel}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="farm-save-button"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingFarmId
                    ? 'Update Farm'
                    : 'Save Farm'}
              </button>

            </div>

          </form>
        )}

        {/* FARM CARDS */}

        {loading ? (
          <div className="farm-empty-state">
            Loading your farms...
          </div>
        ) : farms.length === 0 ? (
          <div className="farm-empty-state">
            <div className="farm-empty-icon">
              <Sprout size={30} />
            </div>

            <h3>No farms registered yet</h3>

            <p>
              Add your first farm to start receiving
              farm-specific agricultural insights.
            </p>

            <button
              type="button"
              className="farm-add-button"
              onClick={handleNewFarm}
            >
              <Plus size={17} />
              Register Your First Farm
            </button>
          </div>
        ) : (
          <div className="farm-cards-grid">

            {farms.map((farm) => (
              <article className="farm-card" key={farm.id}>

                <div className="farm-card-top">

                  <div className="farm-dataset-icon">
                    <Sprout size={23} />
                  </div>

                  <span className="farm-card-status">
                    Registered Farm
                  </span>

                  <button
                    type="button"
                    className="farm-edit-button"
                    title="Edit farm"
                    onClick={() => handleEditFarm(farm)}
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    className="farm-delete-button"
                    title="Delete farm"
                    onClick={() => handleDelete(farm)}
                  >
                    <Trash2 size={17} />
                  </button>

                </div>

                <span className="farm-category">
                  FARM RECORD
                </span>

                <h3>{farm.farm_name}</h3>

                <span className="farm-provider">
                  {farm.community || 'Location details'}
                  {farm.region ? ` · ${farm.region}` : ''}
                </span>

                <p className="farm-description">
                  {[
                    farm.community,
                    farm.district,
                    farm.region,
                    farm.country,
                  ].filter(Boolean).join(', ') || 'Location not provided'}
                </p>

                <div className="farm-uses">
                  <strong>Farm information</strong>

                  <ul>
                    <li>
                      {farm.farm_size_acres
                        ? `${farm.farm_size_acres} acres`
                        : 'Farm size not provided'}
                    </li>

                    <li>
                      {farm.main_crops?.length
                        ? farm.main_crops.join(', ')
                        : 'No crops added'}
                    </li>

                    <li>
                      {farm.irrigation_available
                        ? 'Irrigation available'
                        : 'No irrigation recorded'}
                    </li>
                  </ul>
                </div>

                {farm.latitude !== null &&
                  farm.longitude !== null && (
                    <p className="farm-card-coordinates">
                      <MapPin size={14} />
                      Coordinates: {farm.latitude}, {farm.longitude}
                    </p>
                  )}

                <div className="farm-card-footer">
                  <span>
                    <CheckCircle2 size={14} />
                    Saved in FieldShift
                  </span>
                </div>

              </article>
            ))}

          </div>
        )}

      </section>

      {/* INFORMATION PANEL */}

      <section className="farm-information">
        <div className="farm-information-icon">
          <Satellite size={24} />
        </div>

        <div>
          <h3>How FieldShift uses your farm information</h3>

          <p>
            Farm location, size and crop details help FieldShift
            organize agricultural information for each farm.
            These records can support location-based climate,
            soil and satellite analysis as the corresponding
            data integrations become available.
          </p>
        </div>
      </section>

    </div>
  )
}

export default FarmManagement
