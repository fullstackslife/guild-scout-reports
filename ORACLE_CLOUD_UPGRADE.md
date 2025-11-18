# Oracle Cloud Infrastructure (OCI) Upgrade Guide

This guide outlines how to upgrade your Warbot.app application to use Oracle Cloud Infrastructure services, replacing Supabase components with OCI equivalents.

## Overview

Your current stack uses:
- **Supabase PostgreSQL** → Migrate to **Oracle Autonomous Database**
- **Supabase Storage** → Migrate to **OCI Object Storage**
- **Supabase Auth** → Keep or migrate to **Oracle Identity Cloud Service** (optional)
- **Vercel Deployment** → Deploy to **OCI Container Instances** or **OCI Functions**

## Architecture Comparison

### Current Architecture
```
Next.js App (Vercel)
    ↓
Supabase (PostgreSQL + Auth + Storage)
    ↓
Anthropic Claude API (OCR)
```

### Oracle Cloud Architecture
```
Next.js App (OCI Container Instances / OKE)
    ↓
Oracle Autonomous Database (PostgreSQL compatible)
    ↓
OCI Object Storage (S3-compatible)
    ↓
Oracle Identity Cloud Service (optional)
    ↓
Anthropic Claude API (OCR)
```

## Migration Strategy

### Phase 1: Database Migration (Oracle Autonomous Database)

Oracle offers **Autonomous Database for PostgreSQL** which is PostgreSQL-compatible, making migration easier.

#### Step 1: Create Oracle Autonomous Database

1. **Sign up for Oracle Cloud** (free tier available)
   - Visit: https://www.oracle.com/cloud/free/
   - Create account and set up tenancy

2. **Create Autonomous Database**
   - Navigate to: Oracle Cloud Console → Autonomous Database → Create Autonomous Database
   - Choose: **Autonomous Database for PostgreSQL**
   - Configuration:
     - Display Name: `warbot-db`
     - Database Name: `warbot`
     - Workload Type: **OLTP** (Online Transaction Processing)
     - Deployment Type: **Shared Infrastructure** (free tier)
     - Always Free: **Yes** (if available)
     - Admin Password: Set a strong password
     - Network Access: **Secure access from everywhere** (or configure VCN)

3. **Get Connection Details**
   - After creation, click on the database
   - Go to **Database Connection** tab
   - Download **Wallet** (for TLS connection)
   - Note the **Connection String** (format: `hostname:port/service_name`)

#### Step 2: Install Oracle Database Client Libraries

```bash
npm install oracledb
```

#### Step 3: Create Database Connection Utility

Create `lib/oracle/client.ts`:

```typescript
import oracledb from 'oracledb';

// Oracle connection pool configuration
let pool: oracledb.Pool | null = null;

export async function getOraclePool(): Promise<oracledb.Pool> {
  if (pool) {
    return pool;
  }

  pool = await oracledb.createPool({
    user: process.env.ORACLE_DB_USER,
    password: process.env.ORACLE_DB_PASSWORD,
    connectionString: process.env.ORACLE_DB_CONNECTION_STRING,
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
  });

  return pool;
}

export async function closeOraclePool() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}
```

#### Step 4: Convert PostgreSQL Schema to Oracle

Oracle Autonomous Database for PostgreSQL is mostly compatible, but you'll need to adjust:

1. **UUID Generation**: Oracle uses `SYS_GUID()` instead of `gen_random_uuid()`
2. **Timestamps**: Use `SYSTIMESTAMP` instead of `timezone('utc', now())`
3. **Extensions**: Some PostgreSQL extensions may not be available

Create migration file: `oracle/migrations/0001_init.sql`

```sql
-- Create profiles table
CREATE TABLE profiles (
  id RAW(16) PRIMARY KEY,
  email VARCHAR2(255) NOT NULL,
  display_name VARCHAR2(255) NOT NULL,
  username VARCHAR2(100) UNIQUE,
  phone VARCHAR2(20) UNIQUE,
  role VARCHAR2(20) NOT NULL DEFAULT 'member',
  active NUMBER(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP
);

-- Create screenshots table
CREATE TABLE screenshots (
  id RAW(16) PRIMARY KEY DEFAULT SYS_GUID(),
  user_id RAW(16) NOT NULL,
  file_path VARCHAR2(500) NOT NULL,
  label VARCHAR2(500),
  extracted_text CLOB,
  processing_status VARCHAR2(20) DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT SYSTIMESTAMP,
  CONSTRAINT fk_screenshot_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_screenshots_user_id ON screenshots(user_id, created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
BEGIN
  :NEW.updated_at := SYSTIMESTAMP;
END;
/
```

#### Step 5: Update Environment Variables

Add to `.env.local`:

