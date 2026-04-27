# PowerShell script to set a dispute to pending status for testing Take Action

$body = @{
    disputeId = "PASTE_DISPUTE_ID_HERE"
    newStatus = "pending"
} | ConvertTo-Json

Write-Host "Setting dispute to pending status..." -ForegroundColor Cyan

# You'll need to run this in MongoDB directly or create an admin endpoint
# For now, let's use MongoDB directly

$mongoCommand = @"
use smart_garaging;
db.disputes.updateOne(
    { _id: ObjectId('PASTE_DISPUTE_ID_HERE') },
    { 
        `$set: { 
            status: 'pending',
            resolvedBy: null,
            resolvedAt: null
        }
    }
);
"@

Write-Host "`nRun this in MongoDB shell:" -ForegroundColor Yellow
Write-Host $mongoCommand -ForegroundColor White

Write-Host "`nOr use this simpler approach:" -ForegroundColor Yellow
Write-Host "mongosh `"mongodb+srv://your-connection-string`" --eval `"db.disputes.updateOne({}, {`$set: {status: 'pending', resolvedBy: null, resolvedAt: null}})`"" -ForegroundColor White
