# antikit

CLI tool to manage AI agent skills from multiple repositories. Easily discover, install, and update skills for your AI agents.

## Installation

```bash
npm install -g antikit
```

## Features

- **Multi-source Support**: Fetch skills from any GitHub repository.
- **Sub-directory Support**: Skills can reside in sub-folders (e.g. `.claude/skills`).
- **Interactive UI**: Browse, select, and update skills with a rich terminal UI.
- **Dependency Management**: Automatically resolves and installs skill dependencies defined in `SKILL.md`.
- **Smart Upgrades**: Detects version changes and allows easy upgrades.
- **Autocomplete**: Full Zsh/Bash comparison support.

## Usage

### � Quick Start

**1. Setup Autocomplete (Recommended)**

```bash
antikit completion
# Follow instructions to add to ~/.zshrc or ~/.bashrc
```

**2. Browse & Install Skills**

```bash
antikit list
# or simply
antikit ls
```

_Shows an interactive menu to search, select, and install/update skills._

---

### �📦 Manage Skills

#### List available skills

```bash
# Interactive mode (Default) - Browse, Multi-select, Update
antikit ls

# Search skills by name
antikit ls -s <query>

# Text mode (Non-interactive list)
antikit ls --text

# Filter by source
antikit ls --source official
```

#### Install a skill

Automatically installs dependencies defined in `SKILL.md`.

```bash
antikit install <skill-name>
# or
antikit i <skill-name>

# Force overwrite if exists
antikit install <skill-name> --force
```

#### Upgrade installed skills

Update your local skills to the latest version from their sources.

```bash
# Upgrade all installed skills
antikit upgrade
# or
antikit ug

# Upgrade a specific skill
antikit upgrade <skill-name>

# Upgrade without confirmation (good for scripts)
antikit upgrade --yes
```

#### List installed local skills

```bash
antikit local
# or
antikit l
```

#### Remove a skill

```bash
antikit remove <skill-name>
# or
antikit rm <skill-name>
```

---

### 📡 Manage Sources

You can fetch skills from multiple GitHub repositories, even from sub-directories.

```bash
# List configured sources
antikit source list

# Add a standard Repo source (GitHub owner/repo)
antikit source add vunamhung/antiskills

# Add a source from a SUB-DIRECTORY (e.g. monorepo)
antikit source add mrgoonie/claudekit-skills --path .claude/skills --name claudekit

# Add with a custom name
antikit source add vunamhung/private-skills --name private

# Set a default source
antikit source default private

# Remove a source
antikit source remove private
```

---

### 🔄 Self Update

Update the `antikit` CLI tool itself to the latest version.

```bash
antikit update
```

_Note: You will also be notified automatically if a new version is available when running any command._

---

## Skill Development

### Skill Structure

A skill is a directory containing a `SKILL.md` file.

### Defining Version & Dependencies

You can specify version and dependencies in the `SKILL.md` frontmatter.

```yaml
---
name: my-skill
description: A powerful skill that needs helpers
version: 1.0.1
dependencies:
  - sql-helper
  - python-runner
---
# My Skill Content
...
```

## Requirements

- Node.js >= 18.0.0
- Git (for cloning skills)

## License

MIT
