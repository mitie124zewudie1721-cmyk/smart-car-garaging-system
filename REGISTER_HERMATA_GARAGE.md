# Register CarGarage Hermata

## Garage Information

### Basic Information
- **Garage Name**: CarGarage Hermata
- **Location**: Hermata, Jimma, Ethiopia
- **Phone**: +251 911 234567
- **Email**: hermata.garage@example.com

### Address Details
- **City**: Jimma
- **Zone**: Jimma Zone
- **Region**: Oromia
- **Specific Location**: Near Hermata Market, Main Road to Agaro
- **Coordinates**: 
  - Latitude: 7.6769
  - Longitude: 36.8344

### Services Offered
- ✅ Car Wash
- ✅ Oil Change
- ✅ Tire Service
- ✅ Brake Service
- ✅ Engine Diagnostics
- ✅ General Maintenance
- ✅ Body Work
- ✅ Painting

### Pricing (ETB)
- Car Wash: 300 ETB
- Oil Change: 800 ETB
- Tire Service: 500 ETB
- Brake Service: 1,200 ETB
- Engine Diagnostics: 1,500 ETB
- General Maintenance: 1,000 ETB
- Body Work: Starting from 3,000 ETB
- Painting: Starting from 5,000 ETB


### Operating Hours
- **Monday - Friday**: 8:00 AM - 6:00 PM
- **Saturday**: 8:00 AM - 5:00 PM
- **Sunday**: 9:00 AM - 2:00 PM

### Capacity
- **Total Slots**: 8 vehicles
- **Simultaneous Service**: 4 vehicles

### Payment Methods Accepted
- ✅ Cash
- ✅ Telebirr
- ✅ CBE Birr
- ✅ Abysinia Bank Transfer

### Bank Account Information
**Commercial Bank of Ethiopia (CBE)**
- Account Number: 1000123456789
- Account Name: CarGarage Hermata PLC
- Branch: Bole Branch

**Abysinia Bank**
- Account Number: 2000987654321
- Account Name: CarGarage Hermata PLC
- Branch: Hermata Branch

---

## Registration Steps

### Step 1: Create Garage Owner Account

1. Go to registration page
2. Select "Garage Owner" role
3. Fill in details:

```
Username: hermata_garage
Password: HermataGarage2024!
Name: Hermata Garage Manager
Email: hermata.garage@example.com
Phone: +251911234567
```

### Step 2: Register Garage

After logging in, go to "Add Garage" and fill:

**Basic Information:**
```
Garage Name: CarGarage Hermata
Description: Professional car service center in Hermata, offering comprehensive automotive services including washing, maintenance, repairs, and diagnostics. Experienced technicians with modern equipment.
Phone: +251911234567
Email: hermata.garage@example.com
```

**Location:**
```
Address: Near Hermata Market, Main Road to Agaro
City: Jimma
State/Region: Oromia
Country: Ethiopia
Latitude: 7.6769
Longitude: 36.8344
```

**Services & Pricing:**
```json
{
  "services": [
    { "name": "Car Wash", "price": 300, "duration": 30 },
    { "name": "Oil Change", "price": 800, "duration": 45 },
    { "name": "Tire Service", "price": 500, "duration": 60 },
    { "name": "Brake Service", "price": 1200, "duration": 90 },
    { "name": "Engine Diagnostics", "price": 1500, "duration": 120 },
    { "name": "General Maintenance", "price": 1000, "duration": 90 },
    { "name": "Body Work", "price": 3000, "duration": 240 },
    { "name": "Painting", "price": 5000, "duration": 480 }
  ]
}
```

**Operating Hours:**
```
Monday: 08:00 - 18:00
Tuesday: 08:00 - 18:00
Wednesday: 08:00 - 18:00
Thursday: 08:00 - 18:00
Friday: 08:00 - 18:00
Saturday: 08:00 - 17:00
Sunday: 09:00 - 14:00
```

**Capacity:**
```
Total Slots: 8
```

**Payment Methods:**
```
☑ Cash
☑ Telebirr
☑ CBE Birr
☑ Abysinia Bank
```

**Bank Accounts:**
```
CBE Account: 1000123456789
CBE Account Name: CarGarage Hermata PLC
Abysinia Account: 2000987654321
Abysinia Account Name: CarGarage Hermata PLC
```

