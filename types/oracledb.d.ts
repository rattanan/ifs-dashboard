declare module "oracledb" {
  export interface ExecuteResult<T> {
    rows?: T[];
  }

  export interface Connection {
    callTimeout: number;
    execute<T = Record<string, unknown>>(
      sql: string,
      binds?: Record<string, unknown>,
      options?: Record<string, unknown>,
    ): Promise<ExecuteResult<T>>;
    rollback(): Promise<void>;
    close(): Promise<void>;
  }

  export interface Pool {
    getConnection(): Promise<Connection>;
    close(drainTime?: number): Promise<void>;
  }

  const oracledb: {
    OUT_FORMAT_OBJECT: number;
    createPool(config: Record<string, unknown>): Promise<Pool>;
  };

  export default oracledb;
}
