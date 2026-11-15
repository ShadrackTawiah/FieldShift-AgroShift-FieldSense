
import { supabase } from './supabase'

// Get the currently logged-in farmer
async function getFarmerId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error

  if (!user) {
    throw new Error('Please log in to manage soil test records.')
  }

  return user.id
}

// Retrieve laboratory records for a selected farm
export async function getSoilTests(farmId) {
  if (!farmId) {
    throw new Error('Please select a farm.')
  }

  const farmerId = await getFarmerId()

  const { data, error } = await supabase
    .from('soil_test_records')
    .select('*')
    .eq('farmer_id', farmerId)
    .eq('farm_id', farmId)
    .order('test_date', { ascending: false })

  if (error) throw error

  return data || []
}

// Save a new laboratory soil test
export async function createSoilTest(testDetails) {
  const farmerId = await getFarmerId()

  if (!testDetails.farm_id) {
    throw new Error('A farm must be selected.')
  }

  const { data, error } = await supabase
    .from('soil_test_records')
    .insert({
      ...testDetails,
      farmer_id: farmerId,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

// Update an existing laboratory soil test
export async function updateSoilTest(testId, updates) {
  const farmerId = await getFarmerId()

  const { data, error } = await supabase
    .from('soil_test_records')
    .update(updates)
    .eq('id', testId)
    .eq('farmer_id', farmerId)
    .select()
    .single()

  if (error) throw error

  return data
}

// Delete a laboratory soil test
export async function deleteSoilTest(testId) {
  const farmerId = await getFarmerId()

  const { error } = await supabase
    .from('soil_test_records')
    .delete()
    .eq('id', testId)
    .eq('farmer_id', farmerId)

  if (error) throw error

  return true
}
