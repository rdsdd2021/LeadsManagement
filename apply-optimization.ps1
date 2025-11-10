Write-Host "Applying RLS optimization to Supabase..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Go to your Supabase SQL Editor and run this SQL:" -ForegroundColor Yellow
Write-Host ""
Get-Content "supabase/migrations/20250110000001_optimize_rls_policies.sql"
Write-Host ""
Write-Host "This will:" -ForegroundColor Green
Write-Host "1. Create cached helper functions for role checks" -ForegroundColor White
Write-Host "2. Replace expensive subqueries in RLS policies" -ForegroundColor White
Write-Host "3. Add index on users.role for faster lookups" -ForegroundColor White
Write-Host "4. Improve query performance by 10-100x" -ForegroundColor White
