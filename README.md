# antikit

CLI tool to manage AI agent skills from the [antiskills](https://github.com/vunamhung/antiskills) repository.

## Installation

```bash
npm install -g antikit
```

## Usage

### List available skills from remote

```bash
antikit list
# or
antikit ls

# Search skills by name
antikit list -s <query>
```

### List installed local skills

```bash
antikit local
# or
antikit l
```

### Install a skill

```bash
antikit install <skill-name>
# or
antikit i <skill-name>

# Force overwrite if exists
antikit install <skill-name> --force
```

### Remove a skill

```bash
antikit remove <skill-name>
# or
antikit rm <skill-name>
```

## Requirements

- Node.js >= 18.0.0
- Git (for installing skills)
- A project with `.agent/skills` directory

## How it works

1. Skills are fetched from the `vunamhung/antiskills` GitHub repository
2. Each skill is a folder containing a `SKILL.md` file with YAML frontmatter
3. Skills are installed to the nearest `.agent/skills` directory in your project

## License

MIT
