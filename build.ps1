param(
  [string]$Template = "src\index.template.html",
  [string]$OutFile = "index.html"
)

$root = Get-Location
$templatePath = Join-Path $root $Template
if (!(Test-Path $templatePath)) {
  throw "Template not found: $templatePath"
}

$contentJsonPath = Join-Path $root "content.json"
$contentPartialPath = Join-Path $root "src\partials\content-data.html"
if (Test-Path $contentJsonPath) {
  $json = Get-Content -Raw $contentJsonPath
  @"
<script type=\"application/json\" id=\"content-data\">
$json
</script>
"@ | Set-Content -Path $contentPartialPath
}

$srcRoot = Split-Path $templatePath -Parent
$templateContent = Get-Content -Raw $templatePath

$regex = [regex]'<!--@include\s+(.+?)\s*-->'
$expanded = $regex.Replace($templateContent, {
  param($m)
  $relPath = $m.Groups[1].Value.Trim()
  $fullPath = Join-Path $srcRoot $relPath
  if (!(Test-Path $fullPath)) {
    throw "Include not found: $relPath"
  }
  return (Get-Content -Raw $fullPath).TrimEnd()
})

Set-Content -Path (Join-Path $root $OutFile) -Value $expanded
Write-Host "Built $OutFile from $Template"
