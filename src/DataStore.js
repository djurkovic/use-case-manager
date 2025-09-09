const fs = require('fs');
const path = require('path');

class DataStore {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.dataFile = path.join(this.dataDir, 'use-cases.json');
    this.ensureDataDir();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.dataFile)) {
      this.saveData([]);
    }
  }

  loadData() {
    try {
      const data = fs.readFileSync(this.dataFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading data:', error.message);
      return [];
    }
  }

  saveData(data) {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving data:', error.message);
      return false;
    }
  }

  backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.dataDir, `use-cases-backup-${timestamp}.json`);
    
    try {
      const data = this.loadData();
      fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
      return backupFile;
    } catch (error) {
      console.error('Error creating backup:', error.message);
      return null;
    }
  }
}

module.exports = DataStore;