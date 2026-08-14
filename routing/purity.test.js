import { test, expect } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const routingDir = dirname(fileURLToPath(import.meta.url));

function routingSourceFiles() {
  return readdirSync(routingDir).filter((name) => {
    return name.endsWith('.js') && !name.endsWith('.test.js');
  });
}

test('routing/ decision logic contains no await', () => {
  const files = routingSourceFiles();
  for (const file of files) {
    const content = readFileSync(join(routingDir, file), 'utf8');
    expect(content).not.toMatch(/\bawait\b/);
  }
});
