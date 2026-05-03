@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   RAILWAY API TESTING - DeepTrust Backend
echo ============================================================
echo.
echo Production URL: https://deeptrustgfbfbackend-production.up.railway.app
echo.
echo Starting tests in 5 seconds...
timeout /t 5 /nobreak >nul

set BASE_URL=https://deeptrustgfbfbackend-production.up.railway.app
set APP_USER_ID=
set PLAN_ID=
set IMAGE_ID=
set SEARCH_ID=

echo.
echo ============================================================
echo TEST 1: Health Check
echo ============================================================
curl -s -w "\nHTTP Status: %%{http_code}\n" %BASE_URL%/api/health
echo.
pause

echo.
echo ============================================================
echo TEST 2: Root Endpoint
echo ============================================================
curl -s -w "\nHTTP Status: %%{http_code}\n" %BASE_URL%/
echo.
pause

echo.
echo ============================================================
echo TEST 3: Get Plans (No Auth Required)
echo ============================================================
curl -s -w "\nHTTP Status: %%{http_code}\n" %BASE_URL%/api/plans
echo.
pause

echo.
echo ============================================================
echo TEST 4: Create User
echo ============================================================
echo Request Body:
echo {
echo   "deviceId": "railway-test-001",
echo   "deviceInfo": {
echo     "platform": "Windows",
echo     "version": "11",
echo     "model": "PC"
echo   }
echo }
echo.
curl -s -X POST %BASE_URL%/api/users ^
  -H "Content-Type: application/json" ^
  -d "{\"deviceId\":\"railway-test-001\",\"deviceInfo\":{\"platform\":\"Windows\",\"version\":\"11\",\"model\":\"PC\"}}" ^
  -w "\nHTTP Status: %%{http_code}\n"
echo.
echo IMPORTANT: Copy the appUserId from above response!
set /p APP_USER_ID="Enter appUserId (DTX-XXXX-XXXX): "
echo Saved: %APP_USER_ID%
echo.
pause

if "%APP_USER_ID%"=="" (
    echo ERROR: appUserId not provided. Cannot continue.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo TEST 5: Get Current User
echo ============================================================
curl -s -X GET %BASE_URL%/api/users/me ^
  -H "x-app-user-id: %APP_USER_ID%" ^
  -w "\nHTTP Status: %%{http_code}\n"
echo.
pause

echo.
echo ============================================================
echo TEST 6: Get User Stats
echo ============================================================
curl -s -X GET %BASE_URL%/api/users/me/stats ^
  -H "x-app-user-id: %APP_USER_ID%" ^
  -w "\nHTTP Status: %%{http_code}\n"
echo.
pause

echo.
echo ============================================================
echo TEST 7: Get Plans (Save Plan ID)
echo ============================================================
curl -s -X GET %BASE_URL%/api/plans ^
  -w "\nHTTP Status: %%{http_code}\n"
echo.
echo IMPORTANT: Copy a plan ID from above response!
set /p PLAN_ID="Enter planId: "
echo Saved: %PLAN_ID%
echo.
pause

if "%PLAN_ID%"=="" (
    echo WARNING: planId not provided. Skipping payment tests.
) else (
    echo.
    echo ============================================================
    echo TEST 8: Create Payment Order
    echo ============================================================
    curl -s -X POST %BASE_URL%/api/payments/order ^
      -H "Content-Type: application/json" ^
      -H "x-app-user-id: %APP_USER_ID%" ^
      -d "{\"planId\":\"!PLAN_ID!\"}" ^
      -w "\nHTTP Status: %%{http_code}\n"
    echo.
    pause
)

echo.
echo ============================================================
echo TEST 9: Upload Image (SKIP - Requires File)
echo ============================================================
echo NOTE: Image upload requires multipart/form-data with file.
echo Use Postman for this test.
echo.
echo To test manually:
echo curl -X POST %BASE_URL%/api/uploads \
echo   -H "x-app-user-id: %APP_USER_ID%" \
echo   -F "image=@path/to/image.jpg"
echo.
pause

echo.
echo ============================================================
echo TEST 10: Get User Uploads
echo ============================================================
curl -s -X GET "%BASE_URL%/api/uploads?page=1&limit=10" ^
  -H "x-app-user-id: %APP_USER_ID%" ^
  -w "\nHTTP Status: %%{http_code}\n"
echo.
pause

echo.
echo ============================================================
echo TEST 11: Create Search - Name (Requires Credits)
echo ============================================================
echo NOTE: This will fail with 403 if user has no credits.
echo.
curl -s -X POST %BASE_URL%/api/searches ^
  -H "Content-Type: application/json" ^
  -H "x-app-user-id: %APP_USER_ID%" ^
  -d "{\"searchType\":\"name\",\"nameQuery\":\"Elon Musk\"}" ^
  -w "\nHTTP Status: %%{http_code}\n"
echo.
echo If you got 403 INSUFFICIENT_CREDITS, that's expected.
echo You need to complete payment first.
echo.
pause

echo.
echo ============================================================
echo TEST 12: Get User Searches
echo ============================================================
curl -s -X GET "%BASE_URL%/api/searches?page=1&limit=10" ^
  -H "x-app-user-id: %APP_USER_ID%" ^
  -w "\nHTTP Status: %%{http_code}\n"
echo.
pause

echo.
echo ============================================================
echo TEST 13: Get Payment History
echo ============================================================
curl -s -X GET "%BASE_URL%/api/payments/history?page=1&limit=10" ^
  -H "x-app-user-id: %APP_USER_ID%" ^
  -w "\nHTTP Status: %%{http_code}\n"
echo.
pause

echo.
echo ============================================================
echo TESTING COMPLETE!
echo ============================================================
echo.
echo Summary:
echo - Base URL: %BASE_URL%
echo - App User ID: %APP_USER_ID%
echo - Plan ID: %PLAN_ID%
echo.
echo Next Steps:
echo 1. If health check failed (502), wait 5-10 minutes and retry
echo 2. If health check passed, all other endpoints should work
echo 3. Use Postman for image upload testing
echo 4. Complete payment to test search functionality
echo.
echo ============================================================
pause
