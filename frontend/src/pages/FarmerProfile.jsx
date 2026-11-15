
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  User,
  MapPin,
  Sprout,
  Save,
  Camera,
  Upload,
  ArrowLeft,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'

import './FarmerProfile.css'

const initialForm = {
  full_name: '',
  phone: '',
  farm_name: '',
  region: '',
  district: '',
  community: '',
  farm_size_acres: '',
  latitude: '',
  longitude: '',
  main_crops: [],
  irrigation_available: false,
  farming_experience_years: '',
  farming_goals: '',
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

function FarmerProfile() {
  const { user, profile, updateFarmerProfile } = useAuth()

  const [form, setForm] = useState(initialForm)
  const [profileImage, setProfileImage] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile) return

    setForm({
      ...initialForm,
      ...profile,
      farm_size_acres: profile.farm_size_acres ?? '',
      latitude: profile.latitude ?? '',
      longitude: profile.longitude ?? '',
      farming_experience_years:
        profile.farming_experience_years ?? '',
      main_crops: Array.isArray(profile.main_crops)
        ? profile.main_crops
        : [],
      irrigation_available:
        profile.irrigation_available ?? false,
    })

    setProfileImage(profile.profile_image_url || '')
  }, [profile])

  function handleChange(event) {
    const { name, value, type, checked } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))

    setMessage('')
    setError('')
  }

  function handleCropChange(crop) {
    setForm((previous) => ({
      ...previous,
      main_crops: previous.main_crops.includes(crop)
        ? previous.main_crops.filter((item) => item !== crop)
        : [...previous.main_crops, crop],
    }))

    setMessage('')
    setError('')
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0]

    if (!file) return

    setMessage('')
    setError('')

    if (!user) {
      setError('Please sign in before uploading a profile picture.')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Your image must be smaller than 5 MB.')
      event.target.value = ''
      return
    }

    setUploadingImage(true)

    try {
      const fileExtension =
        file.name.split('.').pop().toLowerCase()

      const filePath =
        `${user.id}/profile-${Date.now()}.${fileExtension}`

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      const imageUrl = data.publicUrl

      await updateFarmerProfile({
        profile_image_url: imageUrl,
      })

      setProfileImage(imageUrl)
      setMessage(
        'Your profile picture has been uploaded successfully.'
      )
    } catch (err) {
      setError(
        err.message || 'Unable to upload your profile picture.'
      )
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setLoading(true)
    setMessage('')
    setError('')

    const latitude =
      form.latitude === '' ? null : Number(form.latitude)

    const longitude =
      form.longitude === '' ? null : Number(form.longitude)

    const farmSize =
      form.farm_size_acres === ''
        ? null
        : Number(form.farm_size_acres)

    const experience =
      form.farming_experience_years === ''
        ? null
        : Number(form.farming_experience_years)

    // Validate farm coordinates
    if (
      latitude !== null &&
      (!Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90)
    ) {
      setError('Latitude must be between -90 and 90.')
      setLoading(false)
      return
    }

    if (
      longitude !== null &&
      (!Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180)
    ) {
      setError('Longitude must be between -180 and 180.')
      setLoading(false)
      return
    }

    if (
      (latitude === null) !== (longitude === null)
    ) {
      setError(
        'Please enter both latitude and longitude, or leave both empty.'
      )
      setLoading(false)
      return
    }

    if (
      farmSize !== null &&
      (!Number.isFinite(farmSize) || farmSize < 0)
    ) {
      setError('Farm size must be a valid non-negative number.')
      setLoading(false)
      return
    }

    if (
      experience !== null &&
      (!Number.isInteger(experience) || experience < 0)
    ) {
      setError(
        'Farming experience must be a whole number of years.'
      )
      setLoading(false)
      return
    }

    try {
      await updateFarmerProfile({
        ...form,
        farm_size_acres: farmSize,
        latitude,
        longitude,
        farming_experience_years: experience,
      })

      setMessage(
        'Your farmer profile has been saved successfully.'
      )
    } catch (err) {
      setError(err.message || 'Unable to save your profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="farmer-profile-page">

      {/* Back to Dashboard */}
      <Link to="/dashboard" className="farmer-back-button">
        <ArrowLeft size={17} />
        <span>Back to Dashboard</span>
      </Link>

      {/* Profile Header */}
      <div className="farmer-profile-header">
        <div>
          <span className="farmer-profile-eyebrow">
            FARMER ACCOUNT
          </span>

          <h1>My Farmer Profile</h1>

          <p>
            Manage your personal details and information about your farm.
          </p>
        </div>

        <div className="farmer-profile-avatar">
          {profileImage ? (
            <img src={profileImage} alt="Farmer profile" />
          ) : (
            <User size={28} />
          )}
        </div>
      </div>

      {/* Account Information */}
      <div className="farmer-account-info">
        <span>Signed in as</span>
        <strong>{user?.email}</strong>
      </div>

      {message && (
        <div className="farmer-profile-success">
          {message}
        </div>
      )}

      {error && (
        <div className="farmer-profile-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* Profile Picture */}
        <section className="farmer-profile-section">
          <div className="farmer-section-heading">
            <Camera size={20} />

            <div>
              <h2>Profile Picture</h2>
              <p>
                Upload a picture so your farmer account has a personal identity.
              </p>
            </div>
          </div>

          <div className="farmer-image-upload">
            <div className="farmer-image-preview">
              {profileImage ? (
                <img src={profileImage} alt="Your profile" />
              ) : (
                <User size={42} />
              )}
            </div>

            <div className="farmer-image-upload-details">
              <h3>
                {profileImage ? 'Change your picture' : 'Add your picture'}
              </h3>

              <p>
                Choose a JPG, PNG or other image file. Maximum size: 5 MB.
              </p>

              <label className="farmer-upload-button">
                <Upload size={17} />

                {uploadingImage
                  ? 'Uploading...'
                  : profileImage
                    ? 'Change Photo'
                    : 'Upload Photo'}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  hidden
                />
              </label>
            </div>
          </div>
        </section>

        {/* Personal Information */}
        <section className="farmer-profile-section">
          <div className="farmer-section-heading">
            <User size={20} />

            <div>
              <h2>Personal Information</h2>
              <p>Tell us how to identify and contact you.</p>
            </div>
          </div>

          <div className="farmer-profile-grid">
            <div className="farmer-field">
              <label htmlFor="full_name">Full name</label>

              <input
                id="full_name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="farmer-field">
              <label>Email address</label>

              <input
                type="email"
                value={user?.email || ''}
                disabled
              />
            </div>

            <div className="farmer-field">
              <label htmlFor="phone">Phone number</label>

              <input
                id="phone"
                name="phone"
                value={form.phone || ''}
                onChange={handleChange}
                placeholder="Your phone number"
              />
            </div>
          </div>
        </section>

        {/* Farm Information */}
        <section className="farmer-profile-section">
          <div className="farmer-section-heading">
            <MapPin size={20} />

            <div>
              <h2>Farm Information</h2>
              <p>Provide the location and size of your farm.</p>
            </div>
          </div>

          <div className="farmer-profile-grid">
            <div className="farmer-field">
              <label htmlFor="farm_name">Farm name</label>

              <input
                id="farm_name"
                name="farm_name"
                value={form.farm_name || ''}
                onChange={handleChange}
                placeholder="Enter your farm name"
              />
            </div>

            <div className="farmer-field">
              <label htmlFor="region">Region</label>

              <input
                id="region"
                name="region"
                value={form.region || ''}
                onChange={handleChange}
                placeholder="e.g. Western Region"
              />
            </div>

            <div className="farmer-field">
              <label htmlFor="district">District</label>

              <input
                id="district"
                name="district"
                value={form.district || ''}
                onChange={handleChange}
                placeholder="Enter your district"
              />
            </div>

            <div className="farmer-field">
              <label htmlFor="community">Community</label>

              <input
                id="community"
                name="community"
                value={form.community || ''}
                onChange={handleChange}
                placeholder="Enter your community"
              />
            </div>

            <div className="farmer-field">
              <label htmlFor="farm_size_acres">Farm size (acres)</label>

              <input
                id="farm_size_acres"
                type="number"
                min="0"
                step="any"
                name="farm_size_acres"
                value={form.farm_size_acres}
                onChange={handleChange}
                placeholder="e.g. 5"
              />
            </div>

            <div className="farmer-field">
              <label htmlFor="latitude">Latitude</label>

              <input
                id="latitude"
                type="number"
                min="-90"
                max="90"
                step="any"
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                placeholder="Farm latitude"
              />
            </div>

            <div className="farmer-field">
              <label htmlFor="longitude">Longitude</label>

              <input
                id="longitude"
                type="number"
                min="-180"
                max="180"
                step="any"
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                placeholder="Farm longitude"
              />
            </div>
          </div>
        </section>

        {/* Farming Information */}
        <section className="farmer-profile-section">
          <div className="farmer-section-heading">
            <Sprout size={20} />

            <div>
              <h2>Farming Information</h2>
              <p>Help FieldShift understand your farming activities.</p>
            </div>
          </div>

          <div className="farmer-field">
            <label>Main crops you grow</label>

            <div className="farmer-crop-options">
              {cropOptions.map((crop) => (
                <label key={crop} className="farmer-crop-option">
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

          <div className="farmer-profile-grid farmer-extra-fields">
            <div className="farmer-field">
              <label htmlFor="farming_experience_years">
                Years of farming experience
              </label>

              <input
                id="farming_experience_years"
                type="number"
                min="0"
                step="1"
                name="farming_experience_years"
                value={form.farming_experience_years}
                onChange={handleChange}
                placeholder="Number of years"
              />
            </div>

            <div className="farmer-field farmer-irrigation">
              <label>
                <input
                  type="checkbox"
                  name="irrigation_available"
                  checked={form.irrigation_available}
                  onChange={handleChange}
                />

                I have irrigation facilities on my farm
              </label>
            </div>
          </div>

          <div className="farmer-field farmer-goals">
            <label htmlFor="farming_goals">
              What are your main farming goals?
            </label>

            <textarea
              id="farming_goals"
              name="farming_goals"
              value={form.farming_goals || ''}
              onChange={handleChange}
              placeholder="Describe what you want to achieve on your farm..."
              rows="4"
            />
          </div>
        </section>

        {/* Save Profile */}
        <div className="farmer-profile-actions">
          <button type="submit" disabled={loading}>
            <Save size={18} />

            {loading ? 'Saving Profile...' : 'Save My Profile'}
          </button>
        </div>

      </form>
    </div>
  )
}

export default FarmerProfile
