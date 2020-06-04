interface Changes {
    readonly repo: string;
    readonly changes: File[];
    readonly warnings?: string[];
    readonly errors?: string[];
}

interface File {
    readonly path: string;
    readonly updates: string;
}