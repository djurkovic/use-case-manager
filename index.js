const UseCaseManager = require('./src/UseCaseManager');
const chalk = require('chalk');

const manager = new UseCaseManager();

console.log(chalk.blue('🤖 AI Use Case Manager'));
console.log(chalk.gray('Run "ucm --help" for available commands'));

module.exports = manager;