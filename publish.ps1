
Set-Location $PSScriptRoot

# version
if ("$Env:version" -ne "") {
    $Version = $Env:version
}
else {
    $Version = (Get-Date -Format "yy.MM.dd" -AsUTC).Replace(".0", ".")
}
$IsPublishing = ($null -ne $Env:VSCE_TOKEN) -and ($Env:VSCE_TOKEN -ne "")

# package
$package_json = "$PSScriptRoot/package.json"
$package_bak = "$PSScriptRoot/package.json.bak"
Copy-Item $package_json $package_bak
$Package = Get-Content -Path $package_json -Raw
Set-Content -Path $package_json -Value ($Package.Replace('"version": "0.0.0"', '"version": "' + $Version + '"'))

# publishing or local installation
if ($IsPublishing) {
    Write-Host "Publishing $Version..."
    vsce publish -p $Env:VSCE_TOKEN
}
else {
    $FileName = "powercpp-$Version.vsix"
    $Directory = "$Home/.vscode/extensions/powertech.powercpp-$Version".Replace('\', '/')
    Write-Host "Target extension directory: $Directory"
    vsce package --pre-release
    Remove-Item $package_json
    Move-Item $package_bak $package_json  
    code --install-extension $FileName --pre-release --force
    Remove-Item $FileName

    if ($ISWINDOWS) {
        Start-Process <#explorer#> $Directory
    }
    else {
        Set-Location $Directory
    }
}	