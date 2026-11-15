
import { useEffect, useState } from 'react'
import {
  FlaskConical,
  Save,
  Trash2,
  LoaderCircle,
  CalendarDays,
  ClipboardList,
  AlertCircle,
} from 'lucide-react'

import {
  getSoilTests,
  createSoilTest,
  deleteSoilTest,
} from '../services/soilTests'

import './SoilTestRecords.css'

const initialForm = {
  test_date: new Date().toISOString().slice(0, 10),
  laboratory_name: '',
  ph_water: '',
  nitrogen_percent: '',
  phosphorus_mg_kg: '',
  potassium_mg_kg: '',
  organic_carbon_percent: '',
  cec_cmolc_kg: '',
  electrical_conductivity_ds_m: '',
  soil_moisture_percent: '',
  notes: '',
}

const fields = [
  { name: 'ph_water', label: 'Soil pH', unit: 'pH', step: '0.01', min: 0, max: 14 },
  { name: 'nitrogen_percent', label: 'Nitrogen', unit: '%', step: '0.001' },
  { name: 'phosphorus_mg_kg', label: 'Available phosphorus', unit: 'mg/kg', step: '0.01' },
  { name: 'potassium_mg_kg', label: 'Available potassium', unit: 'mg/kg', step: '0.01' },
  { name: 'organic_carbon_percent', label: 'Organic carbon', unit: '%', step: '0.001' },
  { name: 'cec_cmolc_kg', label: 'Cation exchange capacity', unit: 'cmolc/kg', step: '0.01' },
  { name: 'electrical_conductivity_ds_m', label: 'Electrical conductivity', unit: 'dS/m', step: '0.001' },
  { name: 'soil_moisture_percent', label: 'Soil moisture', unit: '%', step: '0.01', min: 0, max: 100 },
]

