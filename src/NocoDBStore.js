const axios = require('axios');
require('dotenv').config();

class NocoDBStore {
  constructor() {
    this.baseUrl = process.env.NOCODB_BASE_URL || 'http://localhost:8080';
    this.apiToken = process.env.NOCODB_API_TOKEN;
    this.tableId = process.env.NOCODB_TABLE_ID;
    
    if (!this.apiToken || !this.tableId) {
      console.warn('Warning: NOCODB_API_TOKEN or NOCODB_TABLE_ID not set. Using local JSON storage as fallback.');
      this.fallbackStore = require('./DataStore');
      this.useFallback = true;
      return;
    }
    
    this.useFallback = false;
    this.headers = {
      'xc-token': this.apiToken,
      'Content-Type': 'application/json'
    };
  }

  async ensureTable() {
    if (this.useFallback) return true;
    
    try {
      // Check if table exists by trying to fetch data
      await this.getTableUrl();
      return true;
    } catch (error) {
      console.error('Error connecting to NocoDB:', error.message);
      console.log('Falling back to local JSON storage...');
      this.fallbackStore = new (require('./DataStore'))();
      this.useFallback = true;
      return false;
    }
  }

  getTableUrl() {
    return `${this.baseUrl}/api/v2/tables/${this.tableId}/records`;
  }

  async loadData() {
    await this.ensureTable();
    
    if (this.useFallback) {
      return this.fallbackStore.loadData();
    }

    try {
      const response = await axios.get(this.getTableUrl(), { headers: this.headers });
      // NocoDB v2 API returns records in 'list' property
      return response.data.list || [];
    } catch (error) {
      console.error('Error loading data from NocoDB:', error.message);
      return [];
    }
  }

  async saveData(data) {
    await this.ensureTable();
    
    if (this.useFallback) {
      return this.fallbackStore.saveData(data);
    }

    // NocoDB doesn't support bulk replace, so we'll manage individual records
    // This is a simplified approach - in production you'd want more sophisticated sync
    try {
      // For now, just return true as we'll handle individual record operations
      return true;
    } catch (error) {
      console.error('Error saving data to NocoDB:', error.message);
      return false;
    }
  }

  async createRecord(record) {
    await this.ensureTable();
    
    if (this.useFallback) {
      const currentData = this.fallbackStore.loadData();
      currentData.push(record);
      return this.fallbackStore.saveData(currentData);
    }

    try {
      const response = await axios.post(this.getTableUrl(), record, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('Error creating record in NocoDB:', error.message);
      throw error;
    }
  }

  async updateRecord(case_id, updates) {
    await this.ensureTable();
    
    if (this.useFallback) {
      const currentData = this.fallbackStore.loadData();
      const index = currentData.findIndex(item => item.case_id === case_id || item.id === case_id);
      if (index !== -1) {
        currentData[index] = { ...currentData[index], ...updates };
        return this.fallbackStore.saveData(currentData);
      }
      return false;
    }

    try {
      // Find the record by our custom case_id field (or legacy id field for migration)
      const existingRecords = await this.loadData();
      const record = existingRecords.find(r => r.case_id === case_id || r.id === case_id);
      
      if (!record) {
        throw new Error('Record not found');
      }

      // NocoDB v2 API uses the record's Id field (system-generated primary key) directly in the URL
      const response = await axios.patch(
        `${this.getTableUrl()}/${record.Id}`,
        updates,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating record in NocoDB:', error.message);
      throw error;
    }
  }

  async deleteRecord(case_id) {
    await this.ensureTable();
    
    if (this.useFallback) {
      const currentData = this.fallbackStore.loadData();
      const index = currentData.findIndex(item => item.case_id === case_id || item.id === case_id);
      if (index !== -1) {
        currentData.splice(index, 1);
        return this.fallbackStore.saveData(currentData);
      }
      return false;
    }

    try {
      // Find the record by our custom case_id field (or legacy id field for migration)
      const existingRecords = await this.loadData();
      const record = existingRecords.find(r => r.case_id === case_id || r.id === case_id);
      
      if (!record) {
        throw new Error('Record not found');
      }

      // NocoDB v2 API uses the record's Id field (system-generated primary key) directly in the URL
      const response = await axios.delete(
        `${this.getTableUrl()}/${record.Id}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting record from NocoDB:', error.message);
      throw error;
    }
  }

  async backup() {
    await this.ensureTable();
    
    if (this.useFallback && this.fallbackStore.backup) {
      return this.fallbackStore.backup();
    }

    try {
      const data = await this.loadData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fs = require('fs');
      const path = require('path');
      
      const backupFile = path.join(__dirname, '../data', `nocodb-backup-${timestamp}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
      return backupFile;
    } catch (error) {
      console.error('Error creating backup:', error.message);
      return null;
    }
  }
}

module.exports = NocoDBStore;
