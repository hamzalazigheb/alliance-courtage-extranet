# 🧪 Test Partners Management

## ✅ Testing Instructions

### Step 1: View Existing Partners
1. Open browser: **http://localhost:5173/#partenaires**
2. You should see:
   - Existing partners from database
   - Default partners (ABEILLE VIE, AG2R, CARDIF, etc.)
   - Filter buttons (Tous, COA, CIF)

### Step 2: Add New Partner via Manage Page
1. Navigate to: **http://localhost:5173/#manage**
2. Enter password: **secure2024**
3. Click on **"🤝 Partenaires"** tab
4. Click **"Nouveau Partenaire"** button
5. Fill in the form:
   - **Nom:** Test Partner
   - **Catégorie:** COA or CIF
   - **Description:** Test description
   - **Website:** https://example.com
   - **Email:** test@example.com
   - **Phone:** +33 1 23 45 67 89
   - **Logo:** Upload an image (optional)
6. Click **"Créer le Partenaire"**

### Step 3: Verify Partner Appears
1. Go back to: **http://localhost:5173/#partenaires**
2. Your new partner should now appear in the list
3. It should show:
   - Your partner name
   - Your uploaded logo (if provided)
   - Website link
   - Description

### Step 4: Test Filtering
1. Click **"Partenaires COA"** button
   - Only COA partners should appear
2. Click **"Partenaires CIF"** button
   - Only CIF partners should appear
3. Click **"Tous les partenaires"** button
   - All partners should appear

## 🐛 Troubleshooting

### Partners Not Showing
- Check browser console for errors (F12)
- Verify backend is running: `http://localhost:3001/api/partners`
- Check database connection

### Cannot Add Partner
- Ensure you're logged in as admin
- Check password: **secure2024**
- Verify file upload permissions

### Logos Not Displaying
- Check network tab for 404 errors on logo images
- Verify logos are uploaded to `/uploads/partners-logos/`
- Check CORS settings

## ✅ Expected Results

- ✅ Partners from database are displayed
- ✅ Default fallback partners are displayed
- ✅ New partners can be added via manage page
- ✅ Partners appear immediately after adding
- ✅ Filtering works correctly
- ✅ Logos display properly
- ✅ Database stores all partner information

## 📊 Current Status

**Backend API:** ✅ Running on port 3001
**Frontend:** ✅ Running on port 5173
**Database:** ✅ Connected to MySQL
**Partners Storage:** ✅ Working



