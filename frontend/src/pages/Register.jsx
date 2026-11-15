
import { useState } from 'react'
import {
  Link,
  useNavigate,
  Navigate,
} from 'react-router-dom'

import {
  Sprout,
  User,
  Mail,
  Lock,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import './Register.css'

function Register() {
  const navigate = useNavigate()

  const {
    user,
    loading: authLoading,
    registerFarmer,
  } = useAuth()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (authLoading) {
    return <div style={{ padding: 30 }}>Checking account...</div>
  }

  // Redirect authenticated users to their dashboard.
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (form.password.length < 6) {
      setError('Your password must contain at least 6 characters.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Your passwords do not match.')
      return
    }

    try {
      setLoading(true)

      const data = await registerFarmer(
        form.fullName.trim(),
        form.email.trim(),
        form.password
      )

      if (data.session) {
        navigate('/dashboard', { replace: true })
      } else {
        setSuccess(
          'Account created. Please check your email to confirm your account before logging in.'
        )
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">

        <div className="register-brand">
          <div className="register-logo">
            <Sprout size={28} />
          </div>
          <h1>FieldShift</h1>
          <p>Farmer Registration</p>
        </div>

        <div className="register-heading">
          <h2>Create your farmer account</h2>
          <p>
            Join FieldShift to manage your farm information
            and access agricultural insights.
          </p>
        </div>

        {error && (
          <div className="register-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="register-message success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <label>Full name</label>
          <div className="register-input">
            <User size={18} />
            <input
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <label>Email address</label>
          <div className="register-input">
            <Mail size={18} />
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <label>Password</label>
          <div className="register-input">
            <Lock size={18} />
            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </div>

          <label>Confirm password</label>
          <div className="register-input">
            <Lock size={18} />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="register-button"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

        </form>

        <p className="register-login">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </p>

      </div>
    </div>
  )
}

export default Register
