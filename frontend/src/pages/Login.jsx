
import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Sprout, Mail, Lock } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const { user, loading: authLoading, loginFarmer } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (authLoading) {
    return <div style={{ padding: 30 }}>Checking account...</div>
  }

  // Redirect already authenticated users to the dashboard.
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      setLoading(true)

      await loginFarmer(email.trim(), password)

      // Redirect after successful login.
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-brand">
          <div className="login-logo">
            <Sprout size={28} />
          </div>
          <h1>FieldShift</h1>
          <p>Farmer Login</p>
        </div>

        <div className="login-heading">
          <h2>Welcome back</h2>
          <p>Log in to access your farmer account and farm information.</p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>Email address</label>

          <div className="login-input">
            <Mail size={18} />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <label>Password</label>

          <div className="login-input">
            <Lock size={18} />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="login-register">
          Don't have an account?{' '}
          <Link to="/register">Create an account</Link>
        </p>

      </div>
    </div>
  )
}

export default Login
