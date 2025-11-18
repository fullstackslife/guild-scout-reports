# Quick Oracle Configuration

Your wallet is ready! Here's what to do next:

## 1. Update `.env.local`

Add these lines to your `.env.local` file:

```env
# Oracle Database Connection
ORACLE_DB_USER=ADMIN
ORACLE_DB_PASSWORD=your_password_here

# Connection String (use warbot_high for best performance)
ORACLE_DB_CONNECTION_STRING=warbot_high

# Wallet Location (your wallettt folder)
TNS_ADMIN=C:\Users\Brian\OneDrive - Fullstacks.us\Desktop\guild-scout-reports\wallettt
```

## 2. Test the Connection

```bash
npm install
npm run test:oracle
```

This will verify:
- ✅ Wallet is found
- ✅ Connection works
- ✅ Database is accessible
- ✅ UUID generation works

## 3. Available Connection Strings

From your `tnsnames.ora`, you can use:
- `warbot_high` ⭐ - Best performance (recommended)
- `warbot_medium` - Balanced
- `warbot_low` - Lower priority
- `warbot_tp` - Transaction Processing
- `warbot_tpurgent` - Urgent transactions

## 4. Your Database Info

- **Region**: us-ashburn-1
- **Database ID**: G8D31CC513B81A5-WARBOT
- **Port**: 1522 (TLS)
- **Protocol**: tcps (secure)

## Next Steps

1. ✅ Wallet extracted to `wallettt` folder
2. ⏭️ Add credentials to `.env.local`
3. ⏭️ Run `npm run test:oracle`
4. ⏭️ Run database migrations
5. ⏭️ Start using Oracle in your app!

---

**That's it!** Just add your password to `.env.local` and run the test! 🚀

