module.exports = function handler(req, res) {
  const { user_id } = req.query
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

  const clientId = process.env.STRAVA_CLIENT_ID
  if (!clientId) return res.status(500).json({ error: 'STRAVA_CLIENT_ID not configured' })

  const redirectUri = 'https://ironlog-phi-liard.vercel.app/api/strava-callback'
  const url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=activity:read&state=${user_id}`

  res.redirect(url)
}
