/**
 * Oracle Object Storage - S3-Compatible API Client
 * 
 * Oracle Object Storage is S3-compatible! Use AWS SDK for easy integration.
 * This is the RECOMMENDED approach - much simpler than OCI native API.
 * 
 * Install: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) {
    return s3Client;
  }

  const region = process.env.OCI_REGION || 'us-ashburn-1';
  const namespace = process.env.OCI_NAMESPACE;
  
  if (!namespace) {
    throw new Error('OCI_NAMESPACE environment variable is required');
  }

  // OCI S3-compatible endpoint
  const endpoint = `https://${namespace}.compat.objectstorage.${region}.oraclecloud.com`;

  // Get credentials from environment
  const accessKeyId = process.env.OCI_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.OCI_S3_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('OCI S3 credentials not configured. Set OCI_S3_ACCESS_KEY_ID and OCI_S3_SECRET_ACCESS_KEY');
  }

  s3Client = new S3Client({
    region: region,
    endpoint: endpoint,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    forcePathStyle: true, // Required for OCI Object Storage
  });

  return s3Client;
}

const BUCKET_NAME = process.env.OCI_BUCKET_NAME || 'warbot-screenshots';

/**
 * Upload file to Oracle Object Storage (S3-compatible)
 */
export async function uploadToS3(
  objectName: string,
  content: Buffer,
  contentType: string
): Promise<string> {
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectName,
    Body: content,
    ContentType: contentType,
  });

  try {
    await client.send(command);
    return objectName;
  } catch (error) {
    console.error('S3 upload failed:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get signed URL for object access
 */
export async function getS3SignedUrl(
  objectName: string,
  expiresIn: number = 3600
): Promise<string> {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectName,
  });

  try {
    const url = await getSignedUrl(client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete object from Object Storage
 */
export async function deleteFromS3(objectName: string): Promise<void> {
  const client = getS3Client();

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectName,
  });

  try {
    await client.send(command);
  } catch (error) {
    console.error('S3 delete failed:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if object exists
 */
export async function objectExistsInS3(objectName: string): Promise<boolean> {
  const client = getS3Client();

  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectName,
  });

  try {
    await client.send(command);
    return true;
  } catch (error: unknown) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Get object metadata
 */
export async function getS3ObjectMetadata(objectName: string) {
  const client = getS3Client();

  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectName,
  });

  try {
    const response = await client.send(command);
    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      etag: response.ETag,
    };
  } catch (error) {
    console.error('Failed to get object metadata:', error);
    throw new Error(`Failed to get metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

