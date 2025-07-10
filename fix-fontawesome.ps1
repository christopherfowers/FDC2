# PowerShell script to convert FontAwesome React components to CSS classes

$patterns = @{
    '<FontAwesomeIcon icon=\{faArrowLeft\} className="([^"]*)" ?/?>' = '<i className="fas fa-arrow-left $1"></i>'
    '<FontAwesomeIcon icon=\{faBullseye\} className="([^"]*)" ?/?>' = '<i className="fas fa-bullseye $1"></i>'
    '<FontAwesomeIcon icon=\{faCrosshairs\} className="([^"]*)" ?/?>' = '<i className="fas fa-crosshairs $1"></i>'
    '<FontAwesomeIcon icon=\{faCompass\} className="([^"]*)" ?/?>' = '<i className="fas fa-compass $1"></i>'
    '<FontAwesomeIcon icon=\{faRulerCombined\} className="([^"]*)" ?/?>' = '<i className="fas fa-ruler-combined $1"></i>'
    '<FontAwesomeIcon icon=\{faClock\} className="([^"]*)" ?/?>' = '<i className="fas fa-clock $1"></i>'
    '<FontAwesomeIcon icon=\{faLocationDot\} className="([^"]*)" ?/?>' = '<i className="fas fa-map-marker-alt $1"></i>'
    '<FontAwesomeIcon icon=\{faEye\} className="([^"]*)" ?/?>' = '<i className="fas fa-eye $1"></i>'
    '<FontAwesomeIcon icon=\{faSave\} className="([^"]*)" ?/?>' = '<i className="fas fa-save $1"></i>'
    '<FontAwesomeIcon icon=\{faEdit\} className="([^"]*)" ?/?>' = '<i className="fas fa-edit $1"></i>'
    '<FontAwesomeIcon icon=\{faCopy\} className="([^"]*)" ?/?>' = '<i className="fas fa-copy $1"></i>'
    '<FontAwesomeIcon icon=\{faShare\} className="([^"]*)" ?/?>' = '<i className="fas fa-share $1"></i>'
    '<FontAwesomeIcon icon=\{faDownload\} className="([^"]*)" ?/?>' = '<i className="fas fa-download $1"></i>'
    '<FontAwesomeIcon icon=\{faTrash\} className="([^"]*)" ?/?>' = '<i className="fas fa-trash $1"></i>'
    '<FontAwesomeIcon icon=\{faTimes\} className="([^"]*)" ?/?>' = '<i className="fas fa-times $1"></i>'
    '<FontAwesomeIcon icon=\{faUpload\} className="([^"]*)" ?/?>' = '<i className="fas fa-upload $1"></i>'
    '<FontAwesomeIcon icon=\{faHistory\} className="([^"]*)" ?/?>' = '<i className="fas fa-history $1"></i>'
    '<FontAwesomeIcon icon=\{faWifi\} className="([^"]*)" ?/?>' = '<i className="fas fa-wifi $1"></i>'
    '<FontAwesomeIcon icon=\{faDatabase\} className="([^"]*)" ?/?>' = '<i className="fas fa-database $1"></i>'
    '<FontAwesomeIcon icon=\{faSync\} className="([^"]*)" ?/?>' = '<i className="fas fa-sync $1"></i>'
    '<FontAwesomeIcon icon=\{faShield\} className="([^"]*)" ?/?>' = '<i className="fas fa-shield-alt $1"></i>'
    '<FontAwesomeIcon icon=\{faSearch\} className="([^"]*)" ?/?>' = '<i className="fas fa-search $1"></i>'
    
    # Without className
    '<FontAwesomeIcon icon=\{faEdit\} ?/?>' = '<i className="fas fa-edit"></i>'
    '<FontAwesomeIcon icon=\{faCopy\} ?/?>' = '<i className="fas fa-copy"></i>'
    '<FontAwesomeIcon icon=\{faDownload\} ?/?>' = '<i className="fas fa-download"></i>'
    '<FontAwesomeIcon icon=\{faTrash\} ?/?>' = '<i className="fas fa-trash"></i>'
    '<FontAwesomeIcon icon=\{faTimes\} ?/?>' = '<i className="fas fa-times"></i>'
    '<FontAwesomeIcon icon=\{faEye\} ?/?>' = '<i className="fas fa-eye"></i>'
    '<FontAwesomeIcon icon=\{faSync\} ?/?>' = '<i className="fas fa-sync"></i>'
    
    # Multi-line patterns - handle these specially
    'import \{ FontAwesomeIcon \} from ''@fortawesome/react-fontawesome'';' = ''
    'import \{[^}]+\} from ''@fortawesome/free-solid-svg-icons'';' = ''
}

Get-ChildItem "src/components/*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $originalContent = $content
    
    foreach ($pattern in $patterns.Keys) {
        $replacement = $patterns[$pattern]
        $content = $content -replace $pattern, $replacement
    }
    
    # Handle special multi-line FontAwesome patterns manually
    $content = $content -replace '<FontAwesomeIcon\s+icon=\{faSearch\}\s+className="[^"]*"\s*/>', '<i className="fas fa-search"></i>'
    $content = $content -replace '<FontAwesomeIcon\s+icon=\{faSync\}\s+className=\{[^}]+\}\s*/>', '<i className="fas fa-sync"></i>'
    
    if ($content -ne $originalContent) {
        Write-Host "Updated $($_.Name)"
        Set-Content $_.FullName -Value $content -NoNewline
    }
}
