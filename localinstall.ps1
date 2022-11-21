
Set-Location $PSScriptRoot

$package_json = "$PSScriptRoot/package.json"
$package_bak = "$PSScriptRoot/package.json.bak"
Copy-Item $package_json $package_bak

$Package = Get-Content -Path $package_json -Raw
$Version = Get-Date -Format "yy.MM.dd"
Set-Content -Path $package_json -Value ($Package.Replace('"version": "0.0.0"', '"version": "' + $Version + '"'))

$FileName = "powercpp-$Version.vsix"
$Directory = "$Home/.vscode/extensions/powertech.powercpp-$Version".Replace('\', '/')
Write-Host "Target extension directory: $Directory"
vsce package --pre-release
Remove-Item $package_json
Move-Item $package_bak $package_json

code --install-extension $FileName --pre-release --force
Remove-Item $FileName

if ($ISWINDOWS)
{
    Start-Process <#explorer#> $Directory
}
else
{
    Set-Location $Directory
}	