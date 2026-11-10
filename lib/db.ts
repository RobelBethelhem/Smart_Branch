import oracledb from 'oracledb';

// Define interfaces
interface QueryResult {
  success: boolean;
  data?: any[];
  error?: string;
}

interface DbConfig {
  user: string | undefined;
  password: string | undefined;
  connectString: string | undefined;
}

// Database configuration
const dbConfig: DbConfig = {
  user: process.env.FLEXCUBE_DB_USER,
  password: process.env.FLEXCUBE_DB_PASSWORD,
  connectString: process.env.FLEXCUBE_DB_CONNECTION_STRING,
};

// Track client initialization
let clientInitialized = false;

// Initialize Oracle client
export function initializeOracleClient(): void {
  if (!clientInitialized) {
    try {
      oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_PATH });
      clientInitialized = true;
      console.log('Oracle client initialized successfully');
    } catch (err) {
      if (!(err as Error).message.includes('NJS-090')) {
        console.error('Error initializing Oracle client:', err);
        throw err;
      }
    }
  }
}

let poolInitialized = false;

// Optional default schema. When the app connects as a user that is NOT the
// Flexcube schema owner (e.g. a "smartbranch" user that was only granted SELECT
// on the tables), set FLEXCUBE_SCHEMA so UNqualified table names resolve to the
// owner's schema instead of the connected user's own (empty) schema. Sanitised
// to a bare identifier because it is interpolated into ALTER SESSION (it can't
// be a bind variable). Leave unset in test where you connect as the owner.
const FLEXCUBE_SCHEMA = (process.env.FLEXCUBE_SCHEMA || '').replace(/[^A-Za-z0-9_$#]/g, '');

// Runs once per newly-created pooled connection (not on every getConnection),
// so setting the default schema costs nothing on the hot path.
async function initSession(connection: oracledb.Connection, _requestedTag: string): Promise<void> {
  if (FLEXCUBE_SCHEMA) {
    await connection.execute(`ALTER SESSION SET CURRENT_SCHEMA = ${FLEXCUBE_SCHEMA}`);
  }
}

// Pool size. Fixed (min = max), as Oracle recommends: the pool used to shrink back to one
// connection when idle, so each morning rush logged on again one connection at a time.
// FLEXCUBE_POOL_MAX (default 20) sets the size; FLEXCUBE_POOL_MIN can lower the idle size if
// the DBAs ask. Thick mode runs every call on a libuv thread, so UV_THREADPOOL_SIZE (set in
// the Dockerfile) must stay above the pool size.
const POOL_MAX = Math.max(1, parseInt(process.env.FLEXCUBE_POOL_MAX || '', 10) || 20);
const POOL_MIN = Math.min(POOL_MAX, Math.max(0, parseInt(process.env.FLEXCUBE_POOL_MIN || '', 10) || POOL_MAX));

// The pool is created once. Requests that arrive while it is still being created wait for the
// same promise; before, each of them called createPool and all but the first failed with
// "pool alias already exists" (NJS-046) right after a restart.
let poolPromise: Promise<void> | null = null;

async function createPoolOnce(): Promise<void> {
  // Initialize Oracle client if not already initialized
  if (!clientInitialized) {
    initializeOracleClient();
  }

  // CLOB columns (customer photo / signature text) come back as strings.
  oracledb.fetchAsString = [oracledb.CLOB];

  await oracledb.createPool({
    user: process.env.FLEXCUBE_DB_USER,
    password: process.env.FLEXCUBE_DB_PASSWORD,
    connectString: process.env.FLEXCUBE_DB_CONNECTION_STRING,
    poolIncrement: POOL_MIN === POOL_MAX ? 0 : 1,
    poolMin: POOL_MIN,
    poolMax: POOL_MAX,
    poolTimeout: 300,
    // Wait for a free connection (up to a minute) instead of failing at once under load.
    queueTimeout: 60000,
    sessionCallback: initSession
  });

  poolInitialized = true;
  console.log('Oracle connection pool initialized successfully');
}

async function initializePool() {
  if (poolInitialized) return;
  if (!poolPromise) {
    poolPromise = createPoolOnce().catch((err) => {
      // Let the next request try again (e.g. FlexCube was not reachable yet).
      poolPromise = null;
      console.error('Error initializing connection pool:', err);
      throw err;
    });
  }
  await poolPromise;
}

export async function executeQuery(
  query: string, 
  params: any[] = [], 
  options: any = {}
): Promise<QueryResult> {
  let connection;
  
  try {
    await initializePool();
    
    connection = await oracledb.getConnection();
    
    // Configure CLOB fetching
    oracledb.fetchAsString = [oracledb.CLOB];

    const result = await connection.execute(query, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      ...options
    });

    return {
      success: true,
      data: result.rows || []
    };

  } catch (error) {
    console.error('Database error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

// Add cleanup function for application shutdown
export async function closePool() {
  try {
    await oracledb.getPool().close(10);
    poolInitialized = false;
    poolPromise = null;
    console.log('Connection pool closed');
  } catch (err) {
    console.error('Error closing connection pool:', err);
  }
}