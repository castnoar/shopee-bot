const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

const SHOPEE_EMAIL = process.env.SHOPEE_EMAIL;
const SHOPEE_PASSWORD = process.env.SHOPEE_PASSWORD;

app.get('/', (req, res) => {
  res.send('Bot Shopee Afiliados rodando! ✅');
});

app.get('/converter', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Parâmetro url é obrigatório' });

  try {
    const linkConvertido = await converterLink(url);
    res.json({ link: linkConvertido });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro: ' + err.message });
  }
});

async function converterLink(url) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    await page.goto('https://affiliate.shopee.com.br/account/login', { waitUntil: 'networkidle2' });

    const jaLogado = await page.$('.header-user');
    if (!jaLogado) {
      await page.type('input[name="loginKey"]', SHOPEE_EMAIL);
      await page.type('input[name="password"]', SHOPEE_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }

    await page.goto('https://affiliate.shopee.com.br/offer/custom_link', { waitUntil: 'networkidle2' });
    await page.waitForSelector('textarea');
    await page.evaluate((linkUrl) => {
      document.querySelector('textarea').value = linkUrl;
      document.querySelector('textarea').dispatchEvent(new Event('input', { bubbles: true }));
    }, url);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const linkGerado = await page.evaluate(() => {
      const elementos = document.querySelectorAll('input[readonly], .generated-link, .copy-link');
      for (const el of elementos) {
        const val = el.value || el.textContent;
        if (val && val.includes('shopee')) return val.trim();
      }
      return null;
    });

    if (!linkGerado) throw new Error('Não foi possível extrair o link');
    return linkGerado;
  } finally {
    await browser.close();
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
