export type ClientProps = {
    host?: string;
    integrationId?: string;
    workspaceId?: string;
    botId?: string;
    token?: string;
    timeout?: number;
};
export type ClientConfig = {
    host: string;
    headers: Record<string, string>;
    withCredentials: boolean;
    timeout?: number;
};
export declare function getClientConfig(clientProps: ClientProps): ClientConfig;
