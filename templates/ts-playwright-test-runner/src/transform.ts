import { v4 } from 'uuid';

// as per https://github.com/microsoft/playwright/issues/13522
const ansiRegex =
    // eslint-disable-next-line no-control-regex
    /[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d/#&.:=?%@~_]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-ntqry=><~]))/g;
function stripAnsi(str: string): string {
    return str.replace(ansiRegex, '');
}

interface Attachment {
    key: string;
    path: string;
    type: string;
    url?: string;
    contentType: string;
}

// eslint-disable-next-line
export function transformToTabular(testResults: Record<string, any>, attachmentLinks: Attachment[]): unknown[] {
    const acc: unknown[] = [];

    for (const suite of testResults.suites) {
        for (const test of suite.specs) {
            for (const runner of test.tests) {
                const { results } = runner;

                acc.push({
                    suiteName: suite.title,
                    testName: test.title,
                    runnerName: runner.projectName,
                    result: runner.status === 'expected',
                    errors: results.reduce(
                        (p: string[], e: { errors: { message: string }[] }) => [
                            ...p,
                            ...e.errors.map((err) => stripAnsi(err.message)),
                        ],
                        [],
                    ),
                    duration: results.reduce((acc2: number, curr: { duration: number }) => acc2 + curr.duration, 0),
                    video: attachmentLinks.find((link) =>
                        results
                            .reduce(
                                (p: string[], x: { attachments: { path: string }[] }) => [
                                    ...p,
                                    ...x.attachments.map((att) => att.path),
                                ],
                                [],
                            )
                            .includes(link.path),
                    )?.url,
                });
            }
        }
    }

    return acc;
}

// eslint-disable-next-line no-underscore-dangle
function _collectAttachmentPaths(acc: Partial<Attachment>[], testResults: Record<string, unknown>) {
    for (const e of Object.entries(testResults)) {
        const [key, value] = e;
        if (key === 'attachments') {
            for (const attachment of value as Attachment[]) {
                acc.push({ path: attachment.path, type: attachment.contentType, key: v4() });
            }
        } else if (typeof value === 'object' && value !== null) {
            _collectAttachmentPaths(acc, value as Record<string, unknown>);
        }
    }
}

export function collectAttachmentPaths(testResults: Record<string, unknown>): Attachment[] {
    const acc: Attachment[] = [];
    _collectAttachmentPaths(acc, testResults);

    return acc;
}
