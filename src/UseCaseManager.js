const UseCase = require('./UseCase');
const DataStore = require('./DataStore');
const NocoDBStore = require('./NocoDBStore');

class UseCaseManager {
  constructor(useNocoDB = false) {
    this.dataStore = useNocoDB ? new NocoDBStore() : new DataStore();
    this.useCases = [];
    this.loadUseCases();
  }

  async loadUseCases() {
    try {
      const data = await this.dataStore.loadData();
      this.useCases = data.map(item => UseCase.fromJSON(item));
    } catch (error) {
      console.error('Error loading use cases:', error.message);
      this.useCases = [];
    }
  }

  async saveUseCases() {
    try {
      const data = this.useCases.map(useCase => useCase.toJSON());
      return await this.dataStore.saveData(data);
    } catch (error) {
      console.error('Error saving use cases:', error.message);
      return false;
    }
  }

  async create(useCaseData) {
    const useCase = new UseCase(useCaseData);
    this.useCases.push(useCase);
    
    // If using NocoDB, create record directly
    if (this.dataStore instanceof NocoDBStore) {
      try {
        await this.dataStore.createRecord(useCase.toJSON());
      } catch (error) {
        console.error('Error creating record in NocoDB:', error.message);
        // Remove from local array if NocoDB fails
        this.useCases.pop();
        throw error;
      }
    } else {
      await this.saveUseCases();
    }
    
    return useCase;
  }

  getAll(filters = {}) {
    let filtered = this.useCases;

    if (filters.status) {
      filtered = filtered.filter(uc => uc.status === filters.status);
    }

    if (filters.category) {
      filtered = filtered.filter(uc => uc.category === filters.category);
    }

    if (filters.priority) {
      filtered = filtered.filter(uc => uc.priority === filters.priority);
    }

    if (filters.tag) {
      filtered = filtered.filter(uc => uc.tags.includes(filters.tag));
    }

    if (filters.implementation) {
      filtered = filtered.filter(uc => uc.implementationStatus === filters.implementation);
    }

    if (filters.implementationStatus) {
      filtered = filtered.filter(uc => uc.implementationStatus === filters.implementationStatus);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(uc => 
        uc.title.toLowerCase().includes(searchTerm) ||
        uc.description.toLowerCase().includes(searchTerm) ||
        uc.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    return filtered;
  }

  getById(case_id) {
    return this.useCases.find(uc => uc.case_id === case_id);
  }

  async update(case_id, updates) {
    const useCase = this.getById(case_id);
    if (useCase) {
      useCase.update(updates);
      
      // If using NocoDB, update record directly
      if (this.dataStore instanceof NocoDBStore) {
        try {
          await this.dataStore.updateRecord(case_id, updates);
        } catch (error) {
          console.error('Error updating record in NocoDB:', error.message);
          throw error;
        }
      } else {
        await this.saveUseCases();
      }
      
      return useCase;
    }
    return null;
  }

  async delete(case_id) {
    const index = this.useCases.findIndex(uc => uc.case_id === case_id);
    if (index !== -1) {
      const deleted = this.useCases.splice(index, 1)[0];
      
      // If using NocoDB, delete record directly
      if (this.dataStore instanceof NocoDBStore) {
        try {
          await this.dataStore.deleteRecord(case_id);
        } catch (error) {
          console.error('Error deleting record from NocoDB:', error.message);
          // Re-add to local array if NocoDB fails
          this.useCases.splice(index, 0, deleted);
          throw error;
        }
      } else {
        await this.saveUseCases();
      }
      
      return deleted;
    }
    return null;
  }

  getCategories() {
    const categories = new Set(this.useCases.map(uc => uc.category));
    return Array.from(categories).sort();
  }

  getTags() {
    const tags = new Set();
    this.useCases.forEach(uc => uc.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }

  getStats() {
    const total = this.useCases.length;
    const byStatus = {};
    const byCategory = {};
    const byPriority = {};

    this.useCases.forEach(uc => {
      byStatus[uc.status] = (byStatus[uc.status] || 0) + 1;
      byCategory[uc.category] = (byCategory[uc.category] || 0) + 1;
      byPriority[uc.priority] = (byPriority[uc.priority] || 0) + 1;
    });

    return {
      total,
      byStatus,
      byCategory,
      byPriority
    };
  }

  backup() {
    return this.dataStore.backup();
  }
}

module.exports = UseCaseManager;
