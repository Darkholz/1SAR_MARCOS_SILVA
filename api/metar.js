export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://aviationweather.gov/api/data/metar?ids=LPBJ&format=json'
    );

    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch METAR'
    });
  }
}
