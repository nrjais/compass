#!/usr/bin/env node
'use strict';

/**
 * Simplified release script for personal forks
 * No Jira dependencies - just version bumping and tagging
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { program } = require('commander');
const semver = require('semver');

const monorepoRoot = path.join(__dirname, '..');
const compassPackagePath = path.join(monorepoRoot, 'packages', 'compass');
const compassPackageJsonPath = path.join(compassPackagePath, 'package.json');

function exec(command, options = {}) {
  console.log(`> ${command}`);
  return execSync(command, {
    cwd: monorepoRoot,
    stdio: 'inherit',
    ...options,
  });
}

function getCompassPackageVersion() {
  const pkg = JSON.parse(fs.readFileSync(compassPackageJsonPath, 'utf8'));
  return pkg.version;
}

function updateCompassVersion(newVersion, publisher = null) {
  exec(`npm version --no-git-tag-version ${newVersion}`, {
    cwd: compassPackagePath,
  });

  if (publisher) {
    const pkg = JSON.parse(fs.readFileSync(compassPackageJsonPath, 'utf8'));
    pkg.releasePublisher = publisher;
    fs.writeFileSync(
      compassPackageJsonPath,
      JSON.stringify(pkg, null, 2) + '\n'
    );
  }
}

function commitAndTag(version, message = null) {
  exec('git add .');
  exec(`git commit -m "${message || `v${version}`}"`);
  exec(`git tag v${version}`);
}

program
  .name('simple-release')
  .description('Simplified release tool for Compass forks');

program
  .command('bump')
  .description('Bump version and create a tag')
  .argument('<version>', 'Version to release (e.g., 1.44.0 or 1.44.0-beta.1)')
  .option('-p, --publisher <email>', 'Release publisher email')
  .option('-m, --message <message>', 'Custom commit message')
  .option('--no-tag', 'Skip creating git tag')
  .option('--no-commit', 'Skip committing changes')
  .action((version, options) => {
    // Validate version
    if (!semver.valid(version)) {
      console.error(`Error: Invalid version "${version}"`);
      process.exit(1);
    }

    const currentVersion = getCompassPackageVersion();
    console.log(`Current version: ${currentVersion}`);
    console.log(`New version: ${version}`);

    // Check if version is greater
    if (semver.lte(version, currentVersion)) {
      console.warn(
        `Warning: New version ${version} is not greater than current ${currentVersion}`
      );
    }

    // Update version
    console.log('\nUpdating version...');
    updateCompassVersion(version, options.publisher);

    // Commit and tag
    if (options.commit) {
      console.log('\nCommitting changes...');
      commitAndTag(version, options.message);

      if (options.tag) {
        console.log(`\n✓ Version bumped to ${version} and tagged`);
        console.log('\nTo push the release:');
        console.log(`  git push origin main`);
        console.log(`  git push origin v${version}`);
      } else {
        console.log(`\n✓ Version bumped to ${version} (no tag created)`);
      }
    } else {
      console.log(`\n✓ Version bumped to ${version} in package.json`);
      console.log('\nChanges not committed. Review and commit manually.');
    }
  });

program
  .command('current')
  .description('Show current Compass version')
  .action(() => {
    const version = getCompassPackageVersion();
    console.log(version);
  });

program
  .command('next')
  .description('Show next version based on bump type')
  .argument(
    '[type]',
    'Bump type: major, minor, patch, premajor, preminor, prepatch, prerelease',
    'patch'
  )
  .option(
    '--preid <identifier>',
    'Prerelease identifier (e.g., beta, alpha)',
    'beta'
  )
  .action((type, options) => {
    const currentVersion = getCompassPackageVersion();
    const nextVersion = semver.inc(currentVersion, type, options.preid);

    console.log(`Current: ${currentVersion}`);
    console.log(`Next ${type}: ${nextVersion}`);
  });

program
  .command('beta')
  .description('Create a new beta release')
  .option('--from <version>', 'Base version for beta (defaults to next minor)')
  .option('-p, --publisher <email>', 'Release publisher email')
  .action((options) => {
    const currentVersion = getCompassPackageVersion();
    let nextVersion;

    if (options.from) {
      nextVersion = `${options.from}-beta.0`;
    } else {
      // Check if current is already a beta
      const prerelease = semver.prerelease(currentVersion);
      if (prerelease && prerelease[0] === 'beta') {
        nextVersion = semver.inc(currentVersion, 'prerelease', 'beta');
      } else {
        // Bump minor and add beta.0
        const nextMinor = semver.inc(currentVersion, 'minor');
        nextVersion = `${nextMinor}-beta.0`;
      }
    }

    console.log(`Current: ${currentVersion}`);
    console.log(`Creating beta: ${nextVersion}`);

    updateCompassVersion(nextVersion, options.publisher);
    commitAndTag(nextVersion);

    console.log(`\n✓ Beta release ${nextVersion} created`);
    console.log('\nTo push:');
    console.log(`  git push origin main && git push origin v${nextVersion}`);
  });

program
  .command('stable')
  .description('Create a stable release (removes prerelease tags)')
  .argument(
    '[version]',
    'Version to release (omit to use current without prerelease)'
  )
  .option('-p, --publisher <email>', 'Release publisher email')
  .action((version, options) => {
    const currentVersion = getCompassPackageVersion();
    let nextVersion;

    if (version) {
      nextVersion = version;
    } else {
      // Remove prerelease from current version
      const parsed = semver.parse(currentVersion);
      nextVersion = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
    }

    if (!semver.valid(nextVersion) || semver.prerelease(nextVersion)) {
      console.error(`Error: "${nextVersion}" is not a valid stable version`);
      process.exit(1);
    }

    console.log(`Current: ${currentVersion}`);
    console.log(`Creating stable: ${nextVersion}`);

    updateCompassVersion(nextVersion, options.publisher);
    commitAndTag(nextVersion);

    console.log(`\n✓ Stable release ${nextVersion} created`);
    console.log('\nTo push:');
    console.log(`  git push origin main && git push origin v${nextVersion}`);
  });

program.parse();
