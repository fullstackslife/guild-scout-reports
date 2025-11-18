/**
 * Oracle Cloud Infrastructure (OCI) Object Storage Client
 * 
 * Provides utilities for uploading, downloading, and managing files in OCI Object Storage.
 * Replaces Supabase Storage functionality.
 * 
 * Note: OCI SDK packages may need to be installed separately:
 * npm install oci-objectstorage oci-common
 */

// OCI SDK imports - adjust based on actual package structure
// If using separate packages: npm install oci-objectstorage oci-common
import * as objectstorage from 'oci-objectstorage';
import * as common from 'oci-common';

let objectStorageClient: objectstorage.ObjectStorageClient | null = null;
let authenticationProvider: common.ConfigFileAuthenticationDetailsProvider | null = null;

/**
 * Initialize OCI authentication provider
 */
function getAuthenticationProvider(): common.ConfigFileAuthenticationDetailsProvider {
  if (authenticationProvider) {
    return authenticationProvider;
  }

  const configFile = process.env.OCI_CONFIG_FILE || '~/.oci/config';
  const profile = process.env.OCI_PROFILE || 'DEFAULT';

  try {
    authenticationProvider = new common.ConfigFileAuthenticationDetailsProvider(
      configFile,
      profile
    );
  } catch (error) {
    // Fallback: try environment variables or instance principal
    console.warn('Failed to load OCI config file, trying environment variables');
    
    // You can also use SimpleAuthenticationDetailsProvider with env vars
    const tenancyId = process.env.OCI_TENANCY_ID;
    const userId = process.env.OCI_USER_ID;
    const fingerprint = process.env.OCI_FINGERPRINT;
    const privateKey = process.env.OCI_PRIVATE_KEY;
    const region = process.env.OCI_REGION || 'us-ashburn-1';

    if (tenancyId && userId && fingerprint && privateKey) {
      authenticationProvider = new common.SimpleAuthenticationDetailsProvider(
        tenancyId,
        userId,
        fingerprint,
        privateKey,
        null,
        common.Region.fromRegionId(region)
      );
    } else {
      throw new Error(
        'OCI authentication not configured. Set OCI_CONFIG_FILE or provide OCI_TENANCY_ID, OCI_USER_ID, OCI_FINGERPRINT, and OCI_PRIVATE_KEY environment variables.'
      );
    }
  }

  return authenticationProvider;
}

/**
 * Get OCI Object Storage client
 */
export function getObjectStorageClient(): objectstorage.ObjectStorageClient {
  if (objectStorageClient) {
    return objectStorageClient;
  }

  const provider = getAuthenticationProvider();

  objectStorageClient = new objectstorage.ObjectStorageClient({
    authenticationDetailsProvider: provider,
  });

  return objectStorageClient;
}

/**
 * Get namespace and compartment from environment
 */
function getStorageConfig() {
  const namespace = process.env.OCI_NAMESPACE;
  const compartmentId = process.env.OCI_COMPARTMENT_ID;
  const bucketName = process.env.OCI_BUCKET_NAME || 'warbot-screenshots';

  if (!namespace) {
    throw new Error('OCI_NAMESPACE environment variable is required');
  }

  if (!compartmentId) {
    throw new Error('OCI_COMPARTMENT_ID environment variable is required');
  }

  return { namespace, compartmentId, bucketName };
}

/**
 * Upload a file to OCI Object Storage
 * 
 * @param objectName - The object name (path) in the bucket
 * @param content - File content as Buffer
 * @param contentType - MIME type of the file
 * @returns The object name (for reference)
 */
export async function uploadToObjectStorage(
  objectName: string,
  content: Buffer,
  contentType: string
): Promise<string> {
  const client = getObjectStorageClient();
  const { namespace, bucketName } = getStorageConfig();

  const putObjectRequest: objectstorage.requests.PutObjectRequest = {
    namespaceName: namespace,
    bucketName: bucketName,
    putObjectBody: content,
    objectName: objectName,
    contentLength: content.length,
    contentType: contentType,
  };

  try {
    await client.putObject(putObjectRequest);
    return objectName;
  } catch (error) {
    console.error('Failed to upload to OCI Object Storage:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from OCI Object Storage
 * 
 * @param objectName - The object name (path) to delete
 */
export async function deleteFromObjectStorage(objectName: string): Promise<void> {
  const client = getObjectStorageClient();
  const { namespace, bucketName } = getStorageConfig();

  const deleteObjectRequest: objectstorage.requests.DeleteObjectRequest = {
    namespaceName: namespace,
    bucketName: bucketName,
    objectName: objectName,
  };

  try {
    await client.deleteObject(deleteObjectRequest);
  } catch (error) {
    console.error('Failed to delete from OCI Object Storage:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a pre-authenticated request (signed URL) for accessing an object
 * 
 * @param objectName - The object name (path) in the bucket
 * @param expiresInSeconds - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns The signed URL
 */
export async function getObjectStorageUrl(
  objectName: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const client = getObjectStorageClient();
  const { namespace, bucketName } = getStorageConfig();

  const expirationTime = new Date(Date.now() + expiresInSeconds * 1000);

  const createPreauthenticatedRequestDetails: objectstorage.models.CreatePreauthenticatedRequestDetails = {
    name: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    objectName: objectName,
    accessType: objectstorage.models.CreatePreauthenticatedRequestDetails.AccessType.ObjectRead,
    timeExpires: expirationTime,
  };

  const parRequest: objectstorage.requests.CreatePreauthenticatedRequestRequest = {
    namespaceName: namespace,
    bucketName: bucketName,
    createPreauthenticatedRequestDetails: createPreauthenticatedRequestDetails,
  };

  try {
    const parResponse = await client.createPreauthenticatedRequest(parRequest);
    
    // Construct the full URL
    // The accessUri from the response is relative, so we need to prepend the base URL
    const region = client.getRegion();
    const baseUrl = `https://objectstorage.${region.regionId}.oraclecloud.com`;
    const fullUrl = `${baseUrl}${parResponse.preauthenticatedRequest.accessUri}`;
    
    return fullUrl;
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if an object exists in the bucket
 * 
 * @param objectName - The object name to check
 * @returns True if object exists, false otherwise
 */
export async function objectExists(objectName: string): Promise<boolean> {
  const client = getObjectStorageClient();
  const { namespace, bucketName } = getStorageConfig();

  const headObjectRequest: oci.objectstorage.requests.HeadObjectRequest = {
    namespaceName: namespace,
    bucketName: bucketName,
    objectName: objectName,
  };

  try {
    await client.headObject(headObjectRequest);
    return true;
  } catch (error) {
    if (error instanceof common.HttpRequestException && error.statusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Get object metadata
 * 
 * @param objectName - The object name
 * @returns Object metadata
 */
export async function getObjectMetadata(objectName: string): Promise<objectstorage.responses.HeadObjectResponse> {
  const client = getObjectStorageClient();
  const { namespace, bucketName } = getStorageConfig();

  const headObjectRequest: objectstorage.requests.HeadObjectRequest = {
    namespaceName: namespace,
    bucketName: bucketName,
    objectName: objectName,
  };

  try {
    return await client.headObject(headObjectRequest);
  } catch (error) {
    console.error('Failed to get object metadata:', error);
    throw new Error(`Failed to get object metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

