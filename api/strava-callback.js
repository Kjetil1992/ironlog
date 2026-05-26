const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  const { code, state: userId, error } = req.query

  if (error || !code || !userId) {
    return res.redirect(`/?strava_error=1&reason=missing_params&error=${error || 'none'}`)
  }

  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  const token = await tokenRes.json()

  if (!token.access_token) {
    const reason = encodeURIComponent(JSON.stringify(token))
    return res.redirect(`/?strava_error=1&reason=${reason}`)
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { error: dbError } = await supabase.from('strava_tokens').upsert({
    user_id: userId,
    athlete_id: token.athlete?.id,
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_at: token.expires_at,
    updated_at: new Date().toISOString(),
  })

  if (dbError) {
    return res.redirect(`/?strava_error=1&reason=db_${encodeURIComponent(dbError.message)}`)
  }

  res.redirect('/?strava_connected=1')
}
