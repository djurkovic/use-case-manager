# AI Use Case Manager

A comprehensive web and CLI tool to organize, prioritize, and manage your AI use cases with an interactive prioritization grid.

**Note**: This has been created entirely using Claude Code. 

## 🚀 Features

- **📊 Interactive Web Interface** with drag-and-drop prioritization grid
- **💻 Command-Line Interface** for power users
- **🎯 2x2 Prioritization Matrix** (Implementation Effort vs Business Benefit)
- **🏷️ Implementation Status Tracking** (Backlog, Work in Progress, Implemented, Ignored)
- **🔍 Advanced Filtering** and search capabilities
- **📈 Statistics and Analytics**
- **🗃️ NocoDB Backend Integration** with local fallback
- **📱 Responsive Design** for mobile and desktop

## 🛠️ Installation

```bash
# Clone or download to your project directory
cd use-case-manager

# Install dependencies
npm install

# For CLI usage (optional)
npm link  # Makes the 'ucm' command available globally
```

## 🌐 Web Interface

### Quick Start

1. **Start the web server:**
   ```bash
   npm run web
   # or for development with auto-reload:
   npm run dev
   ```

2. **Open your browser:**
   ```
   http://localhost:3000
   ```

### Key Features

#### 📊 Prioritization Grid
- **X-axis**: Implementation Effort (Low → High)
- **Y-axis**: Business Benefit (Low → High)
- **Quadrants**:
  - **Quick Wins** (High Benefit, Low Effort) - Top Left
  - **Major Projects** (High Benefit, High Effort) - Top Right
  - **Fill-ins** (Low Benefit, Low Effort) - Bottom Left
  - **Thankless Tasks** (Low Benefit, High Effort) - Bottom Right

#### 🎯 Interactive Features
- **Drag & Drop**: Move use cases around the grid to update their effort/benefit scores
- **Status Colors**: Visual indicators for implementation status
- **Click to Edit**: Click any use case card to edit details
- **Real-time Updates**: Changes are saved automatically

#### 🔍 Views
- **Grid View**: Interactive 2x2 prioritization matrix
- **List View**: Detailed table with all use case information
- **Stats View**: Analytics and distribution charts

## 💻 CLI Interface

### Basic Commands

**Add a new use case:**
```bash
ucm add
# Interactive mode with all new fields including:
# - Implementation effort (1-10)
# - Business benefit (1-10)
# - Implementation status
```

**List with new filters:**
```bash
ucm list
ucm list --implementation work_in_progress
ucm list --implementation implemented
```

**Enhanced display:**
- Implementation status icons (✅🚧📋❌)
- Effort and benefit scores
- Grid positioning data

## 🗃️ NocoDB Integration

### Setup NocoDB Backend

1. **Install and run NocoDB:**
   ```bash
   # Using Docker
   docker run -d --name nocodb -p 8080:8080 nocodb/nocodb:latest
   
   # Or install globally
   npm install -g nocodb
   nocodb
   ```

2. **Configure environment variables:**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env with your NocoDB details (v2 API)
   NOCODB_BASE_URL=http://localhost:8080
   NOCODB_API_TOKEN=your_api_token_here
   NOCODB_TABLE_ID=your_table_id_here
   ```

3. **Get API credentials from NocoDB:**
   - Open NocoDB web interface
   - Create a new project
   - Create a table named `use_cases`
   - Get API token from Account Settings
   - Copy project ID from URL

### Table Schema

The tool will work with any NocoDB table, but for optimal experience, create these columns:

| Column Name | Type | Description |
|------------|------|-------------|
| id | SingleLineText | Unique identifier |
| title | SingleLineText | Use case title |
| description | LongText | Detailed description |
| category | SingleLineText | Category/grouping |
| aiModel | SingleLineText | Preferred AI model |
| priority | SingleSelect | low, medium, high |
| implementationEffort | Number | 1-10 scale |
| businessBenefit | Number | 1-10 scale |
| implementationStatus | SingleSelect | backlog, work_in_progress, implemented, ignored |
| status | SingleSelect | active, archived, draft |
| tags | JSON | Array of tags |
| prompt | LongText | AI prompt/instructions |
| examples | LongText | Additional notes, examples etc |
| gridX | Number | X position on grid (0-100) |
| gridY | Number | Y position on grid (0-100) |
| case_id | SingleLineText | generated use-case-id | 

## 📊 Use Case Structure

Each use case now includes:

### Core Information
- **Title**: Short descriptive name
- **Description**: Detailed explanation
- **Category**: Organizational grouping
- **AI Model**: Preferred model (e.g., "gpt-4", "claude-3-sonnet")
- **Tags**: Searchable keywords
- **Prompt**: The actual prompt/instructions
- **Notes**: Additional observations

### Prioritization Data
- **Implementation Effort**: 1-10 scale (complexity, time, resources needed)
- **Business Benefit**: 1-10 scale (value, impact, ROI)
- **Grid Position**: X/Y coordinates for visual placement

### Status Tracking
- **Status**: Active, archived, or draft
- **Implementation Status**: 
  - 📋 **Backlog**: Not started
  - 🚧 **Work in Progress**: Currently being implemented
  - ✅ **Implemented**: Completed and deployed
  - ❌ **Ignored**: Decided not to pursue
- **Priority**: Low, medium, or high

## 🚀 Usage Examples

### Web Interface Workflow

1. **Add a new use case** via the web form
2. **Position it on the grid** by dragging to reflect effort vs benefit
3. **Update status** as you progress through implementation
4. **Filter and search** to find specific use cases
5. **View analytics** to understand your portfolio

### CLI Power User Workflow

```bash
# Add a high-impact, low-effort use case
ucm add --title "Automated Email Responses" --implementation backlog

# Find all quick wins
ucm list --implementation backlog | grep "Quick Wins"

# Update implementation status
ucm edit uc_abc123  # Opens interactive editor

# Generate reports
ucm stats
```

## 🔧 Development

### Project Structure

```
use-case-manager/
├── package.json              # Dependencies and scripts
├── server.js                 # Express.js web server
├── index.js                  # CLI entry point
├── .env.example             # Environment template
├── bin/ucm.js               # CLI executable
├── src/
│   ├── UseCase.js           # Data model
│   ├── DataStore.js         # Local JSON storage
│   ├── NocoDBStore.js       # NocoDB integration
│   └── UseCaseManager.js    # Core business logic
├── public/
│   ├── index.html           # Web interface
│   ├── style.css            # Styles and grid layout
│   └── script.js            # Frontend JavaScript
└── data/                    # Auto-created data storage
```

### Scripts

```bash
npm run web     # Start production server
npm run dev     # Start development server with auto-reload
npm start       # Run CLI version
```

### Local Storage Fallback

If NocoDB is not configured, the app automatically falls back to local JSON storage:
- Data stored in `data/use-cases.json`
- Automatic backups with timestamps
- Full compatibility with existing CLI workflows

## 📈 Advanced Features

### Grid Analytics
- **Quadrant Analysis**: See distribution across priority quadrants
- **Status Tracking**: Monitor implementation progress
- **Category Insights**: Understand use case types

### Bulk Operations
- **Export Data**: Create backups via API or CLI
- **Import/Migration**: Move between storage backends
- **Batch Updates**: CLI commands for bulk changes

### Integration Ready
- **REST API**: Full CRUD operations via `/api/use-cases`
- **Webhook Support**: Via NocoDB integration
- **Data Export**: JSON format for external tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both web and CLI interfaces
5. Submit a pull request

## 📄 License

MIT License - feel free to use and modify for your projects!