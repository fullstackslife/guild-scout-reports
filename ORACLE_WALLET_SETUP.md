# Oracle Wallet Setup Guide

You've downloaded the wallet and have your password. Let's get connected!

## Step 1: Extract the Wallet

✅ **You've already extracted the wallet to `wallettt` folder!**

Your wallet is located at:
```
C:\Users\Brian\OneDrive - Fullstacks.us\Desktop\guild-scout-reports\wallettt
```

This contains:
- `tnsnames.ora` - Connection strings ✅
- `sqlnet.ora` - Network configuration ✅
- `cwallet.sso` - Encrypted wallet ✅
- Other security files ✅

**No need to extract again!** Just configure the path below.

## Step 2: Verify Wallet Files

After extraction, you should have these files in your wallet directory:

```
~/.oracle/wallet/
├── tnsnames.ora          # Connection strings
├── sqlnet.ora            # Network configuration
├── cwallet.sso           # Encrypted wallet
├── ewallet.p12           # PKCS#12 wallet (if password-protected)
└── keystore.jks          # Java keystore (if needed)
```

## Step 3: Get Connection String

1. **Open `tnsnames.ora`** in a text editor
2. Look for a section like this:

```
warbot_high = (description=...)
warbot_medium = (description=...)
warbot_low = (description=...)
```

3. **Copy the connection string** from one of these (usually `warbot_high` for best performance)

The connection string format will be:
```
(description=(address=(protocol=tcps)(port=1522)(host=your-hostname.adb.region.oraclecloud.com))(connect_data=(service_name=your-service-name.adb.oraclecloud.com))(security=(ssl_server_cert_dn="CN=adwc.uscom-east-1.oraclecloud.com")))
```

Or you can use the **simpler format** from the Oracle Console:
- Go to your database → **Database Connection** tab
- Look for **Connection String** (format: `hostname:port/service_name`)

## Step 4: Set Environment Variables

Add to your `.env.local` file:

```env
# Oracle Database Connection
ORACLE_DB_USER=ADMIN
ORACLE_DB_PASSWORD=your_password_here

# Use TNS connection string (from tnsnames.ora)
# Available options: warbot_high, warbot_medium, warbot_low, warbot_tp, warbot_tpurgent
ORACLE_DB_CONNECTION_STRING=warbot_high

# Wallet location (points to your wallettt folder)
TNS_ADMIN=C:\Users\Brian\OneDrive - Fullstacks.us\Desktop\guild-scout-reports\wallettt

# Alternative: Use relative path (if running from project root)
# TNS_ADMIN=./wallettt
```

**Available Connection Strings** (from your `tnsnames.ora`):
- `warbot_high` - Best performance, highest priority ⭐ (Recommended)
- `warbot_medium` - Balanced performance
- `warbot_low` - Lower priority, good for batch jobs
- `warbot_tp` - Transaction Processing
- `warbot_tpurgent` - Urgent transactions

## Step 5: Test the Connection

Create a test file `test-oracle-connection.ts`:

```typescript
import { initOraclePool, executeQuery } from './lib/oracle/client';

async function testConnection() {
  try {
    console.log('Initializing Oracle connection pool...');
    await initOraclePool();
    
    console.log('Testing database connection...');
    const result = await executeQuery('SELECT SYSDATE FROM DUAL');
    
    console.log('✅ Connection successful!');
    console.log('Current database time:', result[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  }
}

testConnection();
```

Run the test:

```bash
# Install tsx if you don't have it
npm install -g tsx

# Run the test
npx tsx test-oracle-connection.ts
```

## Step 6: Common Issues & Solutions

### Issue: "TNS: could not resolve the connect identifier"

**Solution**: Set `TNS_ADMIN` environment variable:
```env
TNS_ADMIN=C:\Users\Brian\.oracle\wallet
```

### Issue: "ORA-12541: TNS:no listener"

**Solution**: 
- Check connection string format
- Verify network access is "Secure access from everywhere"
- Try using direct connection string instead of TNS name

### Issue: "ORA-01017: invalid username/password"

**Solution**:
- Verify username is exactly `ADMIN` (uppercase)
- Check password is correct (no extra spaces)
- Try resetting password in Oracle Console if needed

### Issue: "ORA-12560: TNS:protocol adapter error"

**Solution**:
- Ensure wallet files are in correct location
- Check `TNS_ADMIN` path is correct
- Verify wallet files are not corrupted

## Step 7: Connection String Formats

### Format 1: TNS Name (from tnsnames.ora)
```env
ORACLE_DB_CONNECTION_STRING=warbot_high
TNS_ADMIN=C:\Users\Brian\.oracle\wallet
```

### Format 2: Direct Connection String
```env
ORACLE_DB_CONNECTION_STRING=your-hostname.adb.us-ashburn-1.oraclecloud.com:1522/your-service-name.adb.oraclecloud.com
# TNS_ADMIN not needed for direct connection
```

### Format 3: Easy Connect (Simplest)
```env
ORACLE_DB_CONNECTION_STRING=your-hostname.adb.us-ashburn-1.oraclecloud.com:1522/your-service-name.adb.oraclecloud.com?wallet_location=C:\Users\Brian\.oracle\wallet
```

## Step 8: Update Your Code

Once connected, you can use the Oracle client:

```typescript
import { executeQuery, executeQueryOne } from '@/lib/oracle/client';

// Query example
const screenshots = await executeQuery(
  'SELECT * FROM screenshots WHERE user_id = :userId',
  { userId: uuidToRaw(userId) }
);

// Single row example
const profile = await executeQueryOne(
  'SELECT * FROM profiles WHERE id = :id',
  { id: uuidToRaw(userId) }
);
```

## Next Steps

1. ✅ Wallet extracted
2. ✅ Environment variables set
3. ✅ Connection tested
4. ⏭️ Run database migrations (see `oracle/migrations/0001_init_oracle.sql`)
5. ⏭️ Start using Oracle in your app!

## Quick Reference

**Wallet Location**: `C:\Users\Brian\.oracle\wallet` (Windows) or `~/.oracle/wallet` (Mac/Linux)

**Connection String**: Check `tnsnames.ora` or Oracle Console

**Username**: `ADMIN` (always uppercase)

**Password**: The one you set during database creation

**Port**: Usually `1522` (for TLS) or `1521` (non-TLS)

---

**Ready to test?** Run the connection test script above to verify everything works! 🚀

