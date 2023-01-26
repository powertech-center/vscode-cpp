
Set-Location $PSScriptRoot

# version
if ("$Env:version" -ne "") {
    $Version = $Env:version
}
else {
    $Version = (Get-Date -Format "yy.MM.dd" -AsUTC).Replace(".0", ".")
}
$IsPublishing = ($null -ne $Env:VSCE_TOKEN) -and ($Env:VSCE_TOKEN -ne "")

# pre-release (ToDo)
$IsPreRelease = $false
if (!$IsPublishing) {
    $IsPreRelease = $true 
}

# package
$FileName = "powercpp-$Version.vsix"
Write-Host "Packaging $FileName..."
$package_json = "$PSScriptRoot/package.json"
$package_bak = "$PSScriptRoot/package.json.bak"
Copy-Item $package_json $package_bak
$Package = Get-Content -Path $package_json -Raw
Set-Content -Path $package_json -Value ($Package.Replace('"version": "0.0.0"', '"version": "' + $Version + '"'))
if ($IsPreRelease) {
    vsce package --pre-release
} else {
    vsce package
}
Remove-Item $package_json
Move-Item $package_bak $package_json 

# manifest replacement replacement
Write-Host "Manifest $FileName replacing..."
$ZipFileName = "$FileName.zip"
$ManifestFileName = "extension.vsixmanifest"
Move-Item $FileName $ZipFileName
7z e $ZipFileName $ManifestFileName -y
$Manifest = Get-Content -Path $ManifestFileName -Raw
$LeftPart = $Manifest.Substring(0, $Manifest.IndexOf("<Tags>") + "<Tags>".Length)
$RightPart = $Manifest.Substring($Manifest.IndexOf("</Tags>"))
$Tags = ((ConvertFrom-Json $Package).keywords -join ",")
$Manifest = $LeftPart + $Tags + $RightPart
Set-Content -Path $ManifestFileName -Value $Manifest
7z a $ZipFileName $ManifestFileName
Remove-Item $ManifestFileName
Move-Item $ZipFileName $FileName

# publishing or local installation
if ($IsPublishing) {
    Write-Host "Publishing $FileName..."
    if ($IsPreRelease) {
        vsce publish -p $Env:VSCE_TOKEN --packagePath $FileName --pre-release
    } else {
        vsce publish -p $Env:VSCE_TOKEN --packagePath $FileName
    }    
    Remove-Item $FileName
}
else {
    $Directory = "$Home/.vscode/extensions/powertech.powercpp-$Version".Replace('\', '/')
    Write-Host "Target extension directory: $Directory" 
    code --install-extension $FileName --pre-release --force
    Remove-Item $FileName
    if ($ISWINDOWS) {
        Start-Process $Directory
    }
    else {
        Set-Location $Directory
    }
}

# success
Write-Host "Done" -ForegroundColor Green