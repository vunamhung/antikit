import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { confirm } from '@inquirer/prompts';

// Since fetchLatestVersion was internal in updateNotifier.js, let's create a helper 
// or I can duplicate the fetch logic here for simplicity, or refactor updateNotifier.js.
// Refactoring is better practice.

/**
 * Update the CLI tool to the latest version
 */
export async function updateCli() {
    const spinner = ora('Checking for updates...').start();

    try {
        // Fetch latest version from npm
        const response = await fetch(`https://registry.npmjs.org/antikit/latest`, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            throw new Error('Failed to fetch version info from npm registry');
        }

        const data = await response.json();
        const latestVersion = data.version;

        // Import package.json to get current version
        // Using dynamic import to avoid requiring createRequire in this module if possible, 
        // but for consistency with index.js style
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        const pkg = require('../../package.json');
        const currentVersion = pkg.version;

        spinner.stop();

        if (latestVersion === currentVersion) {
            console.log(chalk.green(`\n✓ You are already on the latest version (${currentVersion})`));
            return;
        }

        console.log(chalk.bold(`\nUpdate available: ${chalk.dim(currentVersion)} → ${chalk.green(latestVersion)}`));

        const shouldUpdate = await confirm({
            message: 'Do you want to update now?',
            default: true
        });

        if (!shouldUpdate) {
            console.log(chalk.yellow('Update cancelled.'));
            return;
        }

        const updateSpinner = ora('Updating antikit...').start();

        try {
            execSync('npm install -g antikit@latest', { stdio: 'pipe' });
            updateSpinner.succeed(chalk.green(`Updated to version ${latestVersion}`));
            console.log(chalk.dim('\nYou may need to restart your terminal for changes to take effect.'));
        } catch (err) {
            updateSpinner.fail('Update failed');
            console.log(chalk.red('Please try running: npm install -g antikit@latest'));
            // Check for permission error
            if (err.message.includes('EACCES')) {
                console.log(chalk.yellow('Note: You might need to run with sudo'));
            }
        }

    } catch (error) {
        spinner.fail('Failed to check for updates');
        console.error(chalk.red(error.message));
    }
}
