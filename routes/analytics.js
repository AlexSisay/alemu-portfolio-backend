const express = require('express');
const Visit = require('../models/Visit');
const auth = require('../middleware/auth');
const router = express.Router();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return req.headers['x-real-ip'] || req.ip || req.connection?.remoteAddress || '';
}

// Public: Record a visit (called from frontend)
router.post('/track', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const path = req.body?.path || req.headers['referer']?.split('?')[0] || '/';
    const userAgent = req.headers['user-agent'] || '';

    let country = 'Unknown';
    let countryCode = '';

    if (ip && ip !== '::1' && ip !== '127.0.0.1') {
      try {
        const https = require('https');
        const resp = await new Promise((resolve, reject) => {
          const url = `https://ipapi.co/${ip}/json/`;
          https.get(url, { timeout: 3000 }, (r) => {
            let data = '';
            r.on('data', (chunk) => { data += chunk; });
            r.on('end', () => {
              try {
                resolve(JSON.parse(data));
              } catch {
                resolve({});
              }
            });
            r.on('error', reject);
          }).on('error', reject);
        });
        if (resp && resp.country_name) {
          country = resp.country_name;
          countryCode = resp.country_code || '';
        }
      } catch (geoErr) {
        console.warn('Geo lookup failed for', ip, geoErr.message);
      }
    } else {
      country = 'Local';
      countryCode = 'LOCAL';
    }

    const visit = new Visit({ ip, country, countryCode, path, userAgent });
    await visit.save();

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Analytics track error:', err);
    res.status(500).json({ ok: false });
  }
});

// Admin: Get visit stats (total, unique IPs, by country)
router.get('/stats', auth, async (req, res) => {
  try {
    const visits = await Visit.find().lean();

    const total = visits.length;
    const uniqueIps = new Set(visits.map((v) => v.ip).filter(Boolean)).size;

    const byCountry = {};
    visits.forEach((v) => {
      const c = v.country || 'Unknown';
      byCountry[c] = (byCountry[c] || 0) + 1;
    });

    const countryList = Object.entries(byCountry)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      total,
      uniqueVisitors: uniqueIps,
      byCountry: countryList
    });
  } catch (err) {
    console.error('Analytics stats error:', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

module.exports = router;
