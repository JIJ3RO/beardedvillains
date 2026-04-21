const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

function signAccess(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
}
function signRefresh(userId) {
  return jwt.sign({ sub: userId, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function login(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({
      accessToken: signAccess(user.id),
      refreshToken: signRefresh(user.id),
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (payload.type !== 'refresh') throw new Error();
    res.json({ accessToken: signAccess(payload.sub) });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}

module.exports = { login, refresh };
