
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from('farmer_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Profile loading error:', error.message)
      setProfile(null)
      return
    }

    setProfile(data)
  }

  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Session error:', error.message)
      }

      if (!mounted) return

      const currentUser = data?.session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        await loadProfile(currentUser.id)
      }

      if (mounted) setLoading(false)
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setLoading(false)
        return
      }

      if (currentUser) {
        setTimeout(() => {
          if (mounted) loadProfile(currentUser.id)
        }, 0)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function registerFarmer(fullName, email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    return data
  }

  async function loginFarmer(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return data
  }

  async function logoutFarmer() {
    const { error } = await supabase.auth.signOut()

    if (error) throw error
  }

  async function updateFarmerProfile(updates) {
    if (!user) {
      throw new Error('Please log in first.')
    }

    const { data, error } = await supabase
      .from('farmer_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    setProfile(data)
    return data
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        registerFarmer,
        loginFarmer,
        logoutFarmer,
        updateFarmerProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}
