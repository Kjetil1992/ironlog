import { createClient } from '@supabase/supabase-js'

function stravaType(a) {
  if (a.sport_type === 'TrailRun') return 'Terreng'
  if (a.sport_type === 'VirtualRun') return 'Mølle'
  if (a.workout_type === 3) return 'Intervall'
  return 'Vei'
}

function fmtDate(isoLocal) {
  const d = new Date(isoLocal)
  return d.toLocaleDateString('nb-NO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function handler(req, res) {
  const { user_id } = req.query
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: tokenData } = await supabase
    .from('strava_tokens')
    .select('*')
    .eq('user_id', user_id)
    .single()

  if (!tokenData) return res.status(404).json({ error: 'Not connected' })

  let accessToken = tokenData.access_token

  // Refresh token if expiring within 5 minutes
  if (Math.floor(Date.now() / 1000) > tokenData.expires_at - 300) {
    const refreshRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    })
    const newToken = await refreshRes.json()
    if (newToken.access_token) {
      accessToken = newToken.access_token
      await supabase.from('strava_tokens').update({
        access_token: newToken.access_token,
        refresh_token: newToken.refresh_token,
        expires_at: newToken.expires_at,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user_id)
    }
  }

  // Fetch run activities from Strava (last 100)
  const activitiesRes = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=100',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const activities = await activitiesRes.json()

  if (!Array.isArray(activities)) {
    return res.status(500).json({ error: 'Failed to fetch activities' })
  }

  const runActivities = activities.filter(a =>
    a.sport_type === 'Run' || a.sport_type === 'TrailRun' || a.sport_type === 'VirtualRun'
  )

  // Get existing strava_ids to avoid duplicates
  const { data: existing } = await supabase
    .from('runs')
    .select('strava_id')
    .eq('user_id', user_id)
    .not('strava_id', 'is', null)

  const existingIds = new Set((existing || []).map(r => r.strava_id))

  const toInsert = runActivities
    .filter(a => !existingIds.has(String(a.id)))
    .map(a => ({
      user_id,
      date: fmtDate(a.start_date_local),
      date_key: a.start_date_local.split('T')[0],
      distance: Math.round(a.distance / 10) / 100,
      duration: a.moving_time,
      type: stravaType(a),
      notes: a.name || '',
      strava_id: String(a.id),
    }))

  if (toInsert.length > 0) {
    await supabase.from('runs').insert(toInsert)
  }

  res.json({ imported: toInsert.length, total: runActivities.length })
}
