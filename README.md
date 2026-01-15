# antikit

CLI tool to manage AI agent skills from multiple repositories. Easily discover, install, and update skills for your AI agents.

## Installation

```bash
npm install -g antikit
```

## Features

- **Multi-source Support**: Fetch skills from any GitHub repository (Public or Private).
- **Sub-directory Support**: Skills can reside in sub-folders (e.g. `.claude/skills`) within a repo.
- **Interactive UI**: Browse, select, multi-install, and update skills with a rich terminal interface.
- **Private Repo Access**: Seamless integration with private repositories via GitHub Token.
- **Smart Upgrades**: Detects version changes, manages dependencies, and streamlines updates.
- **Autocomplete**: Full Zsh/Bash/Fish tab-completion support.
- **Performance**: Optimized fetching using GitHub GraphQL API.

---

## 🚀 Quick Start

### 1. Setup Autocomplete (Recommended)

This enables tab completion for commands and skill names.

```bash
antikit completion
# Follow the instructions to add the script to your ~/.zshrc or ~/.bashrc
```

### 2. Configure Authentication (Optional but Recommended)

To avoid API rate limits (60 requests/hr) and access **Private Repositories**, configure a GitHub Token.

1.  **Create Token:** [Generate New Token](https://github.com/settings/tokens/new?description=antikit-cli&scopes=repo)
    - Select scope `public_repo` (for public access) or `repo` (for private access).
2.  **Set Token:**
    ```bash
    antikit config set-token ghp_YOUR_TOKEN_HERE
    ```

---

## 📚 Usage Guide

### 🔍 Discovery & Listing

**Interactive Mode (Default)**
Browse skills, see installed status, updates available, and descriptions. Use Space to select multiple skills and Enter to install.

```bash
antikit list
# Alias: antikit ls
```

**Search & Filters**

```bash
# Search by skill name
antikit ls -s <keyword>

# Filter by source
antikit ls --source antiskills
antikit ls --source claudekit

# Text Mode (Non-interactive, good for scripting)
antikit ls --text
```

**View Skill Documentation**
Read the `SKILL.md` content directly in your terminal (supports local and remote).

```bash
antikit info <skill-name>
# Alias: antikit doc <skill-name>
```

### ⬇️ Installation & Updates

**Install Skills**
Automatically resolves and installs dependencies defined in `SKILL.md`.

```bash
antikit install <skill-name>
# Alias: antikit i <skill-name>

# Force re-install
antikit install <skill-name> --force
```

**Upgrade Skills**
Keep your skills up-to-date with one command.

```bash
# Interactive Mode (Default in TTY) - Select specific skills to upgrade
antikit upgrade
# Select skills with checkbox, see version changes (local → remote)
# Alias: antikit ug

# Explicit Interactive Mode
antikit upgrade -i
antikit upgrade --interactive

# Upgrade a specific skill
antikit upgrade <skill-name>

# Auto-upgrade all (with confirmation)
antikit upgrade

# Auto-upgrade all without confirmation (CI/Script mode)
antikit upgrade --yes
antikit upgrade -y
```

**Interactive Upgrade Features:**
- ✨ **Checkbox Selection** - Choose specific skills to upgrade
- 📊 **Version Display** - See current vs. latest version (e.g., `v1.0.0 → v1.2.0`)
- 🎯 **Smart Filtering** - Only upgradeable skills are selectable
- 🚦 **Visual Indicators**:
  - `↑` Yellow - Update available
  - `✓` Green - Already up-to-date (disabled)
  - `✗` Red - Error/Cannot upgrade (disabled)


**Manage Local Skills**

```bash
# List locally installed skills
antikit local
# Alias: antikit l

# Remove a specific skill
antikit remove <skill-name>
# Alias: antikit rm <skill-name>

# Interactive Remove - Select multiple skills to remove
antikit remove
antikit remove -i
antikit remove --interactive

# Remove all skills (with confirmation)
antikit remove --all

# Remove all without confirmation (dangerous!)
antikit remove --all --yes
antikit remove -a -y
```

**Interactive Remove Features:**
- ✨ **Checkbox Selection** - Choose multiple skills to remove
- 📋 **Summary Preview** - See what will be removed before confirming
- 🚨 **Safety First** - Double confirmation with default=No
- ⚠️ **Warning Indicators** - Red text and warning icons for destructive operations


### 📡 Source Management

You can fetch skills from multiple repositories, including monorepos with sub-directories.

**List Sources**

```bash
antikit source list
```

**Add Sources**

```bash
# Add a Public/Private GitHub Repo
antikit source add owner/repo-name

# Add from a specific Sub-directory (e.g. monorepo)
antikit source add mrgoonie/claudekit-skills --path .claude/skills --name claudekit

# Add with a custom alias
antikit source add my-org/private-skills --name work
```

**Manage Sources**

```bash
# Set a default source for basic installs
antikit source default work

# Remove a source
antikit source remove work
```

### ⚙️ Configuration

Manage your local configuration and credentials.

```bash
# View current config (masked token)
antikit config list

# Update GitHub Token
antikit config set-token <new_token>

# Remove Token
antikit config remove-token
```

### 🔄 Tool Maintenance

**Update CLI**
Update `antikit` itself to the latest version.

```bash
antikit update
# Alias: antikit up
```

---

## 🛠 Skill Development

### Skill Structure

A skill is simply a directory containing a `SKILL.md` (metadata & instructions) and any associated files.

### Defining Version & Dependencies

Add YAML frontmatter to your `SKILL.md` to enable versioning and automatic dependency installation.

```yaml
---
name: my-complex-skill
description: Performs magic operations
version: 1.2.0
dependencies:
  - simple-helper-skill
  - another-dependency
---
# Skill Instructions
...
```

### Validator

Check if your `SKILL.md` is valid and ready for publishing.

```bash
antikit validate
# or check specific path
antikit validate ./path/to/skill
```

---

## Requirements

- Node.js >= 18.0.0
- Git (for cloning skills)

## License

MIT
