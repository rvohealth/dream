export default function shouldBypassDefaultScope(scopeName: string, { bypassAllDefaultScopes, defaultScopesToBypass, }: {
    bypassAllDefaultScopes?: boolean;
    defaultScopesToBypass: string[];
}): boolean;
