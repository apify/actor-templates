import { v4 } from 'uuid';

// as per https://github.com/microsoft/playwright/issues/13522
const ansiRegex = new RegExp('[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))', 'g');
function stripAnsi(str: string): string {
    return str.replace(ansiRegex, '');
}

export function transformToTabular(testResults: Record<string, any>, attachmentLinks: Attachment[]): any[] {
    const acc: any[] = [];

    for (let suite of testResults.suites) {
        for (let test of suite.specs) {
            for (let runner of test.tests) {
                const { results } = runner;

                acc.push({
                    suiteName: suite.title,
                    testName: test.title,
                    runnerName: runner.projectName,
                    result: runner.status === 'expected',
                    errors: results.reduce((p: string[], e: {errors: {message: string}[]}) => [...p, ...e.errors.map(e => stripAnsi(e.message))], []),
                    duration: results.reduce((acc: number, curr: {duration: number}) => acc + curr.duration, 0),
                    video: attachmentLinks.find(x => results.reduce((p: string[], x: {attachments: { path:string }[]}) => [...p, ...x.attachments.map(x => x.path)], []).includes(x.path))?.url,
                })
            }
        }
    }

    return acc;
}

interface Attachment {
    key: string;
    path: string;
    type: string;
    url?: string;
};

function _collectAttachmentPaths(acc: Attachment[], testResults: Record<string, any>) {
    for(let e of Object.entries(testResults)) {
        const [key, value] = e;
        if (key === 'attachments') {
            for(let attachment of value) {
                acc.push({ path: attachment.path, type: attachment.contentType, key: v4() });
            }
        } else if (typeof value === 'object' && value !== null) {
            _collectAttachmentPaths(acc, value);
        }
    }
}

export function collectAttachmentPaths(testResults: Record<string, any>): Attachment[] {
    const acc: any[] = [];
    _collectAttachmentPaths(acc, testResults);

    return acc;
}
