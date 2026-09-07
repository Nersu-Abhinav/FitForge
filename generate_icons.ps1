Add-Type -AssemblyName System.Drawing

$src = "C:\Users\hp\.gemini\antigravity-ide\brain\7896d3a8-0ed7-4f3d-81e2-2e1a4a4eaabe\fitforge_app_logo_1788806632652.jpg"
$img = [System.Drawing.Image]::FromFile($src)

function Resize-Image($sourceImage, $width, $height, $destPath) {
    $parent = Split-Path -Parent $destPath
    if (!(Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($sourceImage, 0, 0, $width, $height)
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $destPath ($width x $height)"
}

$targets = @(
    @{ Path = "android\app\src\main\res\mipmap-mdpi\ic_launcher.png"; Size = 48 },
    @{ Path = "android\app\src\main\res\mipmap-mdpi\ic_launcher_round.png"; Size = 48 },
    @{ Path = "android\app\src\main\res\mipmap-mdpi\ic_launcher_foreground.png"; Size = 48 },
    
    @{ Path = "android\app\src\main\res\mipmap-hdpi\ic_launcher.png"; Size = 72 },
    @{ Path = "android\app\src\main\res\mipmap-hdpi\ic_launcher_round.png"; Size = 72 },
    @{ Path = "android\app\src\main\res\mipmap-hdpi\ic_launcher_foreground.png"; Size = 72 },
    
    @{ Path = "android\app\src\main\res\mipmap-xhdpi\ic_launcher.png"; Size = 96 },
    @{ Path = "android\app\src\main\res\mipmap-xhdpi\ic_launcher_round.png"; Size = 96 },
    @{ Path = "android\app\src\main\res\mipmap-xhdpi\ic_launcher_foreground.png"; Size = 96 },
    
    @{ Path = "android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png"; Size = 144 },
    @{ Path = "android\app\src\main\res\mipmap-xxhdpi\ic_launcher_round.png"; Size = 144 },
    @{ Path = "android\app\src\main\res\mipmap-xxhdpi\ic_launcher_foreground.png"; Size = 144 },
    
    @{ Path = "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png"; Size = 192 },
    @{ Path = "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_round.png"; Size = 192 },
    @{ Path = "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_foreground.png"; Size = 192 },

    @{ Path = "android\app\src\main\res\drawable\splash.png"; Size = 512 },
    @{ Path = "android\app\src\main\res\drawable-port-xxxhdpi\splash.png"; Size = 512 },

    @{ Path = "public\app-logo.png"; Size = 512 },
    @{ Path = "public\icon-192.png"; Size = 192 },
    @{ Path = "public\icon-512.png"; Size = 512 },
    @{ Path = "public\favicon.png"; Size = 64 }
)

foreach ($t in $targets) {
    Resize-Image $img $t.Size $t.Size (Join-Path "c:\Users\hp\Desktop\FitForge" $t.Path)
}

$img.Dispose()
Write-Host "All icons generated successfully!"