function SoilTestRecords({ farmId, farmName }) {
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(initialForm)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function loadRecords() {
    if (!farmId) {
      setRecords([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await getSoilTests(farmId)
      setRecords(result)
    } catch (err) {
      console.error('Soil test loading error:', err)
      setError(err.message || 'Unable to load soil test records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setRecords([])
    setForm(initialForm)
    setShowForm(false)
    setMessage('')
    loadRecords()
  }, [farmId])

  function handleChange(event) {
    const { name, value } = event.target

    setForm(previous => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!farmId) {
      setError('Please select a farm first.')
      return
    }

    if (!form.test_date) {
      setError('Please enter the laboratory test date.')
      return
    }

    if (form.ph_water !== '') {
      const ph = Number(form.ph_water)

      if (!Number.isFinite(ph) || ph < 0 || ph > 14) {
        setError('Soil pH must be between 0 and 14.')
        return
      }
    }

    const numericFields = fields.map(field => field.name)

    const payload = {
      ...form,
      farm_id: farmId,
    }

    numericFields.forEach(field => {
      const value = form[field]

      payload[field] =
        value === '' ? null : Number(value)
    })

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const savedRecord = await createSoilTest(payload)

      setRecords(previous => [
        savedRecord,
        ...previous,
      ])

      setForm(initialForm)
      setShowForm(false)
      setMessage('Laboratory soil test saved successfully.')
    } catch (err) {
      console.error('Soil test saving error:', err)
      setError(err.message || 'Unable to save the soil test.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(recordId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this soil test record?'
    )

    if (!confirmed) return

    setDeletingId(recordId)
    setError('')
    setMessage('')

    try {
      await deleteSoilTest(recordId)

      setRecords(previous =>
        previous.filter(record => record.id !== recordId)
      )

      setMessage('Soil test record deleted.')
    } catch (err) {
      console.error('Soil test deletion error:', err)
      setError(err.message || 'Unable to delete this record.')
    } finally {
      setDeletingId(null)
    }
  }

  function formatValue(value, unit) {
    if (value === null || value === undefined || value === '') {
      return 'Not recorded'
    }

    return `${value} ${unit}`
  }

  return (
    <section className="soil-tests-section">
      <div className="soil-tests-heading">
        <div>
          <span className="soil-eyebrow">
            FARMER LABORATORY DATA
          </span>

          <h2>Soil Test Records</h2>

          <p>
            Store actual laboratory soil-test results for {farmName || 'your selected farm'}.
            These records are separate from FAO mapping estimates.
          </p>
        </div>

        <button
          type="button"
          className="soil-tests-add-button"
          onClick={() => {
            setShowForm(previous => !previous)
            setError('')
            setMessage('')
          }}
          disabled={!farmId}
        >
          <FlaskConical size={17} />
          {showForm ? 'Close form' : 'Add soil test'}
        </button>
      </div>

      {error && (
        <div className="soil-tests-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="soil-tests-alert success">
          <ClipboardList size={18} />
          <span>{message}</span>
        </div>
      )}

      {showForm && (
        <form
          className="soil-tests-form"
          onSubmit={handleSubmit}
        >
          <div className="soil-tests-form-heading">
            <h3>Enter laboratory results</h3>
            <p>
              Use the values and units provided in your laboratory report.
              Leave unavailable measurements empty.
            </p>
          </div>

          <div className="soil-tests-form-grid">
            <label className="soil-tests-field">
              <span>Test date *</span>
              <input
                type="date"
                name="test_date"
                value={form.test_date}
                onChange={handleChange}
                required
              />
            </label>

            <label className="soil-tests-field">
              <span>Laboratory name</span>
              <input
                type="text"
                name="laboratory_name"
                value={form.laboratory_name}
                onChange={handleChange}
                placeholder="Enter laboratory name"
              />
            </label>

            {fields.map(field => (
              <label
                className="soil-tests-field"
                key={field.name}
              >
                <span>
                  {field.label} ({field.unit})
                </span>

                <input
                  type="number"
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder="Leave empty if unavailable"
                  step={field.step}
                  min={field.min}
                  max={field.max}
                />
              </label>
            ))}
          </div>

          <label className="soil-tests-field soil-tests-notes">
            <span>Additional notes</span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Enter observations or other information from the laboratory report"
            />
          </label>

          <div className="soil-tests-form-actions">
            <button
              type="button"
              className="soil-tests-cancel-button"
              onClick={() => {
                setShowForm(false)
                setError('')
              }}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="soil-tests-save-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoaderCircle size={17} className="soil-tests-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save laboratory results
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <div className="soil-tests-records-heading">
        <h3>Saved laboratory records</h3>
        <span>{records.length} record(s)</span>
      </div>

      {loading ? (
        <div className="soil-tests-empty">
          <LoaderCircle size={22} className="soil-tests-spin" />
          <p>Loading laboratory records...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="soil-tests-empty">
          <FlaskConical size={30} />
          <h3>No laboratory records yet</h3>
          <p>
            Add a soil test report to keep measured soil values
            for this farm.
          </p>
        </div>
      ) : (
        <div className="soil-tests-record-list">
          {records.map(record => (
            <article
              className="soil-tests-record"
              key={record.id}
            >
              <div className="soil-tests-record-top">
                <div>
                  <span className="soil-tests-record-date">
                    <CalendarDays size={15} />
                    {record.test_date}
                  </span>

                  <h4>
                    {record.laboratory_name || 'Laboratory soil test'}
                  </h4>

                  <small>
                    {farmName || 'Selected farm'} · Laboratory record
                  </small>
                </div>

                <button
                  type="button"
                  className="soil-tests-delete-button"
                  onClick={() => handleDelete(record.id)}
                  disabled={deletingId === record.id}
                  title="Delete soil test"
                >
                  {deletingId === record.id ? (
                    <LoaderCircle size={17} className="soil-tests-spin" />
                  ) : (
                    <Trash2 size={17} />
                  )}
                </button>
              </div>

              <div className="soil-tests-result-grid">
                {fields.map(field => (
                  <div
                    className="soil-tests-result"
                    key={field.name}
                  >
                    <span>{field.label}</span>
                    <strong>
                      {formatValue(record[field.name], field.unit)}
                    </strong>
                  </div>
                ))}
              </div>

              {record.notes && (
                <div className="soil-tests-record-notes">
                  <strong>Notes</strong>
                  <p>{record.notes}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <p className="soil-tests-disclaimer">
        These are farmer-entered laboratory results. AgroShift does not
        independently verify the laboratory or the accuracy of entered values.
      </p>
    </section>
  )
}

export default SoilTestRecords
