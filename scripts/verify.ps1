$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$python = Join-Path $root 'backend\.venv\Scripts\python.exe'

if (-not (Test-Path $python)) {
  throw 'Ambiente backend\.venv não encontrado. Crie o venv e instale backend\requirements.txt.'
}

Push-Location (Join-Path $root 'backend')
try {
  & $python -m unittest discover -s tests -p 'test_*.py'
} finally {
  Pop-Location
}

$previousPythonPath = $env:PYTHONPATH
$env:PYTHONPATH = (Join-Path $root 'backend')
try {
  & $python -m unittest discover -s (Join-Path $root 'tests') -p 'test_*.py'
} finally {
  $env:PYTHONPATH = $previousPythonPath
}

Push-Location (Join-Path $root 'frontend')
try {
  npm.cmd run build
} finally {
  Pop-Location
}

Write-Host 'Validação concluída: backend, segurança e frontend aprovados.' -ForegroundColor Green
