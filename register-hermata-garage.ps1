# Register CarGarage Hermata
# Quick registration script for Hermata garage

Write-Host "🚗 Registering CarGarage Hermata..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5002/api"

# Step 1: Register garage owner account
Write-Host "1️⃣ Creating garage owner account..." -ForegroundColor Yellow

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
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

    Write-Host "✅ Garage owner account created" -ForegroundColor Green
    Write-Host "   Username: hermata_garage" -ForegroundColor Gray
    Write-Host "   Password: HermataGarage2024!" -ForegroundColor Gray
    Write-Host ""
    
    $token = $registerResponse.token
} catch {
    Write-Host "❌ Failed to create account: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Account may already exist. Try logging in instead." -ForegroundColor Yellow
    exit 1
}

# Step 2: Register garage
Write-Host "2️⃣ Registering garage..." -ForegroundColor Yellow

try {
    $garageResponse = Invoke-RestMethod -Uri "$baseUrl/garages/register" `
      -Method POST `
      -Headers @{ Authorization = "Bearer $token" } `
      -ContentType "application/json" `
      -Body (@{
        name = "CarGarage Hermata"
        description = "Professional car service center in Hermata, Jimma, offering comprehensive automotive services including washing, maintenance, repairs, and diagnostics. Experienced technicians with modern equipment."
        location = @{
          address = "Near Hermata Market, Main Road to Agaro"
          city = "Jimma"
          state = "Oromia"
          country = "Ethiopia"
          coordinates = @{
            latitude = 7.6769
            longitude = 36.8344
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
      } | ConvertTo-Json -Depth 10)

    Write-Host "✅ Garage registered successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Garage Details:" -ForegroundColor Cyan
    Write-Host "   Name: CarGarage Hermata" -ForegroundColor Gray
    Write-Host "   ID: $($garageResponse.data._id)" -ForegroundColor Gray
    Write-Host "   Location: Hermata, Jimma" -ForegroundColor Gray
    Write-Host "   Status: Pending Approval" -ForegroundColor Yellow
    Write-Host ""
    
} catch {
    Write-Host "❌ Failed to register garage: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Instructions for admin approval
Write-Host "3️⃣ Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "⏳ Garage is pending admin approval" -ForegroundColor Yellow
Write-Host ""
Write-Host "To approve the garage:" -ForegroundColor Cyan
Write-Host "   1. Login as admin" -ForegroundColor Gray
Write-Host "   2. Go to 'Garage Verification' page" -ForegroundColor Gray
Write-Host "   3. Find 'CarGarage Hermata'" -ForegroundColor Gray
Write-Host "   4. Click 'Approve'" -ForegroundColor Gray
Write-Host ""
Write-Host "Or run this command:" -ForegroundColor Cyan
Write-Host "   .\approve-hermata-garage.ps1" -ForegroundColor White
Write-Host ""
Write-Host "✅ Registration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📞 Contact: +251 911 234567" -ForegroundColor Gray
Write-Host "📧 Email: hermata.garage@example.com" -ForegroundColor Gray
Write-Host "🕐 Hours: Mon-Fri 8AM-6PM, Sat 8AM-5PM, Sun 9AM-2PM" -ForegroundColor Gray
