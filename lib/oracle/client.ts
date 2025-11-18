/**
 * Oracle Database Client
 * 
 * Provides connection pooling and query utilities for Oracle Autonomous Database.
 * Compatible with PostgreSQL-style queries with minor adjustments.
 */

import oracledb from 'oracledb';

// Connection pool instance
let pool: oracledb.Pool | null = null;
let clientInitialized = false;

export interface OracleConfig {
  user: string;
  password: string;
  connectionString: string;
  poolMin?: number;
  poolMax?: number;
  poolIncrement?: number;
}

/**
 * Initialize Oracle connection pool
 */
export async function initOraclePool(config?: Partial<OracleConfig>): Promise<oracledb.Pool> {
  if (pool) {
    return pool;
  }

  const defaultConfig: OracleConfig = {
    user: process.env.ORACLE_DB_USER || '',
    password: process.env.ORACLE_DB_PASSWORD || '',
    connectionString: process.env.ORACLE_DB_CONNECTION_STRING || '',
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
  };

  const finalConfig = { ...defaultConfig, ...config };

  if (!finalConfig.user || !finalConfig.password || !finalConfig.connectionString) {
    throw new Error('Oracle database configuration is missing. Please set ORACLE_DB_USER, ORACLE_DB_PASSWORD, and ORACLE_DB_CONNECTION_STRING environment variables.');
  }

  try {
    // Set TNS_ADMIN if provided (for wallet-based connections)
    // Only initialize once
    if (process.env.TNS_ADMIN && !clientInitialized) {
      // Handle paths with spaces - ensure proper quoting/escaping
      const tnsAdminPath = process.env.TNS_ADMIN.trim();
      console.log(`🔐 Initializing Oracle client with wallet: ${tnsAdminPath}`);
      
      // Check if path exists
      const fs = require('fs');
      if (!fs.existsSync(tnsAdminPath)) {
        throw new Error(`Wallet directory not found: ${tnsAdminPath}. Please check TNS_ADMIN path.`);
      }
      
      // Initialize Oracle client with wallet
      const initOptions: any = { configDir: tnsAdminPath };
      
      // Set Instant Client library directory
      // Check environment variable first, then try common locations
      let libDir = process.env.ORACLE_CLIENT_LIB_DIR;
      
      if (!libDir) {
        // Try common installation paths
        const commonPaths = [
          'C:\\oracle\\instantclient_23_8',
          'C:\\oracle\\instantclient_21_13',
          'C:\\oracle\\instantclient_19_19',
          process.env.ORACLE_HOME ? `${process.env.ORACLE_HOME}\\instantclient_23_8` : null,
        ].filter(Boolean);
        
        const fs = require('fs');
        for (const path of commonPaths) {
          if (fs.existsSync(path)) {
            libDir = path;
            console.log(`📦 Found Oracle Instant Client at: ${libDir}`);
            break;
          }
        }
      }
      
      if (libDir) {
        initOptions.libDir = libDir;
        console.log(`🔧 Using Oracle Instant Client from: ${libDir}`);
      } else {
        console.warn('⚠️  Oracle Instant Client not found. Make sure it\'s in PATH or set ORACLE_CLIENT_LIB_DIR');
      }
      
      oracledb.initOracleClient(initOptions);
      clientInitialized = true;
      console.log('✅ Oracle client initialized with wallet');
    }

    pool = await oracledb.createPool({
      user: finalConfig.user,
      password: finalConfig.password,
      connectionString: finalConfig.connectionString,
      poolMin: finalConfig.poolMin,
      poolMax: finalConfig.poolMax,
      poolIncrement: finalConfig.poolIncrement,
    });

    console.log('Oracle connection pool created successfully');
    if (process.env.TNS_ADMIN) {
      console.log(`Using wallet from: ${process.env.TNS_ADMIN}`);
    }
    return pool;
  } catch (error) {
    console.error('Failed to create Oracle connection pool:', error);
    throw error;
  }
}

/**
 * Get existing pool or create new one
 */
export async function getOraclePool(): Promise<oracledb.Pool> {
  if (!pool) {
    return await initOraclePool();
  }
  return pool;
}

/**
 * Execute a query and return results
 */
export async function executeQuery<T = any>(
  sql: string,
  binds: any = {},
  options: oracledb.ExecuteOptions = {}
): Promise<T[]> {
  const connection = await (await getOraclePool()).getConnection();
  
  try {
    const result = await connection.execute<T>(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      ...options,
    });

    return result.rows as T[];
  } finally {
    await connection.close();
  }
}

/**
 * Execute a query and return single row
 */
export async function executeQueryOne<T = any>(
  sql: string,
  binds: any = {},
  options: oracledb.ExecuteOptions = {}
): Promise<T | null> {
  const results = await executeQuery<T>(sql, binds, options);
  return results[0] || null;
}

/**
 * Execute an INSERT, UPDATE, or DELETE statement
 */
export async function executeUpdate(
  sql: string,
  binds: any = {},
  options: oracledb.ExecuteOptions = {}
): Promise<number> {
  const connection = await (await getOraclePool()).getConnection();
  
  try {
    const result = await connection.execute(sql, binds, {
      autoCommit: true,
      ...options,
    });

    return result.rowsAffected || 0;
  } finally {
    await connection.close();
  }
}

/**
 * Execute a transaction (multiple statements)
 */
export async function executeTransaction<T>(
  callback: (connection: oracledb.Connection) => Promise<T>
): Promise<T> {
  const connection = await (await getOraclePool()).getConnection();
  
  try {
    await connection.execute('BEGIN', {});
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
  }
}

/**
 * Close the connection pool
 */
export async function closeOraclePool(): Promise<void> {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      console.log('Oracle connection pool closed');
    } catch (error) {
      console.error('Error closing Oracle connection pool:', error);
      throw error;
    }
  }
}

/**
 * Convert Oracle RAW(16) UUID to string format
 */
export function rawToUuid(raw: Buffer | string): string {
  if (typeof raw === 'string') {
    return raw;
  }
  if (Buffer.isBuffer(raw)) {
    return raw.toString('hex').replace(
      /(.{8})(.{4})(.{4})(.{4})(.{12})/,
      '$1-$2-$3-$4-$5'
    );
  }
  return '';
}

/**
 * Convert UUID string to Oracle RAW(16)
 */
export function uuidToRaw(uuid: string): Buffer {
  const hex = uuid.replace(/-/g, '');
  return Buffer.from(hex, 'hex');
}

/**
 * Generate a new UUID compatible with Oracle
 */
export function generateOracleUuid(): string {
  // Use crypto.randomUUID() if available, otherwise generate manually
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: generate UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

