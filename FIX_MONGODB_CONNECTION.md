# Fix MongoDB Connection Error

## ❌ Current Error

```
MongoDB connection FAILED: bad auth : Authentication failed.
```

This means your MongoDB Atlas credentials are incorrect or expired.

---

## ✅ Solution: Update MongoDB Connection String

### Step 1: Go to MongoDB Atlas

1. Open browser and go to: https://cloud.mongodb.com
2. Login with your account
3. Click on your cluster (cargarage)

### Step 2: Get New Connection String

1. Click "Connect" button
2. Choose "Connect your application"
3. Select "Node.js" driver
4. Copy the connection string

It will look like:
```
mongodb+srv://<username>:<password>@cargarage.n8s1gbz.mongodb.net/?retryWrites=true&w=majority
```

### Step 3: Update .env File

Open `backend/.env` and update the `MONGO_URI`:

```env
MONGO_URI=mongodb+srv://mitiku12:YOUR_NEW_PASSWORD@cargarage.n8s1gbz.mongodb.net/smartgaraging?retryWrites=true&w=majority
```

**Important**: 
- Replace `YOUR_NEW_PASSWORD` with your actual password
- Keep `/smartgaraging` at the end (database name)
- Keep `?retryWrites=true&w=majority` at the end

### Step 4: Check Database User

In MongoDB Atlas:
1. Go to "Database Access" (left sidebar)
2. Make sure user `mitiku12` exists
3. Check the password is correct
4. Make sure user has "Read and write to any database" permission

### Step 5: Check Network Access

In MongoDB Atlas:
1. Go to "Network Access" (left sidebar)
2. Make sure your IP is whitelisted
3. Or add `0.0.0.0/0` to allow all IPs (for development only!)

### Step 6: Restart Backend

After updating .env:
```powershell
# Stop backend (Ctrl+C)
# Start again
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
```

---

## Alternative: Create New Database User

If password is lost, create a new user:

### In MongoDB Atlas:

1. Go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `mitiku12` (or new name)
5. Password: Click "Autogenerate Secure Password" or create your own
6. **COPY THE PASSWORD!**
7. Built-in Role: "Atlas admin" or "Read and write to any database"
8. Click "Add User"

### Update .env:

```env
MONGO_URI=mongodb+srv://mitiku12:NEW_PASSWORD_HERE@cargarage.n8s1gbz.mongodb.net/smartgaraging?retryWrites=true&w=majority
```

---

## Quick Test

After fixing, test the connection:

```powershell
# In backend folder
node -e "const mongoose = require('mongoose'); mongoose.connect('YOUR_MONGO_URI').then(() => console.log('✅ Connected!')).catch(err => console.log('❌ Error:', err.message))"
```

---

## Common Issues

### Issue 1: Special Characters in Password

If your password has special characters like `@`, `#`, `$`, etc., they need to be URL-encoded:

```
@ → %40
# → %23
$ → %24
% → %25
```

Example:
```
Password: Pass@123#
Encoded: Pass%40123%23
```

### Issue 2: Wrong Database Name

Make sure the connection string ends with `/smartgaraging`:

```
mongodb+srv://user:pass@cluster.mongodb.net/smartgaraging?retryWrites=true&w=majority
                                                    ↑↑↑↑↑↑↑↑↑↑↑↑↑
                                                    Database name
```

### Issue 3: IP Not Whitelisted

Error: "IP address not whitelisted"

Solution:
1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

---

## Current Connection String

Your current connection in `.env`:
```
MONGO_URI=mongodb+srv://mitiku12:oOZQ6mxixzaqi2IL@cargarage.n8s1gbz.mongodb.net/smartgaraging?retryWrites=true&w=majority
```

**Username**: mitiku12
**Password**: oOZQ6mxixzaqi2IL
**Cluster**: cargarage.n8s1gbz.mongodb.net
**Database**: smartgaraging

If this password is wrong, you need to:
1. Reset the password in MongoDB Atlas
2. Update the .env file
3. Restart the backend

---

## After Fixing

Once MongoDB connects successfully, you'll see:

```
✅ MongoDB connected successfully
```

Then you can:
- ✅ Login to the system
- ✅ Register garages
- ✅ Create bookings
- ✅ Make payments
- ✅ Everything will work!

---

## Need Help?

If still not working:
1. Check MongoDB Atlas status: https://status.mongodb.com
2. Try creating a completely new cluster
3. Use a local MongoDB instead (for development)
