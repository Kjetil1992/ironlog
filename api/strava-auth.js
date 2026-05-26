export default function handler(req, res) {
  const { user_id } = req.query
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

  const clientId = process.env.STRAVA_CLIENT_ID
  const redirectUri = `${process.env.APP_URL || 'https://ironlog-phi-liard.vercel.app'}/api/strava-callback`

  const url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=activity:read_all&state=${user_id}`

  res.redirect(url)
}
