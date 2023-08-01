import { execSync } from 'child_process';

function runCodegen() {
    execSync(`npx playwright codegen -o ${__dirname}/../tests/generated-${+Date.now()}.spec.ts`, { stdio: 'inherit' });
}

runCodegen();
