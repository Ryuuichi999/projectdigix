const jwt = require('jsonwebtoken');
const Boom = require('@hapi/boom');

const JWT_SECRET = process.env.JWT_SECRET;

exports.authPlugin = {
  name: 'authPlugin',
  version: '1.0.0',
  register: async function (server) {
    server.auth.scheme('jwt-scheme', () => {
      return {
        authenticate: async (request, h) => {
          const authHeader = request.headers.authorization;
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw Boom.unauthorized('Missing or invalid token');
          }
          const token = authHeader.replace('Bearer ', '');
          try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return h.authenticated({ credentials: decoded });
          } catch (err) {
            console.error('Token verification failed:', err);
            throw Boom.unauthorized('Invalid or expired token');
          }
        }
      };
    });
    server.auth.strategy('jwt', 'jwt-scheme');
  
  }
};