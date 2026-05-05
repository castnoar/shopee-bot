const express = require('express');
const https = require('https');
const app = express();

const AF_ID = process.env.SHOPEE_AF_ID;

app.get('/', (req, res) => {
  res.send('Bot Shopee Afiliados rodando! ✅');
});

app.get('/converter', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url obrigatório' });

  try {
    const linkFinal = await expandirLink(url);
    const separator = linkFinal.includes('?') ? '&' : '?';
    const linkAfiliado = linkFinal + separator + 'utm_source=' + AF_ID + '&mmp_pid=' + AF_ID;
    res.json({ link: linkAfiliado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function expandirLink(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        resolve(response.headers.location);
      } else {
        resolve(url);
      }
    });
    req.on('error', reject);
    req.end();
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
