class UseCase {
  constructor(data = {}) {
    this.case_id = data.case_id || data.id || this.generateId(); // Support both for migration
    this.title = data.title || '';
    this.description = data.description || '';
    this.category = data.category || 'general';
    this.aiModel = data.aiModel || '';
    this.prompt = data.prompt || '';
    this.tags = data.tags || [];
    this.status = data.status || 'active'; // active, archived, draft
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.priority = data.priority || 'medium'; // low, medium, high
    this.examples = data.examples || [];
    this.notes = data.notes || '';
    
    // New fields for grid positioning and implementation status
    this.implementationEffort = data.implementationEffort || 5; // 1-10 scale
    this.businessBenefit = data.businessBenefit || 5; // 1-10 scale
    this.implementationStatus = data.implementationStatus || 'backlog'; // backlog, work_in_progress, implemented, ignored
    this.gridX = data.gridX || null; // X position on grid (0-100)
    this.gridY = data.gridY || null; // Y position on grid (0-100)
  }

  generateId() {
    return 'uc_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  update(data) {
    Object.assign(this, data);
    this.updatedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      case_id: this.case_id,
      title: this.title,
      description: this.description,
      category: this.category,
      aiModel: this.aiModel,
      prompt: this.prompt,
      tags: this.tags,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      priority: this.priority,
      examples: this.examples,
      notes: this.notes,
      implementationEffort: this.implementationEffort,
      businessBenefit: this.businessBenefit,
      implementationStatus: this.implementationStatus,
      gridX: this.gridX,
      gridY: this.gridY
    };
  }

  static fromJSON(data) {
    return new UseCase(data);
  }
}

module.exports = UseCase;
