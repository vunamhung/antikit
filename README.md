# antikit

CLI tool to manage AI agent skills from multiple repositories. Easily discover, install, and update skills for your AI agents.

## Installation

```bash
npm install -g antikit
```

## Usage

### 📦 Manage Skills

#### List available skills
```bash
antikit list
# or
antikit ls

# Search skills by name
antikit list -s <query>

# Interactive mode (select and install)
antikit list -i

# Filter by source
antikit list --source official
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
You can fetch skills from multiple GitHub repositories.

```bash
# List configured sources
antikit source list

# Add a new source (GitHub owner/repo)
antikit source add vunamhung/another-repo

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
*Note: You will also be notified automatically if a new version is available when running any command.*

---

## Skill Development

### Skill Structure
A skill is a directory containing a `SKILL.md` file.

### Defining Dependencies
You can specify dependencies in the `SKILL.md` frontmatter. `antikit` will automatically install them.

```yaml
---
name: my-skill
description: A powerful skill that needs helpers
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
- A project with `.agent/skills` directory (created automatically)

## License

MIT
