#!/usr/bin/env node

const { Command } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const UseCaseManager = require('../src/UseCaseManager');

const program = new Command();
const manager = new UseCaseManager();

program
  .name('ucm')
  .description('AI Use Case Manager - Organize and manage your AI use cases')
  .version('1.0.0');

program
  .command('add')
  .description('Add a new use case')
  .option('-t, --title <title>', 'use case title')
  .option('-d, --description <description>', 'use case description')
  .option('-c, --category <category>', 'use case category')
  .option('-m, --model <model>', 'AI model to use')
  .option('-p, --priority <priority>', 'priority (low, medium, high)')
  .action(async (options) => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Use case title:',
        when: !options.title,
        validate: input => input.trim() ? true : 'Title is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        when: !options.description
      },
      {
        type: 'input',
        name: 'category',
        message: 'Category:',
        default: 'general',
        when: !options.category
      },
      {
        type: 'input',
        name: 'aiModel',
        message: 'AI Model (e.g., gpt-4, claude-3):',
        when: !options.model
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Priority:',
        choices: ['low', 'medium', 'high'],
        default: 'medium',
        when: !options.priority
      },
      {
        type: 'input',
        name: 'implementationEffort',
        message: 'Implementation Effort (1-10):',
        default: '5',
        validate: input => {
          const num = parseInt(input);
          return num >= 1 && num <= 10 ? true : 'Please enter a number between 1 and 10';
        }
      },
      {
        type: 'input',
        name: 'businessBenefit',
        message: 'Business Benefit (1-10):',
        default: '5',
        validate: input => {
          const num = parseInt(input);
          return num >= 1 && num <= 10 ? true : 'Please enter a number between 1 and 10';
        }
      },
      {
        type: 'list',
        name: 'implementationStatus',
        message: 'Implementation Status:',
        choices: ['backlog', 'work_in_progress', 'implemented', 'ignored'],
        default: 'backlog'
      },
      {
        type: 'editor',
        name: 'prompt',
        message: 'Prompt/Instructions (opens editor):'
      },
      {
        type: 'input',
        name: 'tags',
        message: 'Tags (comma-separated):',
        filter: input => input.split(',').map(tag => tag.trim()).filter(tag => tag)
      }
    ]);

    const useCaseData = {
      title: options.title || answers.title,
      description: options.description || answers.description,
      category: options.category || answers.category,
      aiModel: options.model || answers.aiModel,
      priority: options.priority || answers.priority,
      implementationEffort: parseInt(answers.implementationEffort) || 5,
      businessBenefit: parseInt(answers.businessBenefit) || 5,
      implementationStatus: answers.implementationStatus || 'backlog',
      prompt: answers.prompt || '',
      tags: answers.tags || []
    };

    const useCase = await manager.create(useCaseData);
    console.log(chalk.green('✓ Use case created successfully!'));
    console.log(chalk.gray(`ID: ${useCase.id}`));
  });

