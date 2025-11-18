# Oracle Cloud Quick Start Guide

This guide helps you quickly get started with Oracle Cloud integration for your Warbot.app.

## Prerequisites

1. **Oracle Cloud Account (FREE!)**
   - Sign up at: https://www.oracle.com/cloud/free/
   - **Always Free Tier** includes:
     - 2 databases (20GB each = 40GB total)
     - 10GB Object Storage
     - 10TB/month bandwidth
     - Never expires!
   - Verify your email and complete account setup
   - Credit card required but won't be charged (unless you exceed free tier)

2. **Node.js 18+** (already installed)

> 💡 **Free Tier Benefits**: You get **20x more database storage** and **10x more file storage** than Supabase's free tier, all for $0/month! See **ORACLE_FREE_TIER_GUIDE.md** for full comparison.

## Step 1: Install Dependencies

```bash
npm install
```

This will install:
- `oracledb` - Oracle Database driver
- `oci-objectstorage` - OCI Object Storage SDK
- `oci-common` - OCI common utilities

## Step 2: Set Up Oracle Autonomous Database

### 2.1 Create Database

1. Log in to [Oracle Cloud Console](https://cloud.oracle.com)
2. Navigate to: **Autonomous Database** → **Create Autonomous Database**
3. Configure:
   - **Compartment**: Select or create one (e.g., `salvatorebrian1`)
   - **Display Name**: `warbot-db`
   - **Database Name**: `warbot`
   - **Workload Type**: **Transaction Processing** ⚠️ (NOT Lakehouse - that's for analytics)
   - **Database Configuration**: Select **Always Free** ✅
     - ⚠️ **Important**: When "Always Free" is selected, the form should show:
       - **1 OCPU** (not 2 ECPU)
       - **20 GB storage** (not 1 TB)
       - If you see 2 ECPU or 1 TB, the form might not have updated - refresh or uncheck/recheck "Always Free"
   - **Database Version**: `19c` (default is fine)
   - **ECPU count**: Should auto-set to **1** when Always Free is selected
   - **Storage**: Should auto-set to **20 GB** when Always Free is selected
   - **Compute auto scaling**: Disabled for Always Free (not available)
   - **Storage auto scaling**: Disabled for Always Free (not available)
   - **Automatic backup retention**: 60 days (default, included in free tier)
   - **Admin Password**: Set a strong password (save this!)
   - **Network Access**: **Secure access from everywhere** ✅ (for development)
   - **Require mutual TLS (mTLS)**: Optional (can enable for extra security)

4. Click **Create Autonomous Database**

> ⚠️ **IMPORTANT**: If the form shows 2 ECPU or 1 TB storage when "Always Free" is checked, there's a UI issue. Always Free should show:
> - **1 OCPU** (not ECPU)
> - **20 GB** storage (not TB)
> - Try unchecking and rechecking "Always Free" or refresh the page
>
> 💡 **Free Tier**: "Always Free" gives you 20GB database storage for free, forever. That's 20x more than Supabase's 500MB!

### 2.2 Get Connection Details

1. Wait for database to be created (2-3 minutes)
2. Click on your database
3. Go to **Database Connection** tab
4. Click **Download Wallet** (for TLS connection)
5. Extract the wallet ZIP file
6. Note the **Connection String** format: `hostname:port/service_name`

### 2.3 Set Up Wallet (Optional but Recommended)

For production, use the wallet for secure connections:

```bash
# Extract wallet to a secure location
mkdir -p ~/.oracle/wallet
unzip Wallet_warbot.zip -d ~/.oracle/wallet

# Set TNS_ADMIN environment variable
export TNS_ADMIN=~/.oracle/wallet
```

## Step 3: Set Up OCI Object Storage

### 3.1 Create Bucket

1. Navigate to: **Object Storage** → **Buckets**
2. Click **Create Bucket**
3. Configure:
   - **Name**: `warbot-screenshots`
   - **Storage Tier**: **Standard**
   - **Encryption**: **Encrypt using Oracle-managed keys**
   - **Visibility**: **Private**

4. Click **Create**

> 💡 **Free Tier**: You get 10GB of Object Storage free forever. That's 10x more than Supabase's 1GB free tier!

### 3.2 Get Namespace

1. In Object Storage, note your **Namespace** (shown at top of page)
2. Save this value

### 3.3 Create IAM User and API Keys

1. Navigate to: **Identity** → **Users**
2. Click **Create User**
3. Configure:
   - **Name**: `warbot-storage-user`
   - **Description**: User for Object Storage API access

4. Click **Create**

5. **Generate API Key**:
   - Click on the user
   - Go to **API Keys** section
   - Click **Add API Key**
   - Select **Paste Public Key** or **Generate API Key Pair**
   - If generating, download the private key (`.pem` file)
   - Copy the **Fingerprint** and **Key OCID**

6. **Create Policy**:
   - Navigate to: **Identity** → **Policies**
   - Click **Create Policy**
   - **Name**: `warbot-storage-policy`
   - **Description**: Allow storage access
   - **Policy Statements**:
     ```
     Allow group ObjectStorageUsers to manage objects in compartment <your-compartment-name> where target.bucket.name='warbot-screenshots'
     Allow group ObjectStorageUsers to read buckets in compartment <your-compartment-name>
     ```
   - Replace `<your-compartment-name>` with your actual compartment name

7. **Add User to Group**:
   - Navigate to: **Identity** → **Groups**
   - Find or create `ObjectStorageUsers` group
   - Add your user to this group

## Step 4: Configure OCI CLI (Recommended)

### 4.1 Install OCI CLI

```bash
# macOS
brew install oci-cli

# Linux
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"

# Windows
# Download from: https://github.com/oracle/oci-cli/releases
```

### 4.2 Configure OCI CLI

```bash
oci setup config
```

You'll need:
- **User OCID**: From your user details page
- **Tenancy OCID**: From your tenancy details
- **Region**: e.g., `us-ashburn-1`
- **Fingerprint**: From your API key
- **Private Key Path**: Path to your `.pem` file

This creates `~/.oci/config` file.

## Step 5: Set Environment Variables

Create or update `.env.local`:

```env
# Oracle Database
ORACLE_DB_USER=admin
ORACLE_DB_PASSWORD=your_database_password
ORACLE_DB_CONNECTION_STRING=your_hostname:1521/your_service_name

# OCI Object Storage
OCI_CONFIG_FILE=~/.oci/config
OCI_PROFILE=DEFAULT
OCI_NAMESPACE=your_namespace
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..xxxxx
OCI_BUCKET_NAME=warbot-screenshots

# Alternative: Use environment variables instead of config file
# OCI_TENANCY_ID=ocid1.tenancy.oc1..xxxxx
# OCI_USER_ID=ocid1.user.oc1..xxxxx
# OCI_FINGERPRINT=xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx
# OCI_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...
# OCI_REGION=us-ashburn-1

# Keep Supabase for auth (optional - can migrate later)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic API (unchanged)
ANTHROPIC_API_KEY=your_anthropic_key
```

### Getting Your Values

- **ORACLE_DB_CONNECTION_STRING**: From Database Connection tab
- **OCI_NAMESPACE**: From Object Storage page (top of page)
- **OCI_COMPARTMENT_ID**: From your compartment details page (OCID)
- **OCI_TENANCY_ID**: From your tenancy details page (OCID)
- **OCI_USER_ID**: From your user details page (OCID)
- **OCI_FINGERPRINT**: From your API key details

## Step 6: Create Database Schema

Run the Oracle migration script:

```bash
# Create migration directory
mkdir -p oracle/migrations

# Copy the migration file from ORACLE_CLOUD_UPGRADE.md
# Or use the SQL Editor in Oracle Cloud Console
```

Then execute the SQL in Oracle Cloud Console:
1. Go to your Autonomous Database
2. Click **Database Actions** → **SQL**
3. Paste and run the migration SQL

## Step 7: Test the Setup

### 7.1 Test Database Connection

Create a test file `test-oracle-db.ts`:

```typescript
import { initOraclePool, executeQuery } from './lib/oracle/client';

async function test() {
  try {
    await initOraclePool();
    const result = await executeQuery('SELECT SYSDATE FROM DUAL');
    console.log('Database connection successful!', result);
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

test();
```

Run: `npx tsx test-oracle-db.ts`

### 7.2 Test Object Storage

Create a test file `test-oracle-storage.ts`:

```typescript
import { uploadToObjectStorage, getObjectStorageUrl } from './lib/oracle/storage';

async function test() {
  try {
    const testContent = Buffer.from('Hello, Oracle Cloud!');
    const objectName = 'test/test.txt';
    
    await uploadToObjectStorage(objectName, testContent, 'text/plain');
    console.log('Upload successful!');
    
    const url = await getObjectStorageUrl(objectName, 3600);
    console.log('Signed URL:', url);
    
    process.exit(0);
  } catch (error) {
    console.error('Storage test failed:', error);
    process.exit(1);
  }
}

test();
```

Run: `npx tsx test-oracle-storage.ts`

## Step 8: Update Your Code

### 8.1 Update Storage Upload Code

Replace Supabase storage calls with OCI storage:

**Before (Supabase):**
```typescript
const { error } = await supabase.storage
  .from('screenshots')
  .upload(filePath, buffer);
```

**After (OCI):**
```typescript
import { uploadToObjectStorage } from '@/lib/oracle/storage';

await uploadToObjectStorage(filePath, buffer, file.type);
```

### 8.2 Update Database Queries

Replace Supabase queries with Oracle queries:

**Before (Supabase):**
```typescript
const { data } = await supabase
  .from('screenshots')
  .select('*')
  .eq('user_id', userId);
```

**After (Oracle):**
```typescript
import { executeQuery } from '@/lib/oracle/client';

const data = await executeQuery(
  'SELECT * FROM screenshots WHERE user_id = :userId',
  { userId: uuidToRaw(userId) }
);
```

## Step 9: Migration Strategy

### Option A: Gradual Migration (Recommended)

1. **Keep Supabase running** during migration
2. **Migrate storage first** (easiest, least risk)
3. **Test thoroughly** with new storage
4. **Migrate database** next
5. **Keep Supabase Auth** (or migrate later)

### Option B: Full Migration

1. **Set up Oracle infrastructure** (database + storage)
2. **Migrate all data** from Supabase
3. **Update all code** to use Oracle
4. **Test end-to-end**
5. **Switch over** when ready

## Troubleshooting

### Database Connection Issues

- **Error: "ORA-12154: TNS:could not resolve the connect identifier"**
  - Check `ORACLE_DB_CONNECTION_STRING` format
  - Ensure wallet is configured if using TLS

- **Error: "ORA-01017: invalid username/password"**
  - Verify `ORACLE_DB_USER` and `ORACLE_DB_PASSWORD`
  - Check if password has special characters (may need escaping)

### Storage Issues

- **Error: "Authentication failed"**
  - Verify OCI config file or environment variables
  - Check API key fingerprint matches
  - Ensure user has proper IAM policies

- **Error: "Bucket not found"**
  - Verify `OCI_BUCKET_NAME` matches actual bucket name
  - Check `OCI_NAMESPACE` is correct
  - Ensure bucket is in the correct compartment

### General Issues

- **"Module not found" errors**
  - Run `npm install` again
  - Check Node.js version (18+ required)

- **TypeScript errors**
  - Install types: `npm install --save-dev @types/node`
  - Check `tsconfig.json` includes Oracle lib files

## Next Steps

1. ✅ Complete setup steps above
2. ✅ Test database and storage connections
3. ✅ Update one feature at a time (start with file uploads)
4. ✅ Test thoroughly before migrating more features
5. ✅ Monitor costs and usage in Oracle Cloud Console
6. ✅ Document any custom configurations

## Resources

- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Autonomous Database Docs](https://docs.oracle.com/en/cloud/paas/autonomous-database/)
- [OCI Object Storage Docs](https://docs.oracle.com/en-us/iaas/Content/Object/Concepts/objectstorageoverview.htm)
- [OCI SDK for Node.js](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/javasdk.htm)
- [OCI CLI Documentation](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/cliconcepts.htm)

## Support

- Oracle Cloud Support (if on paid tier)
- [Oracle Community Forums](https://community.oracle.com/)
- [Stack Overflow - oracle-cloud-infrastructure tag](https://stackoverflow.com/questions/tagged/oracle-cloud-infrastructure)

