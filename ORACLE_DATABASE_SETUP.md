# Oracle Autonomous Database Setup Guide

Step-by-step guide for creating your Always Free Autonomous Database.

## ⚠️ Important: Always Free Configuration

When selecting **Always Free**, the database has **fixed limits**:
- ✅ **1 OCPU** (not 2, not ECPU)
- ✅ **20 GB storage** (not 1 TB)
- ✅ **No auto-scaling** (not available in free tier)
- ✅ **60 days backup retention** (included)

If the form shows different values, the UI might not have updated. Try:
1. Uncheck "Always Free"
2. Refresh the page
3. Check "Always Free" again

## Step-by-Step Configuration

### 1. Basic Information

- **Display name**: `warbot-db`
- **Database name**: `warbot`
- **Compartment**: `salvatorebrian1` (or your compartment)

### 2. Workload Type

**Select: Transaction Processing** ✅

**Why?**
- ✅ Built for transactional workloads (your app's use case)
- ✅ High concurrency for short-running queries
- ✅ Perfect for web applications
- ✅ Supports PostgreSQL-compatible mode

**NOT:**
- ❌ Lakehouse - For analytics/AI (not your use case)
- ❌ JSON - For document databases (you're using relational)
- ❌ APEX - For low-code apps (you're using Next.js)

### 3. Database Configuration

**Select: Always Free** ✅

**Expected Values** (after selecting Always Free):
- **ECPU count**: Should show **1** (not 2)
- **Storage**: Should show **20 GB** (not 1 TB)
- **Compute auto scaling**: Should be **disabled/grayed out**
- **Storage auto scaling**: Should be **disabled/grayed out**

**If you see different values:**
1. The form might not have updated
2. Try unchecking "Always Free"
3. Refresh the page
4. Check "Always Free" again
5. Verify values reset to 1 OCPU and 20 GB

### 4. Database Version

- **Choose database version**: `19c` ✅ (default, recommended)

### 5. Advanced Options

- **Automatic backup retention**: `60 days` ✅ (default, included in free tier)
- **Immutable backup retention**: Leave unchecked (optional, for production)

### 6. Administrator Credentials

- **Username**: `ADMIN` (fixed, cannot change)
- **Password**: Set a **strong password** (save this!)
  - Minimum 12 characters
  - Mix of uppercase, lowercase, numbers, special characters
- **Confirm password**: Re-enter the same password

> 💡 **Save your password!** You'll need it to connect to the database.

### 7. Network Access

**Select: Secure access from everywhere** ✅

**Why?**
- ✅ Allows connection from anywhere (your Next.js app, local dev)
- ✅ Perfect for development and testing
- ✅ No VCN configuration needed

**Alternative options** (for production):
- **Secure access from allowed IPs and VCNs only** - More secure, requires IP whitelist
- **Private endpoint access only** - Most secure, requires VCN setup

**Require mutual TLS (mTLS) authentication**: 
- ✅ **Recommended**: Check this for extra security
- Works with the wallet file you'll download

### 8. Contacts (Optional)

- **Contact email**: Add your email to receive notifications
- Useful for maintenance alerts and announcements

### 9. Create Database

Click **Create Autonomous Database**

**What happens next:**
1. Database provisioning starts (2-5 minutes)
2. You'll see "Provisioning" status
3. Wait for status to change to "Available"
4. You'll receive an email when ready

## After Creation

### 1. Get Connection Details

1. Click on your database (`warbot-db`)
2. Go to **Database Connection** tab
3. Click **Download Wallet** (for TLS/mTLS connection)
4. Save the wallet ZIP file securely
5. Note the **Connection String** format: `hostname:port/service_name`

### 2. Extract Wallet (Optional but Recommended)

```bash
# Extract wallet to secure location
mkdir -p ~/.oracle/wallet
unzip Wallet_warbot.zip -d ~/.oracle/wallet

# Set environment variable
export TNS_ADMIN=~/.oracle/wallet
```

### 3. Set Environment Variables

Add to your `.env.local`:

```env
# Oracle Database Connection
ORACLE_DB_USER=ADMIN
ORACLE_DB_PASSWORD=your_password_here
ORACLE_DB_CONNECTION_STRING=your_hostname:1521/your_service_name

# Optional: Wallet path for mTLS
TNS_ADMIN=~/.oracle/wallet
```

## Troubleshooting

### Form Shows Wrong Values

**Problem**: Form shows 2 ECPU or 1 TB when "Always Free" is selected.

**Solution**:
1. Uncheck "Always Free"
2. Refresh the page (F5)
3. Check "Always Free" again
4. Verify values are now 1 OCPU and 20 GB
5. If still wrong, try a different browser or clear cache

### Can't Select Always Free

**Problem**: "Always Free" option is grayed out or not available.

**Possible causes**:
- You're in a region that doesn't support Always Free
- You've already created 2 Always Free databases (limit is 2)
- Your account doesn't qualify for Always Free

**Solution**:
- Check you're in a supported region (US East, US West, EU, etc.)
- Verify you haven't exceeded the 2 database limit
- Contact Oracle support if issue persists

### Connection Issues After Creation

**Problem**: Can't connect to database.

**Solutions**:
1. **Check network access**: Ensure "Secure access from everywhere" is selected
2. **Verify credentials**: Double-check username (ADMIN) and password
3. **Check connection string**: Format should be `hostname:port/service_name`
4. **Test connection**: Use SQL Developer or `sqlplus` to test
5. **Check firewall**: Ensure port 1521 is not blocked

## Verification Checklist

Before proceeding, verify:

- [ ] Workload type is **Transaction Processing**
- [ ] **Always Free** is checked
- [ ] ECPU count shows **1** (not 2)
- [ ] Storage shows **20 GB** (not 1 TB)
- [ ] Auto-scaling options are disabled
- [ ] Strong password is set and saved
- [ ] Network access is "Secure access from everywhere"
- [ ] mTLS is enabled (recommended)
- [ ] Contact email is added (optional but recommended)

## Next Steps

After database is created:

1. ✅ Download wallet file
2. ✅ Save connection details
3. ✅ Update `.env.local` with credentials
4. ✅ Test connection (see `ORACLE_QUICK_START.md`)
5. ✅ Run database migrations (see `oracle/migrations/0001_init_oracle.sql`)

## Resources

- [Oracle Autonomous Database Documentation](https://docs.oracle.com/en/cloud/paas/autonomous-database/)
- [Always Free Tier Details](https://www.oracle.com/cloud/free/)
- [Connection Guide](https://docs.oracle.com/en/cloud/paas/autonomous-database/adbsa/connect-preparing.html)

---

**Ready to create?** Follow the steps above and you'll have your free 20GB database in minutes! 🚀

