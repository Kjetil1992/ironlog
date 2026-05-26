module.exports = function handler(req, res) {
  res.json({
    client_id: process.env.STRAVA_CLIENT_ID,
    client_id_type: typeof process.env.STRAVA_CLIENT_ID,
    has_secret: !!process.env.STRAVA_CLIENT_SECRET,
    has_supabase_url: !!process.env.VITE_SUPABASE_URL,
    has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  })
}
