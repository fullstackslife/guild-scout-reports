# Oracle Cloud REST API Integration Guide

This guide shows you how to use Oracle Cloud REST APIs directly in your Next.js app, without heavy SDK dependencies.

## 🎯 Quick Answer: Yes! Multiple API Options

Oracle Cloud offers **3 ways** to integrate:

1. **S3-Compatible API** (⭐ RECOMMENDED - Easiest!)
2. **OCI Native REST API** (Full control)
3. **PostgreSQL REST API** (For database queries)

## Option 1: S3-Compatible API (Recommended)

**Oracle Object Storage is S3-compatible!** This means you can use the **AWS SDK** which is much simpler.

### Why S3-Compatible API?

✅ **Simplest integration** - Use well-documented AWS SDK  
✅ **No custom signing** - AWS SDK handles authentication  
✅ **Battle-tested** - Millions of apps use it  
✅ **Same API** - Works with Oracle, AWS, MinIO, etc.

### Setup

1. **Install AWS SDK**:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

2. **Get S3-Compatible Credentials from Oracle**:
   - Go to Oracle Cloud Console
   - Navigate to: **Identity** → **Users** → Your User
   - Go to **Customer Secret Keys** section
   - Click **Generate Secret Key**
   - Save the **Access Key** and **Secret Key**

3. **Configure Environment Variables**:
```env
# OCI S3-Compatible Credentials
OCI_S3_ACCESS_KEY_ID=your_access_key_here
OCI_S3_SECRET_ACCESS_KEY=your_secret_key_here
OCI_NAMESPACE=your_namespace
OCI_REGION=us-ashburn-1
OCI_BUCKET_NAME=warbot-screenshots
```

4. **Use the S3 Client** (already created in `lib/oracle/s3-client.ts`):

```typescript
import { uploadToS3, getS3SignedUrl, deleteFromS3 } from '@/lib/oracle/s3-client';

// Upload file
await uploadToS3('user123/screenshot.jpg', buffer, 'image/jpeg');

// Get signed URL
const url = await getS3SignedUrl('user123/screenshot.jpg', 3600);

// Delete file
await deleteFromS3('user123/screenshot.jpg');
```

### Example: Replace Supabase Storage

**Before (Supabase):**
```typescript
const { error } = await supabase.storage
  .from('screenshots')
  .upload(filePath, buffer);
```

**After (Oracle S3):**
```typescript
import { uploadToS3 } from '@/lib/oracle/s3-client';

await uploadToS3(filePath, buffer, file.type);
```

That's it! Same simple API.

## Option 2: OCI Native REST API

For full control, use Oracle's native REST API. This requires implementing OCI request signing.

### Setup

1. **Get OCI Credentials**:
   - User OCID
   - Tenancy OCID
   - API Key Fingerprint
   - Private Key (PEM file)

2. **Configure Environment**:
```env
OCI_TENANCY_ID=ocid1.tenancy.oc1..xxxxx
OCI_USER_ID=ocid1.user.oc1..xxxxx
OCI_FINGERPRINT=xx:xx:xx:xx:xx:xx:xx:xx
OCI_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...
OCI_REGION=us-ashburn-1
OCI_NAMESPACE=your_namespace
OCI_BUCKET_NAME=warbot-screenshots
```

3. **Use OCI REST API** (see `lib/oracle/rest-api.ts`):

```typescript
import { OracleObjectStorageAPI } from '@/lib/oracle/rest-api';

const storage = new OracleObjectStorageAPI();

// Upload
await storage.putObject('path/to/file.jpg', buffer, 'image/jpeg');

// Get signed URL
const url = await storage.createPreauthenticatedRequest('path/to/file.jpg', 3600);

// Delete
await storage.deleteObject('path/to/file.jpg');
```

### Request Signing

OCI requires request signing. You have two options:

**Option A: Use OCI SDK for signing** (easier):
```typescript
import { common } from 'oci-common';
import { objectstorage } from 'oci-objectstorage';

// SDK handles signing automatically
```

**Option B: Implement signing manually** (more control):
- See: https://docs.oracle.com/en-us/iaas/Content/API/Concepts/signingrequests.htm
- Complex but gives full control

## Option 3: PostgreSQL REST API (Database)

For database queries, you have two options:

### Option A: Direct PostgreSQL Connection (Recommended)

Use the `oracledb` package (already set up):

```typescript
import { executeQuery } from '@/lib/oracle/client';

const results = await executeQuery(
  'SELECT * FROM screenshots WHERE user_id = :userId',
  { userId: uuidToRaw(userId) }
);
```

### Option B: PostgreSQL REST API (ORDS)

If Oracle REST Data Services (ORDS) is enabled:

```typescript
import { OracleDatabaseAPI } from '@/lib/oracle/rest-api';

const db = new OracleDatabaseAPI();

const results = await db.executeQuery(
  'SELECT * FROM screenshots WHERE user_id = :userId',
  { userId: userId }
);
```

**Note**: ORDS must be enabled on your Autonomous Database. Most users prefer direct PostgreSQL connection.

## Complete Integration Example

### Replace Supabase Storage with Oracle S3

**File: `app/(protected)/dashboard/actions.ts`**

```typescript
// Before
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

const supabase = createSupabaseServerComponentClient();
const { error } = await supabase.storage
  .from('screenshots')
  .upload(filePath, buffer);

// After
import { uploadToS3, getS3SignedUrl, deleteFromS3 } from '@/lib/oracle/s3-client';

// Upload
await uploadToS3(filePath, buffer, file.type);

// Get signed URL
const signedUrl = await getS3SignedUrl(filePath, 3600);

// Delete
await deleteFromS3(filePath);
```

