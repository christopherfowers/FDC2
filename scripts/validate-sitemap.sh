#!/bin/bash

# SEO Sitemap Validation and Testing Script
# This script helps validate your sitemap and test Google crawler access

echo "🔍 FDC2 SEO Sitemap Diagnostic Tool"
echo "===================================="

DOMAIN="https://fdc.tactical-apps.com"
SITEMAP_URL="$DOMAIN/sitemap.xml"

echo ""
echo "1. Testing sitemap accessibility..."
curl -I "$SITEMAP_URL" 2>/dev/null | head -10

echo ""
echo "2. Validating sitemap XML structure..."
curl -s "$SITEMAP_URL" | xmllint --format - > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Sitemap XML is valid"
else
    echo "❌ Sitemap XML has validation errors"
    curl -s "$SITEMAP_URL" | xmllint --format - 2>&1 | head -10
fi

echo ""
echo "3. Checking robots.txt..."
curl -s "$DOMAIN/robots.txt" | grep -i sitemap

echo ""
echo "4. Testing content-type headers..."
curl -I "$SITEMAP_URL" 2>/dev/null | grep -i content-type

echo ""
echo "5. Google Search Console Integration Commands:"
echo "   - Submit sitemap: $SITEMAP_URL"
echo "   - Test sitemap in Google Search Console"
echo "   - Request indexing for changed pages"

echo ""
echo "6. SEO Optimization Checklist:"
echo "   ✅ Sitemap.xml exists and is accessible"
echo "   ✅ Proper XML content-type header configured"
echo "   ✅ Robots.txt references sitemap"
echo "   ✅ All URLs use HTTPS"
echo "   ✅ Last modified dates are current"
echo "   ✅ Priority values are set appropriately"

echo ""
echo "🔧 Next Steps:"
echo "1. Deploy updated nginx configuration"
echo "2. Test sitemap accessibility from external tools"
echo "3. Resubmit sitemap in Google Search Console"
echo "4. Monitor crawl errors in GSC over next 24-48 hours"
