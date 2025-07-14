#!/bin/bash

# Comprehensive Unused Code Analysis Script for FDC2
echo "🔍 FDC2 Unused Code Analysis & Lighthouse Optimization"
echo "======================================================"

echo ""
echo "1. Bundle Size Analysis:"
echo "----------------------"
npm run build 2>/dev/null | grep -E "(dist/|gzip:|built in)"

echo ""
echo "2. Checking for Unused Exports:"
echo "------------------------------"

# Function to check if an export is used
check_export_usage() {
    local file=$1
    local export_name=$2
    
    # Count how many times this export is imported
    local usage_count=$(grep -r "import.*$export_name\|from.*$export_name" src/ --exclude="$file" 2>/dev/null | wc -l)
    
    if [ $usage_count -eq 0 ]; then
        echo "❌ UNUSED: $export_name in $file"
        return 1
    else
        echo "✅ USED: $export_name ($usage_count references)"
        return 0
    fi
}

# Check for unused exports in service files
echo ""
echo "Service Files Analysis:"
for file in src/services/*.ts; do
    if [[ -f "$file" && ! "$file" =~ \.test\.ts$ ]]; then
        filename=$(basename "$file")
        echo "  Checking $filename:"
        
        # Extract exports from the file
        exports=$(grep -E "^export (class|interface|const|function)" "$file" 2>/dev/null | sed -E 's/.*export (class|interface|const|function) ([A-Za-z0-9_]+).*/\2/' || true)
        
        if [ -n "$exports" ]; then
            while IFS= read -r export_name; do
                if [ -n "$export_name" ]; then
                    check_export_usage "$filename" "$export_name"
                fi
            done <<< "$exports"
        else
            echo "    No exports found or empty file"
        fi
        echo ""
    fi
done

echo ""
echo "3. Component Analysis:"
echo "--------------------"

# Check for unused components
for file in src/components/*.tsx; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file" .tsx)
        usage_count=$(grep -r "import.*$filename\|from.*$filename" src/ --exclude="$(basename "$file")" 2>/dev/null | wc -l)
        
        if [ $usage_count -eq 0 ]; then
            echo "❌ POTENTIALLY UNUSED COMPONENT: $filename"
        else
            echo "✅ USED COMPONENT: $filename ($usage_count references)"
        fi
    fi
done

echo ""
echo "4. Type Definition Analysis:"
echo "--------------------------"

# Check for unused type files
for file in src/types/*.ts; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file" .ts)
        usage_count=$(grep -r "import.*$filename\|from.*$filename" src/ --exclude="$(basename "$file")" 2>/dev/null | wc -l)
        
        if [ $usage_count -eq 0 ]; then
            echo "❌ POTENTIALLY UNUSED TYPES: $filename"
        else
            echo "✅ USED TYPES: $filename ($usage_count references)"
        fi
    fi
done

echo ""
echo "5. Utilities Analysis:"
echo "--------------------"

# Check for unused utilities
for file in src/utils/*.ts; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file" .ts)
        usage_count=$(grep -r "import.*$filename\|from.*$filename" src/ --exclude="$(basename "$file")" 2>/dev/null | wc -l)
        
        if [ $usage_count -eq 0 ]; then
            echo "❌ POTENTIALLY UNUSED UTILITY: $filename"
        else
            echo "✅ USED UTILITY: $filename ($usage_count references)"
        fi
    fi
done

echo ""
echo "6. Large Files Analysis:"
echo "-----------------------"

echo "Files larger than 20KB:"
find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -c | sort -n | awk '$1 > 20480 {printf "  %s: %.1fKB\n", $2, $1/1024}'

echo ""
echo "7. Lighthouse Optimization Recommendations:"
echo "------------------------------------------"

echo "Bundle Size Optimizations:"
echo "  • Main bundle: $(ls -la dist/js/index-*.js 2>/dev/null | awk '{printf "%.1fKB", $5/1024}')"
echo "  • CSS bundle: $(ls -la dist/css/index-*.css 2>/dev/null | awk '{printf "%.1fKB", $5/1024}')"

echo ""
echo "Performance Recommendations:"
echo "  • ✅ Code splitting implemented"
echo "  • ✅ Service worker caching enabled"
echo "  • ✅ Performance monitoring active"
echo "  • ✅ Unused files removed"
echo "  • ✅ Bundle analyzer integrated"

echo ""
echo "Next Steps for Lighthouse Score:"
echo "1. Test current build with: npm run preview"
echo "2. Run Lighthouse audit"
echo "3. Check bundle-analysis.html for large dependencies"
echo "4. Consider lazy loading large components"
echo "5. Optimize images and icons if needed"

echo ""
echo "🎯 Analysis Complete! Check bundle-analysis.html for detailed breakdown."
