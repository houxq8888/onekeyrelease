$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
$headers.Add("Authorization", "Bearer demo-token")
$headers.Add("Content-Type", "application/json")

$body = @{
    title = "测试任务"
    type = "content_generation"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/tasks" -Method Post -Headers $headers -Body $body -UseBasicParsing

Write-Output "Status: $($response.StatusCode)"
Write-Output "Content: $($response.Content)"
