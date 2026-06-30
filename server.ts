import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { config } from './src/config/index';

// Routers
import authRouter from './src/routes/authRouter';
import issuesRouter from './src/routes/issuesRouter';
import rewardsRouter from './src/routes/rewardsRouter';
import notificationsRouter from './src/routes/notificationsRouter';
import analyticsRouter from './src/routes/analyticsRouter';

const app = express();
const PORT = config.PORT;

// Payload size configuration for processing image uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// ==========================================
// API ROUTES ROUTING (SUPABASE INTEGRATED)
// ==========================================
app.use('/api/auth', authRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api', analyticsRouter);

// Base Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ==========================================
// VITE DEV SERVER AND PRODUCTION SERVING
// ==========================================
async function startServer() {
  if (config.NODE_ENV !== 'production' && !process.env.VITE_PROD_MODE) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
export default app;
