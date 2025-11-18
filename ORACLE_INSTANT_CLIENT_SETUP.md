# Oracle Instant Client Setup for Windows

The `oracledb` npm package requires Oracle Instant Client libraries to be installed on your system.

## ✅ Oracle Instant Client Found!

You have Oracle Instant Client installed at:
```
C:\oracle\instantclient_23_8
```

The code will automatically detect and use this path. No additional configuration needed!

### Optional: Set Environment Variable

If you want to explicitly specify the path, add to `.env.local`:

```env
ORACLE_CLIENT_LIB_DIR=C:\oracle\instantclient_23_8
```

But this is **optional** - the code will auto-detect it.

### Alternative: Add to PATH (Optional)

You can also add it to your system PATH:

1. Open **System Properties** → **Environment Variables**
2. Edit **Path** variable
3. Add: `C:\oracle\instantclient_23_8`
4. Click **OK** to save
5. Restart your terminal/PowerShell

But again, this is **optional** - the code will find it automatically.

### Option 2: Use Thick Mode (Alternative)

If you don't want to install Instant Client globally, you can use "thick mode" which bundles the client, but it's more complex.

## Alternative: Use REST API Instead

**Actually, there's a better option!** You don't need Oracle Instant Client if you use:

1. **S3-Compatible API** for Object Storage (already set up)
2. **REST API** for database queries (via ORDS if enabled)
3. **Or use a different approach** that doesn't require native libraries

## Recommended: Use REST API or Direct HTTP

Since you're using Oracle Autonomous Database, you can:

1. **Use REST API** (if ORDS is enabled)
2. **Use a connection pool service** (like a separate Node.js service)
3. **Use Oracle's REST Data Services** for queries

## Quick Fix: Install Instant Client

**Fastest way**:

1. Download: https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html
2. Extract to `C:\oracle\instantclient_21_13`
3. Add to PATH: `C:\oracle\instantclient_21_13`
4. Restart terminal
5. Run `npm run test:oracle` again

## Verify Installation

After installing, test:

```powershell
npm run test:oracle
```

You should see:
- ✅ Environment variables loaded
- ✅ Oracle client initialized
- ✅ Connection successful

## Troubleshooting

### "Cannot locate a 64-bit Oracle Client library"

- ✅ Make sure you downloaded **64-bit** version
- ✅ Check PATH includes the instantclient directory
- ✅ Restart terminal after adding to PATH
- ✅ Verify the directory contains `oci.dll`

### "The specified module could not be found"

- Install **Microsoft Visual C++ Redistributable**:
  - Download: https://aka.ms/vs/17/release/vc_redist.x64.exe
  - Install and restart

### Still not working?

Try specifying the path directly in code (see `lib/oracle/client.ts`):

```typescript
oracledb.initOracleClient({ 
  libDir: 'C:\\oracle\\instantclient_21_13'
});
```

---

**Next Steps**: Install Instant Client, then run `npm run test:oracle` again! 🚀

