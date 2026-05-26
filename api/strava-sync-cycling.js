const { createClient } = require('@supabase/supabase-js')

const CYCLING_TYPES = ['Ride', 'VirtualRide', 'EBikeRide', 'EMountainBikeRide', 'GravelRide', 'MountainBikingXCRace', 'Handcycle', 'Velomobile']

function sportLabel(type) {
  if (type === 'VirtualRide') return 'Virtuell'
  if (type === 'EBikeRide' || type === 'EMountainBikeRide') return 'El-sykkel'
  if (type === 'GravelRide') return 'Grus'
  if (type === 'MountainBikingXCRace') return 'Terreng'
  return 'Vei'
}

module.exports = async function handler(req, res) {
  const { user_id } = req.query
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: tokenRow, error: tokenErr } = await supabase
    .from('strava_tokens')
    .select('*')
    .eq('user_id', user_id)
    .single()

  if (tokenErr || !tokenRow) return res.status(400).json({ error: 'No Strava token found' })

  let accessToken = tokenRow.access_token

  if (tokenRow.expires_at - Math.floor(Date.now() / 1000) < 300) {
    const refreshRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: tokenRow.refresh_token,
      }),
    })
    const refreshed = await refreshRes.json()
    if (refreshed.access_token) {
      accessToken = refreshed.access_token
      await supabase.from('strava_tokens').update({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: refreshed.expires_at,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user_id)
    }
  }

  const activitiesRes = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=100', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const activities = await activitiesRes.json()

  if (!Array.isArray(activities)) return res.status(500).json({ error: 'Strava API error', details: activities })

  const rides = activities.filter(a => CYCLING_TYPES.includes(a.sport_type || a.type))

  const { data: existing } = await supabase
    .from('rides')
    .select('strava_id')
    .eq('user_id', user_id)

  const existingIds = new Set((existing || []).map(r => String(r.strava_id)))

  const toInsert = rides
    .filter(a => !existingIds.has(String(a.id)))
    .map(a => ({
      user_id,
      strava_id: a.id,
      date: new Date(a.start_date_local).toLocaleDateString('nb-NO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      date_key: a.start_date_local.slice(0, 10),
      distance: Math.round(a.distance / 10) / 100,
      duration: a.moving_time,
      type: sportLabel(a.sport_type || a.type),
      notes: a.name || '',
    }))

  let imported = 0
  if (toInsert.length) {
    const { error } = await supabase.from('rides').insert(toInsert)
    if (error) return res.status(500).json({ error: error.message })
    imported = toInsert.length
  }

  res.json({ imported, total: rides.length })
}
