export interface Template {
    id: string;
    name: string;
    label: string;
    category: string;
    technologies: string[];
    description: string;
    messages?: {
        postCreate?: string;
    };
    archiveUrl: string;
    defaultRunOptions?: {

        build?: string;
        memoryMbytes?: number;
        timeoutSecs?: number;
    };
    showcaseFiles?: string[];
    useCases?: string[];
    aliases?: string[];
}

export interface Manifest {
    consoleReadmeSuffixUrl?: string;
    localReadmeSuffixUrl?: string;
    templates: Template[];
}

export function fetchManifest(manifestUrl?: string): Promise<Manifest>;
export const manifestUrl: string;
export const wrapperManifestUrl: string;
