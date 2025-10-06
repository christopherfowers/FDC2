# Terrain Elevation - Quick Reference Card

## 🏔️ What is Terrain Elevation?

Terrain elevation corrects your firing solution when the gun and target are at different heights. Without this correction, rounds may fall short (uphill) or overshoot (downhill).

## ⚡ Quick Start

### Option 1: Flat Terrain (Default)
**Leave elevation fields blank** - System assumes flat terrain

### Option 2: With Elevation
1. Enter gun elevation in meters (Step 1)
2. Enter target elevation in meters (Step 3)
3. System automatically calculates correction

## 📊 When to Use Elevation

### ✅ USE IT WHEN:
- Mountain/hill warfare
- Coastal to inland firing
- Height difference > 50m
- You know the altitudes
- Accuracy is critical

### ❌ SKIP IT WHEN:
- Flat terrain
- Unknown elevations
- Height difference < 50m
- Quick estimate needed

## 🎯 How It Works

```
Uphill Target   → Add mils to elevation
Downhill Target → Subtract mils from elevation
```

### Example Corrections

| Height Diff | Distance | Correction |
|-------------|----------|------------|
| +100m       | 1000m    | +64 mils   |
| +200m       | 1500m    | +76 mils   |
| +300m       | 2000m    | +95 mils   |
| -100m       | 1000m    | -64 mils   |
| -200m       | 1500m    | -76 mils   |

## 💡 Pro Tips

### Tip 1: Estimate Unknown Elevations
- Use map contour lines
- 1 contour line ≈ 10-20m typically
- GPS altitude if available
- Better to guess than ignore

### Tip 2: Height Difference Matters Most
- Absolute elevations less critical
- Difference between gun/target is key
- ±10m error usually acceptable

### Tip 3: Check the Reasoning
- Look for "Terrain elevation correction" message
- Shows calculated correction in mils
- Verifies system applied correction

### Tip 4: Extreme Slopes
- >45° slopes: Consider high-angle fire
- Very steep: May need manual adjustment
- System accurate up to 60° slopes

## 🚀 Quick Commands

```bash
# Start the app
npm run

# Build for production
npm run build

# Run tests
npm test
```

## 📱 Where to Find It

**Fire Mission Calculator:**
- Gun Elevation: Next to Mortar Position (Step 1)
- Target Elevation: Next to Target Grid (Step 3)
- Both fields optional
- Units in meters above sea level

## 🔢 Elevation Entry

### Valid Range:
- **-500m** to **9000m**
- Negative = below sea level
- Positive = above sea level

### Examples:
```
Sea level:        0
Valley floor:     150
Hill:            500
Mountain:        1500
High mountain:   3000
```

## ⚠️ Common Mistakes

### ❌ WRONG:
- Entering feet instead of meters
- Using height above ground (AGL)
- Ignoring negative elevations
- Swapping gun/target elevations

### ✅ RIGHT:
- Always use meters
- Use altitude (MSL - mean sea level)
- Negative OK for below sea level
- Gun elevation in Step 1, Target in Step 3

## 🎓 Understanding the Math

### Simple Version:
```
Correction = Height Difference ÷ Distance × 1000
           × 1.12 (convert to mils)
```

### Accurate Version:
```
Correction = atan2(heightDiff, distance) 
           × 6400 ÷ 2π
```

System uses the accurate version!

## 📈 Accuracy

### Very Accurate (< 1% error):
- Height differences 0-1000m
- Distances 100-9000m
- Slopes up to 45°

### Good Accuracy (< 5% error):
- Height differences 1000-2000m
- Very steep slopes 45-60°
- Extreme distances

### Not Accurate:
- Extreme altitudes (>3000m difference)
- Near-vertical fire (>70° slopes)
- Ultra-long range (>10km)

## 🔍 Troubleshooting

### "No elevation correction shown"
→ Make sure BOTH elevations are entered

### "Correction seems too large"
→ Check you used meters, not feet
→ Verify height difference is correct

### "Rounds still missing"
→ Elevation is ONE factor
→ Check azimuth, charge, range too
→ Wind/weather not modeled

## 📚 Learn More

- `ELEVATION_SUPPORT.md` - Technical details
- `ELEVATION_IMPLEMENTATION.md` - Implementation info
- Test with `node test-elevation.js`

## 💪 Advanced Features

### Coming Soon:
- Atmospheric corrections
- Elevation templates
- Profile visualization
- Multi-target elevation

### Already Here:
- FO adjustments work with elevation
- Multi-gun calculations support elevation
- Mission history saves elevations
- Offline mode includes elevation

---

**Remember:** When in doubt, enter your best estimate. Elevation correction is better than no correction!

**Quick Help:** Click the ⓘ icon next to elevation fields for detailed help.
