# Minimal static server for local preview: powershell -File .claude/serve.ps1 [port]
param([int]$Port = 8080)
$root = Split-Path -Parent $PSScriptRoot
$types = @{ ".html"="text/html; charset=utf-8"; ".css"="text/css"; ".js"="text/javascript"; ".json"="application/json";
  ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".png"="image/png"; ".webp"="image/webp"; ".svg"="image/svg+xml"; ".ico"="image/x-icon" }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "Serving $root on http://localhost:$Port/"
while ($l.IsListening) {
  $ctx = $l.GetContext()
  $p = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ($p -eq "") { $p = "index.html" }
  $f = [IO.Path]::GetFullPath((Join-Path $root $p))
  if ($ctx.Request.HttpMethod -eq "PUT") {
    # Dev-only: save optimized images generated in the browser (only into img/ or fotky/)
    if ($f.StartsWith((Join-Path $root "img\")) -or $f.StartsWith((Join-Path $root "fotky\"))) {
      $ms = New-Object IO.MemoryStream; $ctx.Request.InputStream.CopyTo($ms)
      [IO.File]::WriteAllBytes($f, $ms.ToArray()); $ctx.Response.StatusCode = 204
    } else { $ctx.Response.StatusCode = 403 }
    $ctx.Response.Close(); continue
  }
  if ($f.StartsWith($root) -and (Test-Path $f -PathType Leaf)) {
    $b = [IO.File]::ReadAllBytes($f)
    $ext = [IO.Path]::GetExtension($f).ToLower()
    $ctx.Response.ContentType = $(if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" })
    $ctx.Response.Headers.Add("Cache-Control", "no-store")
    $ctx.Response.OutputStream.Write($b, 0, $b.Length)
  } else { $ctx.Response.StatusCode = 404 }
  $ctx.Response.Close()
}
