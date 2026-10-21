@echo off
setlocal
cd /d "%~dp0"
title Dashboard Monitoring DOI Bulanan Server

echo ========================================================
echo   Memulai Server Dashboard Monitoring DOI Bulanan...
echo ========================================================
echo.
echo URL Dashboard:
echo   - http://localhost:8000
echo   - http://127.0.0.1:8000
echo.
echo Menyiapkan dataset dan inisialisasi server backend...
echo [INFO] Jangan tutup jendela ini selama menggunakan dashboard.
echo [INFO] Browser akan terbuka otomatis begitu server siap.
echo.

:: Cek ketersediaan Python
set "PYTHON_CMD="
if exist "C:\Program Files\Inkscape\bin\python.exe" (
    set "PYTHON_CMD=C:\Program Files\Inkscape\bin\python.exe"
) else (
    where python >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        set "PYTHON_CMD=python"
    )
)

if "%PYTHON_CMD%"=="" (
    echo [ERROR] Python tidak ditemukan di sistem.
    echo Pastikan Python telah terinstall dan terdaftar di PATH.
    pause
    exit /b 1
)

:: Validasi eksekusi Python
"%PYTHON_CMD%" --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    if exist "C:\Program Files\Inkscape\bin\python.exe" (
        set "PYTHON_CMD=C:\Program Files\Inkscape\bin\python.exe"
    ) else (
        echo [ERROR] Eksekusi Python gagal.
        echo Periksa instalasi Python Anda atau execution aliases Windows.
        pause
        exit /b 1
    )
)

echo [INFO] Menggunakan: %PYTHON_CMD%
echo [INFO] Jika cache data (.data_cache.pkl) belum ada atau dataset Excel baru diedit,
echo        proses inisialisasi awal membaca 1 juta baris sales membutuhkan waktu ~1-2 menit.
echo        Mohon JANGAN tutup jendela ini hingga browser terbuka.
echo.

:: Jalankan backend server (otomatis membuka browser saat siap)
"%PYTHON_CMD%" backend\main.py

echo.
echo ========================================================
echo Server telah berhenti.
echo ========================================================
pause


