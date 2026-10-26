Add-Type -AssemblyName System.Drawing

function Draw-GigaIcon([int]$size, [string]$outputPath) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.Clear([System.Drawing.Color]::Transparent)

    $scale = $size / 256.0

    # Squircle Background with Amber Edge
    $bgRect = New-Object System.Drawing.RectangleF (14 * $scale), (14 * $scale), (228 * $scale), (228 * $scale)
    $corner = 50 * $scale
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($bgRect.X, $bgRect.Y, $corner, $corner, 180, 90)
    $path.AddArc($bgRect.Right - $corner, $bgRect.Y, $corner, $corner, 270, 90)
    $path.AddArc($bgRect.Right - $corner, $bgRect.Bottom - $corner, $corner, $corner, 0, 90)
    $path.AddArc($bgRect.X, $bgRect.Bottom - $corner, $corner, $corner, 90, 90)
    $path.CloseFigure()

    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 16, 15, 18))
    $g.FillPath($bgBrush, $path)

    $rimPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(140, 249, 115, 22), (3 * $scale))
    $g.DrawPath($rimPen, $path)

    # Shackle (Padlock arch at top)
    $shacklePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(240, 255, 255, 255)), (14 * $scale)
    $shacklePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $shacklePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $shackleRect = New-Object System.Drawing.RectangleF (94 * $scale), (42 * $scale), (68 * $scale), (68 * $scale)
    $g.DrawArc($shacklePen, $shackleRect, 180, 180)

    # Bold "G" Body (Vibrant gradient from #FF9A3C to #EA580C)
    $gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
        (New-Object System.Drawing.PointF (40 * $scale), (40 * $scale)),
        (New-Object System.Drawing.PointF (216 * $scale), (216 * $scale)),
        ([System.Drawing.Color]::FromArgb(255, 255, 154, 60)),
        ([System.Drawing.Color]::FromArgb(255, 234, 88, 12))
    )

    $gStroke = 26 * $scale
    $gPen = New-Object System.Drawing.Pen $gradBrush, $gStroke
    $gPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $gPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    $gArcRect = New-Object System.Drawing.RectangleF (48 * $scale), (48 * $scale), (160 * $scale), (160 * $scale)
    $g.DrawArc($gPen, $gArcRect, -35, 280)

    # "G" Inward Horizontal Lock Bar
    $barY = 128 * $scale
    $barX1 = 124 * $scale
    $barX2 = 196 * $scale
    $barPen = New-Object System.Drawing.Pen $gradBrush, (24 * $scale)
    $barPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $barPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($barPen, $barX1, $barY, $barX2, $barY)

    # Center Keyhole Slot
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $keyCircle = New-Object System.Drawing.RectangleF (121 * $scale), (145 * $scale), (14 * $scale), (14 * $scale)
    $g.FillEllipse($whiteBrush, $keyCircle)

    $poly = @(
        (New-Object System.Drawing.PointF (125 * $scale), (153 * $scale)),
        (New-Object System.Drawing.PointF (131 * $scale), (153 * $scale)),
        (New-Object System.Drawing.PointF (133 * $scale), (168 * $scale)),
        (New-Object System.Drawing.PointF (123 * $scale), (168 * $scale))
    )
    $g.FillPolygon($whiteBrush, $poly)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Generate 256x256 PNG
Draw-GigaIcon 256 "$dir\icon.png"
Draw-GigaIcon 32 "$dir\tray.png"

# Generate multi-size ICO
$sizes = @(256, 128, 64, 48, 32, 16)
$tempImages = @()
foreach ($s in $sizes) {
    $tempP = "$dir\temp_$s.png"
    Draw-GigaIcon $s $tempP
    $b = [System.IO.File]::ReadAllBytes($tempP)
    Remove-Item $tempP -Force
    $tempImages += ,@($s, $b)
}

$icoPath = "$dir\icon.ico"
$stream = [System.IO.File]::Create($icoPath)
$writer = New-Object System.IO.BinaryWriter($stream)

$writer.Write([uint16]0)
$writer.Write([uint16]1)
$writer.Write([uint16]$tempImages.Count)

$offset = 6 + ($tempImages.Count * 16)
foreach ($item in $tempImages) {
    $s = $item[0]
    $data = [byte[]]$item[1]
    $wb = if ($s -ge 256) { [byte]0 } else { [byte]$s }
    $hb = if ($s -ge 256) { [byte]0 } else { [byte]$s }

    $writer.Write($wb)
    $writer.Write($hb)
    $writer.Write([byte]0)
    $writer.Write([byte]0)
    $writer.Write([uint16]1)
    $writer.Write([uint16]32)
    $writer.Write([uint32]$data.Length)
    $writer.Write([uint32]$offset)

    $offset += $data.Length
}

foreach ($item in $tempImages) {
    $data = [byte[]]$item[1]
    $writer.Write($data, 0, $data.Length)
}

$writer.Flush()
$writer.Close()
$stream.Close()

Write-Host "Successfully generated icon.png, tray.png, and icon.ico (size: $( (Get-Item $icoPath).Length ) bytes)"
