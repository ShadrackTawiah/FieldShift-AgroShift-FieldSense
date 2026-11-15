
import { supabase } from './supabase'

async function getFarmerId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error

  if (!user) {
    throw new Error('Please log in to manage crop rotation plans.')
  }

  return user.id
}

// Retrieve saved rotation plans
export async function getRotationPlans(farmId) {
  const farmerId = await getFarmerId()

  let query = supabase
    .from('crop_rotation_plans')
    .select('*')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false })

  if (farmId) {
    query = query.eq('farm_id', farmId)
  }

  const { data, error } = await query

  if (error) throw error

  return data || []
}

// Save a new rotation plan
export async function createRotationPlan(planDetails) {
  const farmerId = await getFarmerId()

  const { data, error } = await supabase
    .from('crop_rotation_plans')
    .insert({
      ...planDetails,
      farmer_id: farmerId,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

// Delete a saved rotation plan
export async function deleteRotationPlan(planId) {
  const farmerId = await getFarmerId()

  const { error } = await supabase
    .from('crop_rotation_plans')
    .delete()
    .eq('id', planId)
    .eq('farmer_id', farmerId)

  if (error) throw error

  return true
}
