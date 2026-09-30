import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Sign in required' })
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { role: payload.role }
    next()
  } catch {
    return res.status(401).json({ error: 'Session expired. Sign in again.' })
  }
}

export function requireOwner(req, res, next) {
  if (req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Owner access only' })
  }
  next()
}
