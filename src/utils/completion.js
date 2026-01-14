import omelette from 'omelette';
import { readdirSync, existsSync } from 'fs';
import { getOrCreateSkillsDir } from './local.js';
import { getSources } from './configManager.js';

export function setupCompletion() {
  // Define the CLI structure
  // antikit <command> <arg>
  const completion = omelette('antikit <command> <arg>');

  // Handle command completion
  completion.on('command', ({ reply }) => {
    reply([
      'install',
      'i',
      'list',
      'ls',
      'local',
      'l',
      'remove',
      'rm',
      'update',
      'up',
      'upgrade',
      'ug',
      'source',
      'help',
      '--help',
      '-h',
      '--version',
      '-v'
    ]);
  });

  // Handle argument completion
  completion.on('arg', ({ command, reply }) => {
    const skillsDir = getOrCreateSkillsDir();

    // Helper to get local skills
    const getLocalSkills = () => {
      if (!existsSync(skillsDir)) return [];
      return readdirSync(skillsDir).filter(f => !f.startsWith('.'));
    };

    switch (command) {
      case 'remove':
      case 'rm':
      case 'upgrade':
      case 'ug':
        // Suggest installed skills
        reply(getLocalSkills());
        break;

      case 'source':
        // Subcommands for source
        reply(['list', 'add', 'remove', 'default']);
        break;

      // For 'install', fetching remote skills is too slow for tab completion.
      // We could cache them, but for now let's just reply empty or known common ones?
      // Safer to just not suggest dynamically to avoid lag.
      case 'install':
      case 'i':
        // Maybe suggest local skills just in case they want to reinstall/update
        // or eventually read from a cached list of remote skills.
        break;
    }
  });

  // Initialize completion
  completion.init();
}
