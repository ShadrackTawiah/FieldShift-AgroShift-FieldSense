
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
  CheckCircle2,
  MailCheck,
  ArrowRight,
  AlertCircle,
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
  const [success, setSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  if (authLoading) {
    return (
      <div className="register-loading">
        <Sprout size={30} />
        <p>Preparing your account...</p>
      </div>
    )
  }

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
    setSuccess(false)

    const fullName = form.fullName.trim()
    const email = form.email.trim()

    if (!fullName) {
      setError('Please enter your full name.')
      return
    }

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
        fullName,
        email,
        form.password
      )

      if (data.session) {
        navigate('/dashboard', { replace: true })
      } else {
        setRegisteredEmail(email)
        setSuccess(true)
      }
    } catch (err) {
      setError(
        err.message || 'Registration failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Email confirmation success screen
  if (success) {
    return (
      <div className="register-page">
        <div className="register-card confirmation-card">

          <div className="register-brand">
            <div className="register-logo">
              <Sprout size={30} />
            </div>

            <h1>FieldShift</h1>
            <p>Smart Agriculture. Better Decisions.</p>
          </div>

          <div className="confirmation-icon">
            <MailCheck size={42} />
          </div>

          <div className="confirmation-content">
            <span className="confirmation-label">
              REGISTRATION SUCCESSFUL
            </span>

            <h2>Check your email!</h2>

            <p className="confirmation-description">
              Your FieldShift account has been created successfully.
              We've sent you an email with a confirmation link.
            </p>

            <div className="confirmation-email">
              <Mail size={20} />
              <span>{registeredEmail}</span>
            </div>

            <div className="confirmation-instructions">
              <h3>What to do next</h3>

              <div className="confirmation-step">
                <div className="step-icon">
                  <CheckCircle2 size={19} />
                </div>
                <p>
                  Open your email inbox and look for the
                  <strong> FieldShift confirmation email.</strong>
                </p>
              </div>

              <div className="confirmation-step">
                <div className="step-icon">
                  <CheckCircle2 size={19} />
                </div>
                <p>
                  Open the email and click the
                  <strong> Confirm Email</strong> link.
                </p>
              </div>

              <div className="confirmation-step">
                <div className="step-icon">
                  <CheckCircle2 size={19} />
                </div>
                <p>
                  Once confirmed, return to FieldShift and log in
                  to access your account.
                </p>
              </div>
            </div>

            <div className="confirmation-tip">
              <AlertCircle size={19} />
              <p>
                <strong>Can't find the email?</strong>
                <br />
                Please check your Spam, Junk or Promotions folder.
              </p>
            </div>

            <button
              type="button"
              className="register-button confirmation-button"
              onClick={() => navigate('/login')}
            >
              Continue to Login
              <ArrowRight size={19} />
            </button>

            <p className="confirmation-footer">
              Thank you for joining FieldShift.
              <br />
              We're glad to have you on board!
            </p>
          </div>

        </div>
      </div>
    )
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
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <label htmlFor="fullName">Full name</label>

          <div className="register-input">
            <User size={18} />

            <input
              id="fullName"
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>

          <label htmlFor="email">Email address</label>

          <div className="register-input">
            <Mail size={18} />

            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="password">Password</label>

          <div className="register-input">
            <Lock size={18} />

            <input
              id="password"
              type="password"
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              autoComplete="new-password"
              required
            />
          </div>

          <label htmlFor="confirmPassword">
            Confirm password
          </label>

          <div className="register-input">
            <Lock size={18} />

            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="register-button"
          >
            {loading ? (
              'Creating your account...'
            ) : (
              <>
                Create Account
                <ArrowRight size={18} />
              </>
            )}
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
