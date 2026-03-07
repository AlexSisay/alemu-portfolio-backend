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
  const ip = req.headers['x-real-ip'] || req.headers['cf-connecting-ip'] || req.headers['true-client-ip'] || req.ip || req.connection?.remoteAddress || '';
  return ip.replace(/^::ffff:/i, '');
}

// Public: Record a visit (called from frontend)
router.post('/track', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const path = req.body?.path || req.headers['referer']?.split('?')[0] || '/';
    const userAgent = req.headers['user-agent'] || '';

    let country = req.body?.country || 'Unknown';
    let countryCode = req.body?.countryCode || '';

    if ((country === 'Unknown' || !countryCode) && ip && ip !== '::1' && ip !== '127.0.0.1') {
      const https = require('https');
      const http = require('http');
      const tryGeo = (url) => new Promise((resolve) => {
        const lib = url.startsWith('https') ? https : http;
        lib.get(url, { timeout: 3000 }, (r) => {
          let data = '';
          r.on('data', (chunk) => { data += chunk; });
          r.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve({});
            }
          });
          r.on('error', () => resolve({}));
        }).on('error', () => resolve({}));
      });
      let resp = await tryGeo(`https://ipapi.co/${ip}/json/`);
      if (resp && resp.country_name) {
        country = resp.country_name;
        countryCode = resp.country_code || '';
      } else {
        resp = await tryGeo(`http://ip-api.com/json/${ip}?fields=country,countryCode`);
        if (resp && resp.country) {
          country = resp.country;
          countryCode = resp.countryCode || '';
        }
      }
    } else if (!ip || ip === '::1' || ip === '127.0.0.1') {
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

// Helpers for week/month grouping
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}
function getMonthKey(date) {
  return new Date(date).toISOString().slice(0, 7);
}
function formatWeekLabel(weekKey) {
  const [y, m, d] = weekKey.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}
function formatMonthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Admin: Get visit stats (total, unique IPs, by country, by week, by month)
router.get('/stats', auth, async (req, res) => {
  try {
    const visits = await Visit.find().lean();

    const total = visits.length;
    const uniqueIps = new Set(visits.map((v) => v.ip).filter(Boolean)).size;

    const byCountry = {};
    const byWeek = {};
    const byMonth = {};
    const byCountryByMonth = {};

    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - 7 * i);
      const wk = getWeekStart(d);
      if (!byWeek[wk]) byWeek[wk] = { week: wk, label: formatWeekLabel(wk), count: 0 };
    }
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mk = getMonthKey(d);
      if (!byMonth[mk]) byMonth[mk] = { month: mk, label: formatMonthLabel(mk), count: 0 };
    }

    visits.forEach((v) => {
      const c = v.country || 'Unknown';
      byCountry[c] = (byCountry[c] || 0) + 1;

      const wk = getWeekStart(v.createdAt);
      if (byWeek[wk]) byWeek[wk].count += 1;
      else {
        byWeek[wk] = { week: wk, label: formatWeekLabel(wk), count: 1 };
      }

      const mk = getMonthKey(v.createdAt);
      if (byMonth[mk]) byMonth[mk].count += 1;
      else {
        byMonth[mk] = { month: mk, label: formatMonthLabel(mk), count: 1 };
      }

      if (!byCountryByMonth[mk]) byCountryByMonth[mk] = {};
      byCountryByMonth[mk][c] = (byCountryByMonth[mk][c] || 0) + 1;
    });

    const countryList = Object.entries(byCountry)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    const weekList = Object.values(byWeek)
      .sort((a, b) => a.week.localeCompare(b.week))
      .reverse()
      .slice(0, 12);

    const monthList = Object.values(byMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
      .reverse()
      .slice(0, 12);

    const countryByMonthList = Object.entries(byCountryByMonth)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
      .map(([month, countries]) => ({
        month,
        label: formatMonthLabel(month),
        byCountry: Object.entries(countries)
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)
      }));

    res.json({
      total,
      uniqueVisitors: uniqueIps,
      byCountry: countryList,
      byWeek: weekList,
      byMonth: monthList,
      byCountryByMonth: countryByMonthList
    });
  } catch (err) {
    console.error('Analytics stats error:', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

module.exports = router;