```env
# Oracle Database
ORACLE_DB_USER=admin
ORACLE_DB_PASSWORD=your_password
ORACLE_DB_CONNECTION_STRING=your_hostname:1521/your_service_name

# Keep Supabase for now (during migration)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Phase 2: Object Storage Migration (OCI Object Storage)

#### Step 1: Create OCI Object Storage Bucket

1. **Navigate to Object Storage**
   - Oracle Cloud Console → Object Storage → Buckets
   - Click **Create Bucket**

2. **Configure Bucket**
   - Name: `warbot-screenshots`
   - Storage Tier: **Standard**
   - Encryption: **Encrypt using Oracle-managed keys**
   - Visibility: **Private** (or Public if needed)
   - Versioning: **Enabled** (optional, for backup)

3. **Create IAM User and Policy**
   - Create a user for API access
   - Create a policy:
     ```
     Allow group ObjectStorageUsers to manage objects in compartment <compartment-name> where target.bucket.name='warbot-screenshots'
     ```
   - Generate API keys for the user
   - Download the private key

#### Step 2: Install OCI SDK

```bash
npm install oci-sdk
```

#### Step 3: Create OCI Storage Client

Create `lib/oracle/storage.ts`:

```typescript
import * as oci from 'oci-sdk';
import * as fs from 'fs';

let objectStorageClient: oci.objectstorage.ObjectStorageClient | null = null;

export function getObjectStorageClient(): oci.objectstorage.ObjectStorageClient {
  if (objectStorageClient) {
    return objectStorageClient;
  }

  const provider = new oci.common.ConfigFileAuthenticationDetailsProvider(
    process.env.OCI_CONFIG_FILE || '~/.oci/config',
    process.env.OCI_PROFILE || 'DEFAULT'
  );

  objectStorageClient = new oci.objectstorage.ObjectStorageClient({
    authenticationDetailsProvider: provider,
  });

  return objectStorageClient;
}

export async function uploadToObjectStorage(
  bucketName: string,
  objectName: string,
  content: Buffer,
  contentType: string
): Promise<string> {
  const client = getObjectStorageClient();
  const namespaceName = process.env.OCI_NAMESPACE!;
  const compartmentId = process.env.OCI_COMPARTMENT_ID!;

  const putObjectRequest: oci.objectstorage.requests.PutObjectRequest = {
    namespaceName,
    bucketName,
    putObjectBody: content,
    objectName,
    contentLength: content.length,
    contentType,
  };

  const response = await client.putObject(putObjectRequest);
  
  // Generate pre-authenticated request URL (signed URL)
  const createPreauthenticatedRequestDetails: oci.objectstorage.models.CreatePreauthenticatedRequestDetails = {
    name: `temp-${Date.now()}`,
    objectName,
    accessType: oci.objectstorage.models.CreatePreauthenticatedRequestDetails.AccessType.ObjectRead,
    timeExpires: new Date(Date.now() + 3600 * 1000), // 1 hour
  };

  const parRequest: oci.objectstorage.requests.CreatePreauthenticatedRequestRequest = {
    namespaceName,
    bucketName,
    createPreauthenticatedRequestDetails,
  };

  const parResponse = await client.createPreauthenticatedRequest(parRequest);
  return `${parResponse.preauthenticatedRequest.accessUri}`;
}

export async function deleteFromObjectStorage(
  bucketName: string,
  objectName: string
): Promise<void> {
  const client = getObjectStorageClient();
  const namespaceName = process.env.OCI_NAMESPACE!;

  const deleteObjectRequest: oci.objectstorage.requests.DeleteObjectRequest = {
    namespaceName,
    bucketName,
    objectName,
  };

  await client.deleteObject(deleteObjectRequest);
}

