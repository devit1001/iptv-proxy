export default async function handler(req, res) {

  const { url } = req.query;

  if (!url) {
    return res.status(400).send("Missing url parameter");
  }

  try {
    const response = await fetch(url);
    const text = await response.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "text/plain");

    return res.status(200).send(text);

  } catch (error) {
    return res.status(500).send("Error fetching playlist");
  }
}