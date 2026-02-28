import jwt from 'jsonwebtoken';

const PUBLIC_ROUTES = [
  { path: '/api/auth/login', method: 'POST' },
  { path: '/api/auth/register', method: 'POST' },
  { path: '/api/auth/forgot-password', method: 'POST' },
  { path: '/api/auth/reset-password', method: 'POST' },
  { path: '/health', method: 'GET' },
];

const isPublicRoute = (path, method) => {
  return PUBLIC_ROUTES.some(route =>
    path.startsWith(route.path) && (route.method === method || route.method === '*')
  );
};

const verifyToken = (req, res, next) => {
  if (isPublicRoute(req.path, req.method)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.headers['x-user-id'] = String(decoded.id);
    req.headers['x-user-role'] = decoded.role;
    req.headers['x-user-login'] = decoded.login;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
  }
};

export { verifyToken }; 