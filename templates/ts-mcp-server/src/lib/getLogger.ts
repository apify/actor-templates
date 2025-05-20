// Source: https://github.com/supercorp-ai/supergateway
import util from 'node:util';
import { Logger } from '../lib/types.js';

const defaultFormatArgs = (args: unknown[]) => args;

const log = (
    {
        formatArgs = defaultFormatArgs,
    }: {
      formatArgs?: typeof defaultFormatArgs
    } = { formatArgs: defaultFormatArgs },
// eslint-disable-next-line no-console
) => (...args: unknown[]) => console.log('[Actorized MCP]', ...formatArgs(args));

const logStderr = (
    {
        formatArgs = defaultFormatArgs,
    }: {
      formatArgs?: typeof defaultFormatArgs
    } = { formatArgs: defaultFormatArgs },
// eslint-disable-next-line no-console
) => (...args: unknown[]) => console.error('[Actorized MCP]', ...formatArgs(args));

const noneLogger: Logger = {
    info: () => {},
    error: () => {},
};

const infoLogger: Logger = {
    info: log(),
    error: logStderr(),
};

const infoLoggerStdio: Logger = {
    info: logStderr(),
    error: logStderr(),
};

const debugFormatArgs = (args: unknown[]) => args.map((arg) => {
    if (typeof arg === 'object') {
        return util.inspect(arg, {
            depth: null,
            colors: process.stderr.isTTY,
            compact: false,
        });
    }

    return arg;
});

const debugLogger: Logger = {
    info: log({ formatArgs: debugFormatArgs }),
    error: logStderr({ formatArgs: debugFormatArgs }),
};

const debugLoggerStdio: Logger = {
    info: logStderr({ formatArgs: debugFormatArgs }),
    error: logStderr({ formatArgs: debugFormatArgs }),
};

export const getLogger = ({
    logLevel,
    outputTransport,
}: {
  logLevel: string
  outputTransport: string
}): Logger => {
    if (logLevel === 'none') {
        return noneLogger;
    }

    if (logLevel === 'debug') {
        return outputTransport === 'stdio' ? debugLoggerStdio : debugLogger;
    }

    // info logLevel
    return outputTransport === 'stdio' ? infoLoggerStdio : infoLogger;
};
