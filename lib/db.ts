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

async function initializePool() {
  if (!poolInitialized) {
    try {
      // Initialize Oracle client if not already initialized
      if (!clientInitialized) {
        initializeOracleClient();
      }

      // Create connection pool
      await oracledb.createPool({
        user: process.env.FLEXCUBE_DB_USER,
        password: process.env.FLEXCUBE_DB_PASSWORD,
        connectString: process.env.FLEXCUBE_DB_CONNECTION_STRING,
        poolIncrement: 1,
        poolMin: 1,
        poolMax: 4,
        poolTimeout: 300
      });

      poolInitialized = true;
      console.log('Oracle connection pool initialized successfully');
    } catch (err) {
      console.error('Error initializing connection pool:', err);
      throw err;
    }
  }
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
    console.log('Connection pool closed');
  } catch (err) {
    console.error('Error closing connection pool:', err);
  }
}