export async function getObjectStorageUrl(
  bucketName: string,
  objectName: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const client = getObjectStorageClient();
  const namespaceName = process.env.OCI_NAMESPACE!;

  const createPreauthenticatedRequestDetails: oci.objectstorage.models.CreatePreauthenticatedRequestDetails = {
    name: `temp-${Date.now()}`,
    objectName,
    accessType: oci.objectstorage.models.CreatePreauthenticatedRequestDetails.AccessType.ObjectRead,
    timeExpires: new Date(Date.now() + expiresInSeconds * 1000),
  };

  const parRequest: oci.objectstorage.requests.CreatePreauthenticatedRequestRequest = {
    namespaceName,
    bucketName,
    createPreauthenticatedRequestDetails,
  };

  const parResponse = await client.createPreauthenticatedRequest(parRequest);
  return `${parResponse.preauthenticatedRequest.accessUri}`;
}
```

#### Step 4: Update Environment Variables

```env
# OCI Configuration
OCI_CONFIG_FILE=~/.oci/config
OCI_PROFILE=DEFAULT
OCI_NAMESPACE=your_namespace
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..xxxxx
OCI_BUCKET_NAME=warbot-screenshots
```

### Phase 3: Authentication Options

You have two options:

#### Option A: Keep Supabase Auth (Easiest)
- Continue using Supabase Auth for authentication
- Only migrate database and storage
- Minimal code changes

#### Option B: Migrate to Oracle Identity Cloud Service
- Full Oracle stack
- More complex setup
- Better enterprise features

**Recommendation**: Start with Option A, migrate auth later if needed.

### Phase 4: Deployment to OCI

#### Option 1: OCI Container Instances (Easiest)

1. **Build Docker Image**
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:18-alpine
   WORKDIR /app
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/.next ./.next
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/package.json ./package.json
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Push to OCI Container Registry**
   ```bash
   # Login to OCI Registry
   docker login <region-key>.ocir.io
   
   # Build and push
   docker build -t <region-key>.ocir.io/<tenancy-namespace>/warbot-app:latest .
   docker push <region-key>.ocir.io/<tenancy-namespace>/warbot-app:latest
   ```

3. **Create Container Instance**
   - Navigate to: Container Instances → Create Container Instance
   - Configure:
     - Name: `warbot-app`
     - Image: Your pushed image
     - Shape: **Always Free Eligible** (if available)
     - Networking: Public IP
     - Environment Variables: Add all required env vars

#### Option 2: OCI Kubernetes Engine (OKE) (Advanced)

For production workloads, use OKE for better scalability and management.

## Migration Checklist

### Database Migration
- [ ] Create Oracle Autonomous Database
- [ ] Convert PostgreSQL schema to Oracle-compatible SQL
- [ ] Create database connection utilities
- [ ] Migrate existing data (if any)
- [ ] Update all database queries to use Oracle client
- [ ] Test all database operations

### Storage Migration
- [ ] Create OCI Object Storage bucket
- [ ] Set up IAM user and policies
- [ ] Create storage client utilities
- [ ] Update upload/download code
- [ ] Migrate existing files (if any)
- [ ] Test file operations

### Application Updates
- [ ] Update environment variables
- [ ] Replace Supabase client calls with Oracle equivalents
- [ ] Update authentication flow (if migrating auth)
- [ ] Test all features end-to-end
- [ ] Update documentation

### Deployment
- [ ] Build Docker image
- [ ] Push to OCI Container Registry
- [ ] Create Container Instance or OKE cluster
- [ ] Configure networking and security
- [ ] Set up monitoring and logging
- [ ] Test production deployment

## Cost Comparison

### Supabase (Current)
- **Free Tier**: 
  - Database: 500 MB
  - Storage: 1 GB
  - Bandwidth: 2 GB/month
- **Paid**: ~$25/month for basic plan

### Oracle Cloud (Always Free)
- **Autonomous Database**: 2 databases, 20GB each (40GB total)
- **Object Storage**: 10GB
- **Bandwidth**: 10 TB/month
- **Container Instances**: Limited free tier (check current availability)
- **Compute**: 2 VMs (1/8 OCPU each - very limited)

**Comparison**:
- ✅ **20x more database storage** (20GB vs 500MB)
- ✅ **10x more file storage** (10GB vs 1GB)
- ✅ **5,000x more bandwidth** (10TB vs 2GB)
- ⚠️ **No free auth service** (keep Supabase Auth - it's free!)

**Recommendation**: Use Oracle for database + storage, keep Supabase for auth = **Best of both worlds, still $0/month!**

See **ORACLE_FREE_TIER_GUIDE.md** for detailed free tier comparison and limits.

## Benefits of Oracle Cloud

1. **Enterprise-Grade**: Better for production workloads
2. **Always Free Tier**: Generous free resources
3. **Global Infrastructure**: Multiple regions
4. **Security**: Advanced security features
5. **Compliance**: SOC 2, ISO 27001 certified
6. **Support**: Enterprise support options

## Challenges & Considerations

1. **Learning Curve**: OCI has a steeper learning curve than Supabase
2. **Migration Effort**: Requires code changes
3. **PostgreSQL Compatibility**: Most features work, but some edge cases may differ
4. **Authentication**: If migrating auth, more complex setup
5. **Documentation**: Less community resources than Supabase

## Recommended Approach

1. **Start Small**: Migrate storage first (easiest)
2. **Test Thoroughly**: Use staging environment
3. **Gradual Migration**: Keep Supabase running during migration
4. **Monitor Costs**: Track usage on OCI
5. **Document Changes**: Keep migration notes

## Next Steps

1. Create Oracle Cloud account
2. Set up Autonomous Database
3. Create Object Storage bucket
4. Implement storage client
5. Test with small dataset
6. Gradually migrate features

## Resources

- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Autonomous Database Documentation](https://docs.oracle.com/en/cloud/paas/autonomous-database/)
- [OCI Object Storage Documentation](https://docs.oracle.com/en-us/iaas/Content/Object/Concepts/objectstorageoverview.htm)
- [OCI Container Instances](https://docs.oracle.com/en-us/iaas/Content/container-instances/home.htm)
- [OCI SDK for Node.js](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/javasdk.htm)

## Support

For Oracle Cloud specific questions:
- Oracle Cloud Documentation
- Oracle Cloud Support (if on paid tier)
- Oracle Community Forums

