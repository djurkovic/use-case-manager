const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const UseCaseManager = require('./src/UseCaseManager');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize the use case manager with NocoDB
const manager = new UseCaseManager(true);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure use cases are loaded
manager.loadUseCases();

// API Routes
app.get('/api/use-cases', async (req, res) => {
  try {
    await manager.loadUseCases();
    const filters = {
      status: req.query.status,
      category: req.query.category,
      priority: req.query.priority,
      tag: req.query.tag,
      search: req.query.search,
      implementationStatus: req.query.implementationStatus
    };
    
    const useCases = manager.getAll(filters);
    res.json(useCases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/use-cases/:id', async (req, res) => {
  try {
    await manager.loadUseCases();
    const useCase = manager.getById(req.params.id);
    if (!useCase) {
      return res.status(404).json({ error: 'Use case not found' });
    }
    res.json(useCase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/use-cases', async (req, res) => {
  try {
    const useCase = await manager.create(req.body);
    res.status(201).json(useCase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/use-cases/:id', async (req, res) => {
  try {
    const useCase = await manager.update(req.params.id, req.body);
    if (!useCase) {
      return res.status(404).json({ error: 'Use case not found' });
    }
    res.json(useCase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/use-cases/:id', async (req, res) => {
  try {
    const useCase = await manager.delete(req.params.id);
    if (!useCase) {
      return res.status(404).json({ error: 'Use case not found' });
    }
    res.json({ message: 'Use case deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    await manager.loadUseCases();
    const stats = manager.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/backup', async (req, res) => {
  try {
    const backupFile = await manager.backup();
    if (backupFile) {
      res.json({ message: 'Backup created successfully', file: backupFile });
    } else {
      res.status(500).json({ error: 'Failed to create backup' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update grid position endpoint
app.patch('/api/use-cases/:id/position', async (req, res) => {
  try {
    const { gridX, gridY, implementationEffort, businessBenefit } = req.body;
    const updates = {};
    
    if (gridX !== undefined) updates.gridX = gridX;
    if (gridY !== undefined) updates.gridY = gridY;
    if (implementationEffort !== undefined) updates.implementationEffort = implementationEffort;
    if (businessBenefit !== undefined) updates.businessBenefit = businessBenefit;
    
    const useCase = await manager.update(req.params.id, updates);
    if (!useCase) {
      return res.status(404).json({ error: 'Use case not found' });
    }
    res.json(useCase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Use Case Manager Web Interface running on http://localhost:${PORT}`);
  console.log('📊 Grid view available at: http://localhost:' + PORT);
});