program
  .command('list')
  .description('List all use cases')
  .option('-s, --status <status>', 'filter by status (active, archived, draft)')
  .option('-c, --category <category>', 'filter by category')
  .option('-p, --priority <priority>', 'filter by priority')
  .option('-t, --tag <tag>', 'filter by tag')
  .option('-i, --implementation <status>', 'filter by implementation status (backlog, work_in_progress, implemented, ignored)')
  .option('--search <term>', 'search in title, description, and tags')
  .action(async (options) => {
    await manager.loadUseCases();
    const useCases = manager.getAll(options);
    
    if (useCases.length === 0) {
      console.log(chalk.yellow('No use cases found.'));
      return;
    }

    console.log(chalk.blue(`\n📋 Found ${useCases.length} use case(s):\n`));
    
    useCases.forEach(uc => {
      const statusIcon = uc.status === 'active' ? '🟢' : uc.status === 'archived' ? '📦' : '📝';
      const priorityColor = uc.priority === 'high' ? chalk.red : uc.priority === 'medium' ? chalk.yellow : chalk.gray;
      
      // Implementation status icons
      const implIcon = uc.implementationStatus === 'implemented' ? '✅' : 
                      uc.implementationStatus === 'work_in_progress' ? '🚧' : 
                      uc.implementationStatus === 'ignored' ? '❌' : '📋';
      
      console.log(`${statusIcon}${implIcon} ${chalk.bold(uc.title)} ${chalk.gray(`(${uc.id})`)}`);
      console.log(`   ${chalk.gray(uc.description)}`);
      console.log(`   Category: ${chalk.cyan(uc.category)} | Priority: ${priorityColor(uc.priority)} | Model: ${chalk.magenta(uc.aiModel)}`);
      console.log(`   Implementation: ${chalk.white(uc.implementationStatus.replace('_', ' '))} | Effort: ${uc.implementationEffort}/10 | Benefit: ${uc.businessBenefit}/10`);
      if (uc.tags && uc.tags.length > 0) {
        console.log(`   Tags: ${uc.tags.map(tag => chalk.blue(`#${tag}`)).join(' ')}`);
      }
      console.log();
    });
  });

program
  .command('show')
  .description('Show detailed information about a use case')
  .argument('<id>', 'use case ID')
  .action((id) => {
    const useCase = manager.getById(id);
    
    if (!useCase) {
      console.log(chalk.red('Use case not found.'));
      return;
    }

    const statusIcon = useCase.status === 'active' ? '🟢' : useCase.status === 'archived' ? '📦' : '📝';
    
    console.log(chalk.blue('\n📋 Use Case Details:\n'));
    console.log(`${statusIcon} ${chalk.bold(useCase.title)}`);
    console.log(`ID: ${chalk.gray(useCase.id)}`);
    console.log(`Description: ${useCase.description}`);
    console.log(`Category: ${chalk.cyan(useCase.category)}`);
    console.log(`AI Model: ${chalk.magenta(useCase.aiModel)}`);
    console.log(`Priority: ${chalk.yellow(useCase.priority)}`);
    console.log(`Status: ${useCase.status}`);
    
    if (useCase.tags.length > 0) {
      console.log(`Tags: ${useCase.tags.map(tag => chalk.blue(`#${tag}`)).join(' ')}`);
    }
    
    console.log(`Created: ${new Date(useCase.createdAt).toLocaleString()}`);
    console.log(`Updated: ${new Date(useCase.updatedAt).toLocaleString()}`);
    
    if (useCase.prompt) {
      console.log(`\n${chalk.bold('Prompt/Instructions:')}`);
      console.log(useCase.prompt);
    }
    
    if (useCase.notes) {
      console.log(`\n${chalk.bold('Notes:')}`);
      console.log(useCase.notes);
    }
    
    if (useCase.examples.length > 0) {
      console.log(`\n${chalk.bold('Examples:')}`);
      useCase.examples.forEach((example, index) => {
        console.log(`${index + 1}. ${example}`);
      });
    }
  });

program
  .command('edit')
  .description('Edit a use case')
  .argument('<id>', 'use case ID')
  .action(async (id) => {
    const useCase = manager.getById(id);
    
    if (!useCase) {
      console.log(chalk.red('Use case not found.'));
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Title:',
        default: useCase.title
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        default: useCase.description
      },
      {
        type: 'input',
        name: 'category',
        message: 'Category:',
        default: useCase.category
      },
      {
        type: 'input',
        name: 'aiModel',
        message: 'AI Model:',
        default: useCase.aiModel
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Priority:',
        choices: ['low', 'medium', 'high'],
        default: useCase.priority
      },
      {
        type: 'list',
        name: 'status',
        message: 'Status:',
        choices: ['active', 'archived', 'draft'],
        default: useCase.status
      },
      {
        type: 'input',
        name: 'tags',
        message: 'Tags (comma-separated):',
        default: useCase.tags.join(', '),
        filter: input => input.split(',').map(tag => tag.trim()).filter(tag => tag)
      }
    ]);

    manager.update(id, answers);
    console.log(chalk.green('✓ Use case updated successfully!'));
  });

program
  .command('delete')
  .description('Delete a use case')
  .argument('<id>', 'use case ID')
  .action(async (id) => {
    const useCase = manager.getById(id);
    
    if (!useCase) {
      console.log(chalk.red('Use case not found.'));
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to delete "${useCase.title}"?`,
        default: false
      }
    ]);

    if (confirm) {
      manager.delete(id);
      console.log(chalk.green('✓ Use case deleted successfully!'));
    } else {
      console.log(chalk.gray('Delete cancelled.'));
    }
  });

program
  .command('stats')
  .description('Show statistics about your use cases')
  .action(() => {
    const stats = manager.getStats();
    
    console.log(chalk.blue('\n📊 Use Case Statistics:\n'));
    console.log(`Total use cases: ${chalk.bold(stats.total)}`);
    
    if (Object.keys(stats.byStatus).length > 0) {
      console.log('\nBy Status:');
      Object.entries(stats.byStatus).forEach(([status, count]) => {
        const icon = status === 'active' ? '🟢' : status === 'archived' ? '📦' : '📝';
        console.log(`  ${icon} ${status}: ${count}`);
      });
    }
    
    if (Object.keys(stats.byCategory).length > 0) {
      console.log('\nBy Category:');
      Object.entries(stats.byCategory).forEach(([category, count]) => {
        console.log(`  📁 ${category}: ${count}`);
      });
    }
    
    if (Object.keys(stats.byPriority).length > 0) {
      console.log('\nBy Priority:');
      Object.entries(stats.byPriority).forEach(([priority, count]) => {
        const color = priority === 'high' ? chalk.red : priority === 'medium' ? chalk.yellow : chalk.gray;
        console.log(`  ${color('●')} ${priority}: ${count}`);
      });
    }
  });

program
  .command('backup')
  .description('Create a backup of your use cases')
  .action(() => {
    const backupFile = manager.backup();
    if (backupFile) {
      console.log(chalk.green('✓ Backup created successfully!'));
      console.log(chalk.gray(`File: ${backupFile}`));
    } else {
      console.log(chalk.red('✗ Failed to create backup.'));
    }
  });

program.parse();