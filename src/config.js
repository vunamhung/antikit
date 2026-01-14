import { homedir } from 'os';
import { join } from 'path';

export const CONFIG = {
  // Remote repository
  REPO_OWNER: 'vunamhung',
  REPO_NAME: 'antiskills',
  REPO_URL: 'https://github.com/vunamhung/antiskills.git',
  GITHUB_API: 'https://api.github.com',

  // Local paths
  LOCAL_SKILLS_DIR: '.agent/skills',

  // Cache
  CACHE_DIR: join(homedir(), '.antikit'),
  CACHE_TTL: 1000 * 60 * 60 // 1 hour
};
