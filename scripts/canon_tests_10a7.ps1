# =============================================================================
# FlahaSOIL v2 — Phase 10A.7 canonical integration test runner
# =============================================================================
# Purpose:  Exercises the live HTTP API end-to-end for three canonical soil
#           levels (PRELIMINARY / MODERATE / ADVANCED).  Uses the REAL app
#           path: login → project → sample → test → calculate → report.
#           Serves as the authoritative source of canonical inputs that are
#           mirrored as static fixtures in Phase 10A.8 golden tests.
#
# Required environment:
#   • Backend running on http://localhost:3002
#   • A seeded test account: canon10a7@flahasoil.test / Canon10A7!Test
#
# Expected output:
#   AUTH_OK=true, PROJECT_ID=…, then per-level: sample / test / physics /
#   chemistry / report JSON fragments.  Exits non-zero on any API failure.
#
# CI-safe: NO — requires a live database and seeded credentials.
#           Run locally before tagging a Phase 10A release.
# =============================================================================

$BASE = "http://localhost:3002/api/v2"

function Api([string]$Method, [string]$Path, [object]$Body, [hashtable]$Headers) {
    $params = @{ Uri = "$BASE$Path"; Method = $Method; ErrorAction = "Stop" }
    if ($Headers) { $params["Headers"] = $Headers }
    if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Depth 10); $params["ContentType"] = "application/json" }
    Invoke-RestMethod @params
}

# 1. Auth
$loginRes = Api "POST" "/auth/login" @{ email = "canon10a7@flahasoil.test"; password = "Canon10A7!Test" }
$token = $loginRes.session.accessToken
$h = @{ Authorization = "Bearer $token" }
"AUTH_OK=true   user=$($loginRes.session.user.id)"

# 2. Create project (timestamp suffix avoids duplicate-code conflicts on re-runs)
$ts = (Get-Date -Format "HHmmss")
$proj = Api "POST" "/projects" @{ name = "Canon P10A7 $ts"; code = "CP10A7$ts" } $h
$projectId = $proj.project.id
"PROJECT_ID=$projectId"

function RunCanon([string]$label, [hashtable]$sampleBody, [hashtable]$testBody) {
    Write-Host "`n=== $label ===" -ForegroundColor Cyan

    # sample
    $sampleBody["projectId"] = $projectId
    $sample = Api "POST" "/soil-samples" $sampleBody $h
    $sampleId = $sample.sample.id
    Write-Host "  SAMPLE_ID=$sampleId"

    # test
    $testBody["sampleId"] = $sampleId
    $test = Api "POST" "/soil-tests" $testBody $h
    $soilTestId = $test.soilTest.id
    Write-Host "  TEST_ID=$soilTestId  level=$($test.soilTest.testLevel)"

    # calculate
    $calc = Api "POST" "/soil-tests/$soilTestId/calculate" @{ runPhysics = $true; runChemistry = $true; runInterpretation = $true; includeTrace = $true } $h
    Write-Host "  CALC_OK: physics=$($null -ne $calc.physicsResult)  chemistry=$($null -ne $calc.chemistryResult)  interpretation=$($null -ne $calc.interpretation)"

    # generate report via the real app path
    $rep = Api "POST" "/soil-tests/$soilTestId/reports" @{ reportType = "PROFESSIONAL" } $h
    $reportId = $rep.report.id
    Write-Host "  REPORT_ID=$reportId  status=$($rep.report.status)"

    # snapshot is in rep.version.snapshot
    $snap = $rep.version.snapshot
    Write-Host "  SCHEMA=$($snap.schemaVersion)  RATING=$($snap.agronomic.overallSoilRating)"
    Write-Host "  BD_USED=$($snap.physics.bulkDensityTrace.used) BD_PRED=$($snap.physics.bulkDensityTrace.predicted) SOURCE=$($snap.physics.bulkDensityTrace.source)"
    Write-Host "  EC=$($snap.salinity.ecDsM) SAL_SEV=$($snap.salinity.severity) SOD_SEV=$($snap.sodicity.severity)"
    Write-Host "  COMPLETENESS_PCT=$($snap.completeness.coveragePercent)% STATUS=$($snap.completeness.status)"

    # render HTML via preview endpoint
    $hdr = @{}
    foreach ($k in $h.Keys) { $hdr[$k] = $h[$k] }
    $htmlRes = Invoke-WebRequest -Uri "$BASE/reports/$reportId/versions/1/preview" -Headers $hdr -ErrorAction Stop
    $htmlFile = "$label-report.html"
    $htmlRes.Content | Out-File -FilePath $htmlFile -Encoding utf8
    Write-Host "  HTML_SAVED=$htmlFile  SIZE=$($htmlRes.RawContentLength)"

    return @{ soilTestId = $soilTestId; reportId = $reportId; snap = $snap }
}

# ── Test A: PRELIMINARY / Simple Salinity Screen ──────────────────────────────
$tA = RunCanon "TEST-A-PRELIMINARY" `
@{ locationName = "P10A7 Preliminary Simple" } `
@{
    testLevel      = "PRELIMINARY"
    textureInput   = @{ sandPercent = 65; siltPercent = 15; clayPercent = 20; organicMatterPercent = 1.5; source = "LAB" }
    chemistryInput = @{ pH = 8.1; ecDsM = 6.0; tdsMgL = 3840; source = "LAB" }
}

# ── Test B: MODERATE / Canonical Reference Sample #001 ────────────────────────
$tB = RunCanon "TEST-B-MODERATE" `
@{ locationName = "Audit reference 60/25/15" } `
@{
    testLevel      = "MODERATE"
    textureInput   = @{ sandPercent = 60; siltPercent = 25; clayPercent = 15; organicMatterPercent = 2.5; source = "LAB" }
    chemistryInput = @{ pH = 7.2; ecDsM = 1.0; cec = 18; ca = 11; mg = 3; k = 0.6; na = 0.4; n = 30; p = 15; source = "LAB" }
}

# ── Test C: ADVANCED / Full Diagnostic Panel ──────────────────────────────────
$tC = RunCanon "TEST-C-ADVANCED" `
@{ locationName = "P10A7 Advanced Full"; latitude = 25.3; longitude = 51.5 } `
@{
    testLevel      = "ADVANCED"
    textureInput   = @{ sandPercent = 35; siltPercent = 35; clayPercent = 30; organicMatterPercent = 1.8; bulkDensity = 1.42; gravelPercent = 5; source = "LAB" }
    chemistryInput = @{
        pH = 8.3; ecDsM = 4.5; tdsMgL = 2880; cec = 22; ca = 13; mg = 4; k = 0.7; na = 2.0
        n = 20; p = 16; cl = 180; s = 15; fe = 6.5; mn = 3.2; zn = 0.8; cu = 0.6; b = 0.5; mo = 0.08
        carbonate = 8; bicarbonate = 220; sar = 4.0; esp = 9.1
        heavyMetalsJson = @{ Pb = 12; Cd = 0.2; Cr = 18; Ni = 9 }
        fullNutrientPanelJson = @{ NO3_N = 12; NH4_N = 4; availableK_mgkg = 145 }
        source = "LAB"
    }
}

Write-Host "`n=== ALL CANONICAL TESTS COMPLETE ===" -ForegroundColor Green
Write-Host "Test A report HTML: TEST-A-PRELIMINARY-report.html"
Write-Host "Test B report HTML: TEST-B-MODERATE-report.html"
Write-Host "Test C report HTML: TEST-C-ADVANCED-report.html"

