# Create .env.local File

You need to create a `.env.local` file with your Oracle database credentials.

## Quick Steps

1. **Create `.env.local` file** in the project root (same folder as `package.json`)

2. **Add these lines** (replace `your_password_here` with your actual password):

```env
# Oracle Database Connection
ORACLE_DB_USER=ADMIN
ORACLE_DB_PASSWORD=your_password_here

# Connection String (use warbot_high for best performance)
ORACLE_DB_CONNECTION_STRING=warbot_high

# Wallet Location (your wallettt folder)
TNS_ADMIN=C:\Users\Brian\OneDrive - Fullstacks.us\Desktop\guild-scout-reports\wallettt
```

3. **Save the file**

4. **Run the test again**:
```bash
npm install
npm run test:oracle
```

## Windows PowerShell - Quick Create

Run this command (replace `your_password_here`):

```powershell
@"
# Oracle Database Connection
ORACLE_DB_USER=ADMIN
ORACLE_DB_PASSWORD=your_password_here

# Connection String
ORACLE_DB_CONNECTION_STRING=warbot_high

# Wallet Location
TNS_ADMIN=C:\Users\Brian\OneDrive - Fullstacks.us\Desktop\guild-scout-reports\wallettt
"@ | Out-File -FilePath .env.local -Encoding utf8
```

## Important Notes

- ⚠️ **Never commit `.env.local` to git** (it should be in `.gitignore`)
- ✅ The file is already in `.gitignore` so it won't be committed
- 🔒 Keep your password secure
- 📝 You can add other environment variables to this file too (Supabase, Anthropic API, etc.)

## After Creating .env.local

Run:
```bash
npm install  # Install dotenv if needed
npm run test:oracle
```

This will test your Oracle database connection!

