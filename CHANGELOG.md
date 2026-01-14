# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.11.2](https://github.com/vunamhung/antikit/compare/v1.11.1...v1.11.2) (2026-01-14)

### Chores

- **release:** Remove .releaserc.json configuration file ([60a582e](https://github.com/vunamhung/antikit/commit/60a582e1a1c7e6f110259456b25546b6f2abcd59))

### Documentation

- restructure and expand readme with full command usage ([0a47d43](https://github.com/vunamhung/antikit/commit/0a47d43bd594cc3fcd201035d2570054fa6d14b8))

## [1.11.1](https://github.com/vunamhung/antikit/compare/v1.11.0...v1.11.1) (2026-01-14)

### Documentation

- update readme with private repo authentication guide ([8a305ed](https://github.com/vunamhung/antikit/commit/8a305ede4f61a53faa5421a4752c71b96bf98757))

## [1.11.0](https://github.com/vunamhung/antikit/compare/v1.10.4...v1.11.0) (2026-01-14)

### Features

- **github:** support private repositories via token auth ([02ed231](https://github.com/vunamhung/antikit/commit/02ed231ee70b426954e5c1b77d78ab2c14940e5e))

## [1.10.4](https://github.com/vunamhung/antikit/compare/v1.10.3...v1.10.4) (2026-01-14)

### Bug Fixes

- **cli:** ensure official source always appears at top of list ([5919e10](https://github.com/vunamhung/antikit/commit/5919e10648615f03869fa8e2849bfe85eecf9bdc))

### Styles

- improve rate limit warning with actionable guidance ([bae603c](https://github.com/vunamhung/antikit/commit/bae603ca0aa72669060b8c02b7ec7943e8884053))

### Build System

- configure changelog to verify all types ([86ea584](https://github.com/vunamhung/antikit/commit/86ea58454069f6a06a5a8283580127402318e243))

## [1.10.3](https://github.com/vunamhung/antikit/compare/v1.10.2...v1.10.3) (2026-01-14)

## [1.10.2](https://github.com/vunamhung/antikit/compare/v1.10.1...v1.10.2) (2026-01-14)

### Bug Fixes

- **github:** restore fetchRemoteSkills function and finalize optimization ([9b477de](https://github.com/vunamhung/antikit/commit/9b477dedaa0a3b90de1da5b289f2ba51b1c6b9c7))

## [1.10.1](https://github.com/vunamhung/antikit/compare/v1.10.0...v1.10.1) (2026-01-14)

### Performance Improvements

- **github:** optimize skill fetching via GraphQL (with token) and Raw URL (fallback) ([afd4817](https://github.com/vunamhung/antikit/commit/afd4817c7abaea5011f40542bd8e69d24fd6e449))

# [1.10.0](https://github.com/vunamhung/antikit/compare/v1.9.1...v1.10.0) (2026-01-14)

### Features

- **cli:** add config command to manage github token ([239cf51](https://github.com/vunamhung/antikit/commit/239cf51829207469fd2136500c6843ef8aca0cce))

## [1.9.1](https://github.com/vunamhung/antikit/compare/v1.9.0...v1.9.1) (2026-01-14)

### Bug Fixes

- **github:** support GITHUB_TOKEN auth and handle rate limits ([7bd5dc2](https://github.com/vunamhung/antikit/commit/7bd5dc22c7276345da9a680216e9e6ebe3ee73e4))

# [1.9.0](https://github.com/vunamhung/antikit/compare/v1.8.1...v1.9.0) (2026-01-14)

### Features

- **source:** support sub-directory sources via --path option ([b2e5a0d](https://github.com/vunamhung/antikit/commit/b2e5a0d4d19bd1b11eac8ccb98794e3a9d903289))

## [1.8.1](https://github.com/vunamhung/antikit/compare/v1.8.0...v1.8.1) (2026-01-14)

### Bug Fixes

- **cli:** make list interactive by default and restore -i flag for compatibility ([ad0fa17](https://github.com/vunamhung/antikit/commit/ad0fa17b59b7f9117ca40114b2f374614a419cc9))

# [1.8.0](https://github.com/vunamhung/antikit/compare/v1.7.0...v1.8.0) (2026-01-14)

### Features

- **cli:** add shell autocompletion support via omelette ([7e78cf6](https://github.com/vunamhung/antikit/commit/7e78cf69af520c130224dfd6f45467b9676e9a46))

# [1.7.0](https://github.com/vunamhung/antikit/compare/v1.6.0...v1.7.0) (2026-01-14)

### Features

- **list:** enhance interactive UX with source grouping and sorting ([ef332c2](https://github.com/vunamhung/antikit/commit/ef332c2401d81ed2a9530a8eee79e8a4dcd04842))

# [1.6.0](https://github.com/vunamhung/antikit/compare/v1.5.0...v1.6.0) (2026-01-14)

### Features

- **list:** enhance interactive mode to detecting and prompting for skill updates ([27814da](https://github.com/vunamhung/antikit/commit/27814da6d29d4cceafce5fa6a49cde6d8e869821))

# [1.5.0](https://github.com/vunamhung/antikit/compare/v1.4.0...v1.5.0) (2026-01-14)

### Features

- add upgrade command and dependency management ([0f367b5](https://github.com/vunamhung/antikit/commit/0f367b524f93328b4c539c84fb3a5f11e88e72c4))

# [1.4.0](https://github.com/vunamhung/antikit/compare/v1.3.1...v1.4.0) (2026-01-14)

### Features

- **cli:** add update command for self-updating ([e12cfeb](https://github.com/vunamhung/antikit/commit/e12cfeb14e0a1c9892aab1f9fdac9583651ebdbf))

## [1.3.1](https://github.com/vunamhung/antikit/compare/v1.3.0...v1.3.1) (2026-01-14)

### Bug Fixes

- **update:** use process exit event to ensure notification display ([c936e39](https://github.com/vunamhung/antikit/commit/c936e39f27ab92db591e9863f03a2d986bf20fd2))

# [1.3.0](https://github.com/vunamhung/antikit/compare/v1.2.0...v1.3.0) (2026-01-14)

### Features

- **update:** add update notification when new version available ([cbdc590](https://github.com/vunamhung/antikit/commit/cbdc590413511f4963214ea5f779f49dd5e4b62a))

# [1.2.0](https://github.com/vunamhung/antikit/compare/v1.1.1...v1.2.0) (2026-01-14)

### Features

- **source:** add multi-source support for skill repositories ([8ef5f7d](https://github.com/vunamhung/antikit/commit/8ef5f7dabcf69d7fe5bac0ccca4a94ee37223034))

## [1.1.1](https://github.com/vunamhung/antikit/compare/v1.1.0...v1.1.1) (2026-01-14)

### Bug Fixes

- **cli:** read version from package.json dynamically ([8e830fb](https://github.com/vunamhung/antikit/commit/8e830fb67d2ddfadd917e6021a091024c8dc21af))

# [1.1.0](https://github.com/vunamhung/antikit/compare/v1.0.1...v1.1.0) (2026-01-14)

### Features

- enable CI automated releases ([beb492f](https://github.com/vunamhung/antikit/commit/beb492fcb5abcfb49e9e330e1a30b46f0393a893))

# 1.0.0 (2026-01-14)

### Features

- **install:** update installSkill to get or create skills directory ([ce09519](https://github.com/vunamhung/antikit/commit/ce09519dfa1ded9a9736225e9316d3f224c8bec0))
