class UseCaseManager {
    constructor() {
        this.useCases = [];
        this.currentView = 'grid';
        this.currentUseCaseId = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadUseCases();
        this.setupDragAndDrop();
        this.showView('grid');
    }

    setupEventListeners() {
        // View switching
        document.getElementById('gridViewBtn').addEventListener('click', () => this.showView('grid'));
        document.getElementById('listViewBtn').addEventListener('click', () => this.showView('list'));
        document.getElementById('statsBtn').addEventListener('click', () => this.showView('stats'));

        // Modal controls
        document.getElementById('addUseCaseBtn').addEventListener('click', () => this.showModal());
        document.querySelector('.close').addEventListener('click', () => this.hideModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideModal());
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteUseCase());

        // Form submission
        document.getElementById('useCaseForm').addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Range sliders
        document.getElementById('implementationEffort').addEventListener('input', (e) => {
            document.getElementById('effortValue').textContent = e.target.value;
        });
        document.getElementById('businessBenefit').addEventListener('input', (e) => {
            document.getElementById('benefitValue').textContent = e.target.value;
        });

        // Filters
        document.getElementById('statusFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('implementationFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('categoryFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('useCaseModal');
            if (e.target === modal) {
                this.hideModal();
            }
        });
    }

    async loadUseCases() {
        try {
            const response = await fetch('/api/use-cases');
            this.useCases = await response.json();
            this.updateCategoryFilter();
            this.renderCurrentView();
        } catch (error) {
            console.error('Error loading use cases:', error);
            this.showNotification('Error loading use cases', 'error');
        }
    }

    updateCategoryFilter() {
        const categories = [...new Set(this.useCases.map(uc => uc.category))].filter(c => c);
        const categoryFilter = document.getElementById('categoryFilter');
        
        // Clear existing options except "All Categories"
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categoryFilter.appendChild(option);
        });
    }

    applyFilters() {
        const statusFilter = document.getElementById('statusFilter').value;
        const implementationFilter = document.getElementById('implementationFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const searchInput = document.getElementById('searchInput').value.toLowerCase();

        const filtered = this.useCases.filter(uc => {
            if (statusFilter && uc.status !== statusFilter) return false;
            if (implementationFilter && uc.implementationStatus !== implementationFilter) return false;
            if (categoryFilter && uc.category !== categoryFilter) return false;
            if (searchInput && !this.matchesSearch(uc, searchInput)) return false;
            return true;
        });

        this.renderCurrentView(filtered);
    }

    matchesSearch(useCase, searchTerm) {
        return useCase.title.toLowerCase().includes(searchTerm) ||
               useCase.description.toLowerCase().includes(searchTerm) ||
               (useCase.tags && useCase.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
    }

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        document.getElementById(viewName + 'View').classList.add('active');

        // Update button states
        document.querySelectorAll('.header-actions .btn').forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
        });

        const activeBtn = document.getElementById(viewName + 'ViewBtn');
        if (activeBtn) {
            activeBtn.classList.remove('btn-secondary');
            activeBtn.classList.add('btn-primary');
        }

        this.currentView = viewName;
        
        if (viewName === 'stats') {
            this.renderStats();
        } else {
            this.renderCurrentView();
        }
    }

    renderCurrentView(filteredUseCases = null) {
        const useCases = filteredUseCases || this.useCases;
        
        switch (this.currentView) {
            case 'grid':
                this.renderGridView(useCases);
                break;
            case 'list':
                this.renderListView(useCases);
                break;
        }
    }

    renderGridView(useCases) {
        const grid = document.getElementById('priorityGrid');
        
        // Remove existing use case items (keep grid structure)
        const existingItems = grid.querySelectorAll('.use-case-item');
        existingItems.forEach(item => item.remove());

        useCases.forEach(useCase => {
            const item = this.createGridItem(useCase);
            grid.appendChild(item);
        });
    }

    createGridItem(useCase) {
        const item = document.createElement('div');
        item.className = `use-case-item ${useCase.implementationStatus}`;
        item.dataset.id = useCase.case_id;
        item.draggable = true;

        // Calculate position based on implementation effort and business benefit
        const x = ((useCase.implementationEffort - 1) / 9) * 100; // 1-10 scale to 0-100%
        const y = (1 - (useCase.businessBenefit - 1) / 9) * 100; // Inverted for Y axis (high benefit at top)

        item.style.left = `calc(${x}% - 60px)`;
        item.style.top = `calc(${y}% - 40px)`;

        // If grid position is saved, use that instead
        if (useCase.gridX !== null && useCase.gridY !== null) {
            item.style.left = `calc(${useCase.gridX}% - 60px)`;
            item.style.top = `calc(${useCase.gridY}% - 40px)`;
        }

        const statusText = useCase.implementationStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

        item.innerHTML = `
            <div class="use-case-title">${useCase.title}</div>
            <div class="use-case-category">${useCase.category}</div>
            <div class="use-case-status">${statusText}</div>
        `;

        item.addEventListener('click', (e) => {
            if (!this.isDragging) {
                this.editUseCase(useCase.case_id);
            }
        });

        return item;
    }

    renderListView(useCases) {
        const list = document.getElementById('useCasesList');
        list.innerHTML = '';

        if (useCases.length === 0) {
            list.innerHTML = '<div style="padding: 40px; text-align: center; color: #7f8c8d;">No use cases found.</div>';
            return;
        }

        useCases.forEach(useCase => {
            const item = this.createListItem(useCase);
            list.appendChild(item);
        });
    }

    createListItem(useCase) {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.addEventListener('click', () => this.editUseCase(useCase.case_id));

        const statusText = useCase.implementationStatus.replace('_', ' ');

        item.innerHTML = `
            <div class="list-item-header">
                <div class="list-item-title">${useCase.title}</div>
                <div class="list-item-status ${useCase.implementationStatus}">${statusText}</div>
            </div>
            <div class="list-item-description">${useCase.description || 'No description'}</div>
            <div class="list-item-meta">
                <span>Category: ${useCase.category}</span>
                <span>Effort: ${useCase.implementationEffort}/10</span>
                <span>Benefit: ${useCase.businessBenefit}/10</span>
                <span>Priority: ${useCase.priority}</span>
            </div>
        `;

        return item;
    }

    async renderStats() {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();
            
            const container = document.getElementById('statsContainer');
            container.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${stats.total}</div>
                        <div class="stat-label">Total Use Cases</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.byImplementationStatus?.implemented || 0}</div>
                        <div class="stat-label">Implemented</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.byImplementationStatus?.work_in_progress || 0}</div>
                        <div class="stat-label">In Progress</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.byImplementationStatus?.backlog || 0}</div>
                        <div class="stat-label">Backlog</div>
                    </div>
                </div>
                
                <h3 style="margin-bottom: 20px;">Implementation Status Distribution</h3>
                <div class="stats-breakdown">
                    ${this.renderStatsBreakdown(stats.byImplementationStatus || {})}
                </div>
                
                <h3 style="margin: 30px 0 20px 0;">Priority Distribution</h3>
                <div class="stats-breakdown">
                    ${this.renderStatsBreakdown(stats.byPriority || {})}
                </div>
            `;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    renderStatsBreakdown(data) {
        const total = Object.values(data).reduce((sum, count) => sum + count, 0);
        if (total === 0) return '<p>No data available</p>';

        return Object.entries(data)
            .map(([key, count]) => {
                const percentage = ((count / total) * 100).toFixed(1);
                const displayKey = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                return `
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ecf0f1;">
                        <span>${displayKey}</span>
                        <span>${count} (${percentage}%)</span>
                    </div>
                `;
            })
            .join('');
    }

    setupDragAndDrop() {
        const grid = document.getElementById('priorityGrid');

        grid.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('use-case-item')) {
                this.isDragging = true;
                e.target.classList.add('dragging');
                
                const rect = e.target.getBoundingClientRect();
                const gridRect = grid.getBoundingClientRect();
                
                this.dragOffset = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
            }
        });

        grid.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        grid.addEventListener('drop', async (e) => {
            e.preventDefault();
            const draggingItem = grid.querySelector('.dragging');
            
            if (draggingItem) {
                const gridRect = grid.getBoundingClientRect();
                const x = ((e.clientX - this.dragOffset.x - gridRect.left) / gridRect.width) * 100;
                const y = ((e.clientY - this.dragOffset.y - gridRect.top) / gridRect.height) * 100;
                
                // Constrain to grid bounds
                const constrainedX = Math.max(0, Math.min(100, x));
                const constrainedY = Math.max(0, Math.min(100, y));
                
                draggingItem.style.left = `calc(${constrainedX}% - 60px)`;
                draggingItem.style.top = `calc(${constrainedY}% - 40px)`;
                
                // Calculate new effort and benefit values based on position
                const implementationEffort = Math.round(1 + (constrainedX / 100) * 9);
                const businessBenefit = Math.round(1 + ((100 - constrainedY) / 100) * 9);
                
                // Update the use case
                const useCaseId = draggingItem.dataset.id;
                try {
                    await fetch(`/api/use-cases/${useCaseId}/position`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            gridX: constrainedX,
                            gridY: constrainedY,
                            implementationEffort,
                            businessBenefit
                        })
                    });
                    
                    // Update local data
                    const useCase = this.useCases.find(uc => uc.case_id === useCaseId);
                    if (useCase) {
                        useCase.gridX = constrainedX;
                        useCase.gridY = constrainedY;
                        useCase.implementationEffort = implementationEffort;
                        useCase.businessBenefit = businessBenefit;
                    }
                } catch (error) {
                    console.error('Error updating position:', error);
                    this.showNotification('Error updating position', 'error');
                }
            }
        });

        grid.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('use-case-item')) {
                e.target.classList.remove('dragging');
                setTimeout(() => {
                    this.isDragging = false;
                }, 100);
            }
        });
    }

    showModal(useCaseId = null) {
        this.currentUseCaseId = useCaseId;
        const modal = document.getElementById('useCaseModal');
        const form = document.getElementById('useCaseForm');
        const title = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteBtn');
        
        form.reset();
        
        if (useCaseId) {
            title.textContent = 'Edit Use Case';
            deleteBtn.style.display = 'block';
            this.populateForm(useCaseId);
        } else {
            title.textContent = 'Add Use Case';
            deleteBtn.style.display = 'none';
            // Set default values
            document.getElementById('effortValue').textContent = '5';
            document.getElementById('benefitValue').textContent = '5';
        }
        
        modal.classList.add('show');
    }

    hideModal() {
        const modal = document.getElementById('useCaseModal');
        modal.classList.remove('show');
        this.currentUseCaseId = null;
    }

    populateForm(useCaseId) {
        const useCase = this.useCases.find(uc => uc.case_id === useCaseId);
        if (!useCase) return;

        document.getElementById('title').value = useCase.title || '';
        document.getElementById('description').value = useCase.description || '';
        document.getElementById('category').value = useCase.category || '';
        document.getElementById('implementationEffort').value = useCase.implementationEffort || 5;
        document.getElementById('businessBenefit').value = useCase.businessBenefit || 5;
        document.getElementById('implementationStatus').value = useCase.implementationStatus || 'backlog';
        document.getElementById('priority').value = useCase.priority || 'medium';
        document.getElementById('aiModel').value = useCase.aiModel || '';
        document.getElementById('tags').value = (useCase.tags || []).join(', ');
        document.getElementById('prompt').value = useCase.prompt || '';
        document.getElementById('notes').value = useCase.notes || '';
        
        document.getElementById('effortValue').textContent = useCase.implementationEffort || 5;
        document.getElementById('benefitValue').textContent = useCase.businessBenefit || 5;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const useCaseData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            implementationEffort: parseInt(formData.get('implementationEffort')),
            businessBenefit: parseInt(formData.get('businessBenefit')),
            implementationStatus: formData.get('implementationStatus'),
            priority: formData.get('priority'),
            aiModel: formData.get('aiModel'),
            prompt: formData.get('prompt'),
            notes: formData.get('notes'),
            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        try {
            let response;
            if (this.currentUseCaseId) {
                // Update existing use case
                response = await fetch(`/api/use-cases/${this.currentUseCaseId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(useCaseData)
                });
            } else {
                // Create new use case
                response = await fetch('/api/use-cases', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(useCaseData)
                });
            }

            if (response.ok) {
                this.hideModal();
                await this.loadUseCases();
                this.showNotification(
                    this.currentUseCaseId ? 'Use case updated!' : 'Use case created!', 
                    'success'
                );
            } else {
                throw new Error('Failed to save use case');
            }
        } catch (error) {
            console.error('Error saving use case:', error);
            this.showNotification('Error saving use case', 'error');
        }
    }

    async editUseCase(useCaseId) {
        this.showModal(useCaseId);
    }

    async deleteUseCase() {
        if (!this.currentUseCaseId) return;
        
        if (!confirm('Are you sure you want to delete this use case?')) {
            return;
        }

        try {
            const response = await fetch(`/api/use-cases/${this.currentUseCaseId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.hideModal();
                await this.loadUseCases();
                this.showNotification('Use case deleted!', 'success');
            } else {
                throw new Error('Failed to delete use case');
            }
        } catch (error) {
            console.error('Error deleting use case:', error);
            this.showNotification('Error deleting use case', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UseCaseManager();
});
