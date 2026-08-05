# Frontend deployment

This folder is an independent static frontend and can be deployed as the project root on Vercel or Netlify.

Set the public HTTPS address of the Render service once in the `productionBackendUrl` constant in `js/config.js`:

```js
const productionBackendUrl = 'https://your-service.onrender.com';
```

On `localhost`, the frontend automatically uses `http://localhost:3000` (or `127.0.0.1:3000`), so no configuration needs to be changed between local runs and deployments.

The same frontend URL must be added to the server's `CLIENT_ORIGIN` environment variable. Multiple frontend domains can be supplied as a comma-separated list.
