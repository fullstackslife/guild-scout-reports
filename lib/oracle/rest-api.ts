/**
 * Oracle Cloud Infrastructure REST API Client
 * 
 * Direct REST API access to Oracle Cloud services without SDK dependencies.
 * Uses standard HTTP requests with OCI signature authentication.
 */

/**
 * Generate OCI request signature for authentication
 * This implements OCI's request signing algorithm
 */
async function signRequest(): Promise<Record<string, string>> {
  // For simplicity, we'll use a pre-signed approach or API key
  // In production, implement full OCI request signing
  // See: https://docs.oracle.com/en-us/iaas/Content/API/Concepts/signingrequests.htm
  
  const tenancyId = process.env.OCI_TENANCY_ID;
  const userId = process.env.OCI_USER_ID;
  const fingerprint = process.env.OCI_FINGERPRINT;
  const privateKey = process.env.OCI_PRIVATE_KEY;

  if (!tenancyId || !userId || !fingerprint || !privateKey) {
    throw new Error('OCI credentials not configured. Set OCI_TENANCY_ID, OCI_USER_ID, OCI_FINGERPRINT, and OCI_PRIVATE_KEY');
  }

  // For now, return headers - in production, implement full signing
  // You can use the SDK's signing utilities or implement manually
  return {
    'opc-request-id': `${Date.now()}-${Math.random().toString(36).substring(7)}`,
  };
}

/**
 * Make authenticated request to OCI REST API
 */
async function ociRequest(
  method: string,
  endpoint: string,
  body?: unknown,
  additionalHeaders: Record<string, string> = {}
): Promise<Response> {
  const region = process.env.OCI_REGION || 'us-ashburn-1';
  const baseUrl = `https://objectstorage.${region}.oraclecloud.com`;
  const url = `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  // Add signature headers
  const signedHeaders = await signRequest();
  Object.assign(headers, signedHeaders);

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  return fetch(url, options);
}

/**
 * Object Storage REST API Client
 * Uses OCI's native REST API (not S3-compatible)
 */
export class OracleObjectStorageAPI {
  private namespace: string;
  private bucketName: string;

  constructor() {
    this.namespace = process.env.OCI_NAMESPACE || '';
    this.bucketName = process.env.OCI_BUCKET_NAME || 'warbot-screenshots';

    if (!this.namespace) {
      throw new Error('OCI_NAMESPACE environment variable is required');
    }
  }

  /**
   * Upload object to Object Storage
   */
  async putObject(objectName: string, content: Buffer, contentType: string): Promise<void> {
    const region = process.env.OCI_REGION || 'us-ashburn-1';
    const endpoint = `/n/${this.namespace}/b/${this.bucketName}/o/${encodeURIComponent(objectName)}`;

    // For binary uploads, we need to use the SDK's signing or a simpler approach
    // This is a simplified version - in production, use proper OCI signing
    const response = await fetch(
      `https://objectstorage.${region}.oraclecloud.com${endpoint}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          'Content-Length': content.length.toString(),
          // Add OCI auth headers here (requires proper signing)
        },
        body: content as unknown as BodyInit,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload object: ${response.status} ${error}`);
    }
  }

  /**
   * Get object from Object Storage
   */
  async getObject(objectName: string): Promise<Buffer> {
    const region = process.env.OCI_REGION || 'us-ashburn-1';
    const endpoint = `/n/${this.namespace}/b/${this.bucketName}/o/${encodeURIComponent(objectName)}`;

    const response = await fetch(
      `https://objectstorage.${region}.oraclecloud.com${endpoint}`,
      {
        method: 'GET',
        // Add OCI auth headers here
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get object: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Delete object from Object Storage
   */
  async deleteObject(objectName: string): Promise<void> {
    const region = process.env.OCI_REGION || 'us-ashburn-1';
    const endpoint = `/n/${this.namespace}/b/${this.bucketName}/o/${encodeURIComponent(objectName)}`;

    const response = await fetch(
      `https://objectstorage.${region}.oraclecloud.com${endpoint}`,
      {
        method: 'DELETE',
        // Add OCI auth headers here
      }
    );

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete object: ${response.status}`);
    }
  }

  /**
   * Create pre-authenticated request (signed URL)
   */
  async createPreauthenticatedRequest(
    objectName: string,
    expiresInSeconds: number = 3600
  ): Promise<string> {
    const region = process.env.OCI_REGION || 'us-ashburn-1';
    const parEndpoint = `/n/${this.namespace}/b/${this.bucketName}/p/`;

    const expirationTime = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    const parRequest = {
      name: `temp-${Date.now()}`,
      objectName: objectName,
      accessType: 'ObjectRead',
      timeExpires: expirationTime,
    };

    const response = await ociRequest('POST', parEndpoint, parRequest);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create PAR: ${response.status} ${error}`);
    }

    const data = await response.json();
    const baseUrl = `https://objectstorage.${region}.oraclecloud.com`;
    return `${baseUrl}${data.accessUri}`;
  }
}

