import { execSync } from 'node:child_process';

function runCodegen() {
    execSync(`npx playwright codegen -o ${import.meta.dirname}/../tests/generated-${+Date.now()}.spec.ts`, {
        stdio: 'inherit',
    });
}

runCodegen();
