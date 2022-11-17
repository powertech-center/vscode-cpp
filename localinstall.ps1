
$Package = ConvertFrom-Json (Get-Content -Path "package.json" -Raw) -Depth 100 -AsHashTable
$Version = $Package["version"]

$FileName = "powercpp-$Version.vsix"
$Directory = "$Home/.vscode/extensions/powertech.powercpp-$Version".Replace('\', '/')
Write-Host "Target extension directory: $Directory"
vsce package
code --install-extension $FileName --force
Remove-Item $FileName

if ($ISWINDOWS)
{
    start <#explorer#> $Directory

    Write-Host "Press any key to continue..." -NoNewline
    [void][System.Console]::ReadKey($true)
    Write-Host ""
}
else
{
    cd $Directory
}	