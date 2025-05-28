// Source: https://github.com/supercorp-ai/supergateway
export interface Logger {
    info: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
}