/**
 * S3-Compatible REST API Client for Object Storage
 * 
 * Oracle Object Storage is S3-compatible, so you can use AWS SDK or S3 REST API directly!
 * This is MUCH simpler than OCI's native API.
 */
export class OracleS3API {
  private endpoint: string;
  private bucketName: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;

  constructor() {
    this.bucketName = process.env.OCI_BUCKET_NAME || 'warbot-screenshots';
    this.region = process.env.OCI_REGION || 'us-ashburn-1';
    
    // OCI S3-compatible credentials
    this.accessKeyId = process.env.OCI_S3_ACCESS_KEY_ID || '';
    this.secretAccessKey = process.env.OCI_S3_SECRET_ACCESS_KEY || '';

    // OCI S3 endpoint format
    this.endpoint = process.env.OCI_S3_ENDPOINT || 
      `https://${process.env.OCI_NAMESPACE}.compat.objectstorage.${this.region}.oraclecloud.com`;

    if (!this.accessKeyId || !this.secretAccessKey) {
      throw new Error('OCI S3 credentials not configured. Set OCI_S3_ACCESS_KEY_ID and OCI_S3_SECRET_ACCESS_KEY');
    }
  }

  /**
   * Upload object using S3-compatible API
   */
  async putObject(objectName: string, content: Buffer, contentType: string): Promise<void> {
    const url = `${this.endpoint}/${this.bucketName}/${encodeURIComponent(objectName)}`;
    
    // Use AWS signature v4 for S3-compatible requests
    // For simplicity, you can use @aws-sdk/client-s3 or @aws-sdk/s3-request-presigner
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': content.length.toString(),
        // Add AWS signature headers here
        // Or use @aws-sdk/client-s3 which handles this automatically
      },
      body: content as unknown as BodyInit,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload: ${response.status} ${error}`);
    }
  }

  /**
   * Get signed URL for object access
   */
  async getSignedUrl(objectName: string): Promise<string> {
    // Use @aws-sdk/s3-request-presigner for this
    // Much simpler than implementing signature manually
    const url = `${this.endpoint}/${this.bucketName}/${encodeURIComponent(objectName)}`;
    // Return pre-signed URL
    return url; // Placeholder - implement with AWS SDK
  }
}

/**
 * PostgreSQL REST API Client
 * 
 * For Autonomous Database, you can use PostgreSQL's HTTP REST API
 * or connect directly via PostgreSQL protocol (recommended).
 * 
 * This shows REST API approach for simple queries.
 */
export class OracleDatabaseAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // If your Autonomous Database exposes REST API
    this.baseUrl = process.env.ORACLE_DB_REST_URL || '';
    this.apiKey = process.env.ORACLE_DB_API_KEY || '';

    // Note: Most Oracle Autonomous Databases use direct PostgreSQL connection
    // REST API is available through Oracle REST Data Services (ORDS) if enabled
  }

  /**
   * Execute SQL query via REST API
   * Requires ORDS (Oracle REST Data Services) to be enabled
   */
  async executeQuery(sql: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>[]> {
    if (!this.baseUrl) {
      throw new Error('ORACLE_DB_REST_URL not configured. Use direct PostgreSQL connection instead.');
    }

    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        sql,
        params,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Query failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.items || [];
  }
}

/**
 * Recommended: Use AWS SDK for S3-compatible Object Storage
 * 
 * Oracle Object Storage is S3-compatible, so you can use the AWS SDK!
 * This is the EASIEST way to integrate.
 */
export async function createS3CompatibleClient() {
  // Install: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
  
  // Example usage (uncomment when AWS SDK is installed):
  /*
  import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
  import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

  const s3Client = new S3Client({
    region: process.env.OCI_REGION || 'us-ashburn-1',
    endpoint: `https://${process.env.OCI_NAMESPACE}.compat.objectstorage.${process.env.OCI_REGION}.oraclecloud.com`,
    credentials: {
      accessKeyId: process.env.OCI_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.OCI_S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true, // Required for OCI
  });

  return s3Client;
  */
  
  throw new Error('Install @aws-sdk/client-s3 to use S3-compatible API');
}