### Replace Supabase Database with Oracle

**File: `app/(protected)/dashboard/page.tsx`**

```typescript
// Before
const { data: screenshots } = await supabase
  .from('screenshots')
  .select('*')
  .eq('user_id', session.user.id);

// After
import { executeQuery, rawToUuid } from '@/lib/oracle/client';

const screenshots = await executeQuery(
  `SELECT id, file_path, label, created_at, user_id 
   FROM screenshots 
   WHERE user_id = :userId 
   ORDER BY created_at DESC`,
  { userId: uuidToRaw(session.user.id) }
);

// Convert RAW(16) UUIDs back to strings
const formattedScreenshots = screenshots.map(row => ({
  ...row,
  id: rawToUuid(row.id),
  user_id: rawToUuid(row.user_id),
}));
```

## API Endpoints Reference

### Object Storage (S3-Compatible)

**Base URL**: `https://{namespace}.compat.objectstorage.{region}.oraclecloud.com`

**Endpoints**:
- `PUT /{bucket}/{object}` - Upload object
- `GET /{bucket}/{object}` - Download object
- `DELETE /{bucket}/{object}` - Delete object
- `HEAD /{bucket}/{object}` - Get metadata

### Object Storage (OCI Native)

**Base URL**: `https://objectstorage.{region}.oraclecloud.com`

**Endpoints**:
- `PUT /n/{namespace}/b/{bucket}/o/{object}` - Upload
- `GET /n/{namespace}/b/{bucket}/o/{object}` - Download
- `DELETE /n/{namespace}/b/{bucket}/o/{object}` - Delete
- `POST /n/{namespace}/b/{bucket}/p/` - Create pre-authenticated request

### Database (PostgreSQL REST - ORDS)

**Base URL**: `https://{db-host}/ords/{schema}/api/`

**Endpoints**:
- `POST /query` - Execute SQL query
- `GET /table/{tableName}` - Get table data
- `POST /table/{tableName}` - Insert data

## Authentication Methods

### 1. S3-Compatible (Customer Secret Keys)

```typescript
// Simple - just access key and secret
credentials: {
  accessKeyId: process.env.OCI_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.OCI_S3_SECRET_ACCESS_KEY,
}
```

### 2. OCI Native (API Keys + Request Signing)

```typescript
// Requires request signing
// Use OCI SDK or implement signing manually
```

### 3. Instance Principal (For OCI Compute)

```typescript
// Automatic - no credentials needed
// Works when running on OCI Compute instances
```

## Which API Should You Use?

### Use S3-Compatible API If:
- ✅ You want the simplest integration
- ✅ You're familiar with AWS S3
- ✅ You want well-documented APIs
- ✅ You might switch providers later

### Use OCI Native API If:
- ✅ You need OCI-specific features
- ✅ You want full control
- ✅ You're building OCI-only solutions

### Use Direct PostgreSQL If:
- ✅ You're querying the database (recommended)
- ✅ You need transactions
- ✅ You want best performance

## Quick Start: S3-Compatible API

1. **Install dependencies**:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

2. **Get S3 credentials from Oracle**:
   - Identity → Users → Customer Secret Keys → Generate

3. **Add to `.env.local`**:
```env
OCI_S3_ACCESS_KEY_ID=your_key
OCI_S3_SECRET_ACCESS_KEY=your_secret
OCI_NAMESPACE=your_namespace
OCI_REGION=us-ashburn-1
OCI_BUCKET_NAME=warbot-screenshots
```

4. **Uncomment code in `lib/oracle/s3-client.ts`**

5. **Use it**:
```typescript
import { uploadToS3, getS3SignedUrl } from '@/lib/oracle/s3-client';

// Upload
await uploadToS3('path/to/file.jpg', buffer, 'image/jpeg');

// Get URL
const url = await getS3SignedUrl('path/to/file.jpg', 3600);
```

## Troubleshooting

### "Credentials not configured"
- Check environment variables are set
- Verify credentials in Oracle Console

### "Bucket not found"
- Verify bucket name matches exactly
- Check namespace is correct
- Ensure bucket is in correct compartment

### "Access denied"
- Check IAM policies allow access
- Verify user has Object Storage permissions
- Check bucket visibility settings

### "Signature mismatch" (OCI Native API)
- Verify request signing implementation
- Check timestamp is within 5 minutes
- Ensure private key matches fingerprint

## Resources

- [Oracle S3-Compatible API Docs](https://docs.oracle.com/en-us/iaas/Content/Object/Tasks/s3compatibleapi.htm)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [OCI REST API Reference](https://docs.oracle.com/en-us/iaas/api/)
- [OCI Request Signing](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/signingrequests.htm)

## Summary

**Best Approach**: Use **S3-Compatible API** with AWS SDK
- ✅ Simplest to integrate
- ✅ Well-documented
- ✅ Works with Oracle Object Storage
- ✅ Easy to test and debug

**Files Created**:
- `lib/oracle/s3-client.ts` - S3-compatible client (recommended)
- `lib/oracle/rest-api.ts` - OCI native REST API client
- `ORACLE_REST_API_GUIDE.md` - This guide

**Next Steps**:
1. Install AWS SDK: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
2. Get S3 credentials from Oracle Console
3. Uncomment code in `lib/oracle/s3-client.ts`
4. Start using it!

---

**Ready to plug in!** The S3-compatible API is the easiest way to integrate Oracle Object Storage into your app.

