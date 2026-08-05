# Render deployment

Deploy this folder as a separate Node.js web service on Render.

- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`
- Environment variable: `CLIENT_ORIGIN=https://your-frontend.vercel.app`

For more than one frontend domain, set `CLIENT_ORIGIN` to a comma-separated list. This value is used by Socket.IO CORS.
