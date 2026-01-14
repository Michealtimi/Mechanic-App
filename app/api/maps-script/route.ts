export async function GET() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return new Response("Google Maps API key not configured", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    })
  }

  // Redirect to Google Maps API with server-side API key
  const mapsScriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`

  return Response.redirect(mapsScriptUrl, 307)
}
