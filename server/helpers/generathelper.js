export const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,                          // JS cannot read cookie — prevents XSS
    secure: isProduction,                    // HTTPS only in production, HTTP ok in dev
    sameSite: isProduction ? 'none' : 'lax', // 'none' needed for cross-site in prod
    path: '/',                               // cookie valid for all routes
    maxAge: 5 * 24 * 60 * 60 * 1000,        // 5 days in ms (matches JWT_EXPIRE=5d)
  });
};
