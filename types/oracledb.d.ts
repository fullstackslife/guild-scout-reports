/**
 * Type declarations for oracledb module
 * Oracle Database driver for Node.js
 */

declare module 'oracledb' {
  export interface Pool {
    getConnection(): Promise<Connection>;
    close(): Promise<void>;
  }

  export interface Connection {
    execute<T = any>(
      sql: string,
      binds?: any,
      options?: ExecuteOptions
    ): Promise<Result<T>>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    close(): Promise<void>;
  }

  export interface ExecuteOptions {
    outFormat?: number;
    autoCommit?: boolean;
    [key: string]: unknown;
  }

  export interface Result<T = any> {
    rows?: T[];
    rowsAffected?: number;
    [key: string]: unknown;
  }

  export interface InitOracleClientOptions {
    configDir?: string;
    libDir?: string;
    [key: string]: unknown;
  }

  export interface CreatePoolOptions {
    user: string;
    password: string;
    connectionString: string;
    poolMin?: number;
    poolMax?: number;
    poolIncrement?: number;
    [key: string]: unknown;
  }

  export const OUT_FORMAT_OBJECT: number;

  export function initOracleClient(options?: InitOracleClientOptions): void;
  export function createPool(options: CreatePoolOptions): Promise<Pool>;
}