### Step 3: Upload License

Upload business license document (PDF or image)

### Step 4: Wait for Admin Approval

Admin will review and approve the garage registration.

---

## Quick Registration Script

Use this PowerShell script to register via API:

```powershell
# register-hermata-garage.ps1

# Step 1: Register garage owner account
$registerResponse = Invoke-RestMethod -Uri "http://localhost:5002/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    username = "hermata_garage"
    password = "HermataGarage2024!"
    name = "Hermata Garage Manager"
    email = "hermata.garage@example.com"
    phone = "+251911234567"
    role = "garage_owner"
  } | ConvertTo-Json)

Write-Host "✅ Garage owner account created"
$token = $registerResponse.token

# Step 2: Register garage
$garageResponse = Invoke-RestMethod -Uri "http://localhost:5002/api/garages/register" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body (@{
    name = "CarGarage Hermata"
    description = "Professional car service center in Hermata, offering comprehensive automotive services including washing, maintenance, repairs, and diagnostics. Experienced technicians with modern equipment."
    location = @{
      address = "Near Hermata Roundabout, behind Total Gas Station"
      city = "Addis Ababa"
      state = "Addis Ababa"
      country = "Ethiopia"
      coordinates = @{
        latitude = 8.9806
        longitude = 38.7578
      }
    }
    phone = "+251911234567"
    email = "hermata.garage@example.com"
    services = @(
      @{ name = "Car Wash"; price = 300; duration = 30 },
      @{ name = "Oil Change"; price = 800; duration = 45 },
      @{ name = "Tire Service"; price = 500; duration = 60 },
      @{ name = "Brake Service"; price = 1200; duration = 90 },
      @{ name = "Engine Diagnostics"; price = 1500; duration = 120 },
      @{ name = "General Maintenance"; price = 1000; duration = 90 },
      @{ name = "Body Work"; price = 3000; duration = 240 },
      @{ name = "Painting"; price = 5000; duration = 480 }
    )
    operatingHours = @{
      monday = @{ open = "08:00"; close = "18:00" }
      tuesday = @{ open = "08:00"; close = "18:00" }
      wednesday = @{ open = "08:00"; close = "18:00" }
      thursday = @{ open = "08:00"; close = "18:00" }
      friday = @{ open = "08:00"; close = "18:00" }
      saturday = @{ open = "08:00"; close = "17:00" }
      sunday = @{ open = "09:00"; close = "14:00" }
    }
    capacity = 8
    paymentMethods = @("cash", "telebirr", "cbe_birr", "abyssinia_bank")
    bankAccounts = @{
      cbe = @{
        accountNumber = "1000123456789"
        accountName = "CarGarage Hermata PLC"
        branch = "Bole Branch"
      }
      abyssinia = @{
        accountNumber = "2000987654321"
        accountName = "CarGarage Hermata PLC"
        branch = "Hermata Branch"
      }
    }
  } | ConvertTo-Json -Depth 10)

Write-Host "✅ Garage registered successfully"
Write-Host "Garage ID: $($garageResponse.data._id)"
Write-Host ""
Write-Host "⏳ Waiting for admin approval..."
Write-Host "Login as admin to approve the garage"
```

---

## Admin Approval

After registration, admin needs to approve:

1. Login as admin
2. Go to "Garage Verification"
3. Find "CarGarage Hermata"
4. Review details
5. Click "Approve"

---

## Test Booking

After approval, test with a car owner account:

1. Login as car owner
2. Search for garages near Hermata
3. Select "CarGarage Hermata"
4. Choose service (e.g., Car Wash - 300 ETB)
5. Select date and time
6. Create reservation
7. Make payment using preferred method

---

## Contact Information

**CarGarage Hermata**
- 📍 Near Hermata Roundabout, Addis Ababa
- 📞 +251 911 234567
- 📧 hermata.garage@example.com
- 🕐 Mon-Fri: 8AM-6PM, Sat: 8AM-5PM, Sun: 9AM-2PM

**Services**: Car Wash, Oil Change, Tire Service, Brake Service, Engine Diagnostics, Maintenance, Body Work, Painting

**Payment**: Cash, Telebirr, CBE Birr, Abysinia Bank
