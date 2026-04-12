import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  port: number;
  host: string;
  nodeEnv: string;
  stellar: {
    network: 'testnet' | 'mainnet' | 'futurenet' | 'standalone';
    horizonUrl: string;
    sorobanRpcUrl: string;
    networkPassphrase: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required`);
  }
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return num;
};

const getEnvBoolean = (key: string, defaultValue?: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required`);
  }
  return value.toLowerCase() === 'true';
};

export const config: Config = {
  port: getEnvNumber('PORT', 3001),
  host: getEnvVar('HOST', '0.0.0.0'),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  
  stellar: {
    network: (getEnvVar('STELLAR_NETWORK', 'testnet') as 'testnet' | 'mainnet' | 'futurenet' | 'standalone'),
    horizonUrl: getEnvVar('STELLAR_HORIZON_URL', 'https://horizon-testnet.stellar.org'),
    sorobanRpcUrl: getEnvVar('STELLAR_SOROBAN_RPC_URL', 'https://soroban-testnet.stellar.org'),
    networkPassphrase: getEnvVar('STELLAR_NETWORK_PASSPHRASE', 'Test SDF Network ; September 2015'),
  },
  
  jwt: {
    secret: getEnvVar('JWT_SECRET', 'your-super-secret-jwt-key'),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', '24h'),
  },
  
  cors: {
    origin: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: getEnvBoolean('CORS_CREDENTIALS', true),
  },
};

// Validate configuration
const validateConfig = (): void => {
  const requiredFields = [
    'stellar.horizonUrl',
    'stellar.sorobanRpcUrl',
    'stellar.networkPassphrase',
    'jwt.secret',
  ];

  for (const field of requiredFields) {
    const value = field.split('.').reduce((obj, key) => obj?.[key], config as any);
    if (!value) {
      throw new Error(`Configuration field ${field} is required`);
    }
  }

  // Validate Stellar network
  const validNetworks = ['testnet', 'mainnet', 'futurenet', 'standalone'];
  if (!validNetworks.includes(config.stellar.network)) {
    throw new Error(`Invalid Stellar network: ${config.stellar.network}`);
  }

  // Validate JWT secret length
  if (config.jwt.secret.length < 32) {
    throw new Error('JWT secret must be at least 32 characters long');
  }
};

// Run validation
validateConfig();

export default config;
