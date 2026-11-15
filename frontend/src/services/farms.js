
import { supabase } from './supabase'

// Get the currently logged-in farmer
async function getFarmerId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error

  if (!user) {
    throw new Error('Please log in to manage your farms.')
  }

  return user.id
}

// Retrieve all farms belonging to the logged-in farmer
export async function getFarms() {
  const farmerId = await getFarmerId()

  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data || []
}

// Register a new farm
export async function createFarm(farmDetails) {
  const farmerId = await getFarmerId()

  const { data, error } = await supabase
    .from('farms')
    .insert({
      ...farmDetails,
      farmer_id: farmerId,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

// Update an existing farm
export async function updateFarm(farmId, updates) {
  const farmerId = await getFarmerId()

  const { data, error } = await supabase
    .from('farms')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', farmId)
    .eq('farmer_id', farmerId)
    .select()
    .single()

  if (error) throw error

  return data
}

// Delete a farm
export async function deleteFarm(farmId) {
  const farmerId = await getFarmerId()

  const { error } = await supabase
    .from('farms')
    .delete()
    .eq('id', farmId)
    .eq('farmer_id', farmerId)

  if (error) throw error

  return true
}
