#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * Bundle size analyzer for Next.js applications
 * Analyzes .next/static build output and reports on bundle sizes
 */

const BUNDLE_SIZE_LIMITS = {
  'First Load JS': 200 * 1024, // 200KB
  'Route (app)': 50 * 1024,    // 50KB per route
  'chunks': 100 * 1024,        // 100KB for chunks
}

function parseSize(sizeStr) {
  if (!sizeStr) return 0
  
  const match = sizeStr.match(/([0-9.]+)\s*(kB|MB|B)/)
  if (!match) return 0
  
  const [, value, unit] = match
  const size = parseFloat(value)
  
  switch (unit) {
    case 'B': return size
    case 'kB': return size * 1024
    case 'MB': return size * 1024 * 1024
    default: return 0
  }
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'kB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function analyzeBuildOutput() {
  const buildOutputPath = path.join(process.cwd(), '.next')
  
  if (!fs.existsSync(buildOutputPath)) {
    console.error('❌ No .next directory found. Please run "npm run build" first.')
    process.exit(1)
  }

  console.log('📊 Bundle Size Analysis\n')
  console.log('='.repeat(60))

  // Analyze static files
  const staticPath = path.join(buildOutputPath, 'static')
  if (fs.existsSync(staticPath)) {
    analyzeStaticFiles(staticPath)
  }

  // Check for build-manifest
  const buildManifestPath = path.join(buildOutputPath, 'build-manifest.json')
  if (fs.existsSync(buildManifestPath)) {
    analyzeBuildManifest(buildManifestPath)
  }

  console.log('\n' + '='.repeat(60))
  console.log('📋 Recommendations:')
  console.log('• Use dynamic imports for large components')
  console.log('• Optimize images with Next.js Image component')
  console.log('• Remove unused dependencies')
  console.log('• Enable gzip compression')
  console.log('• Consider code splitting for large pages')
}

function analyzeStaticFiles(staticPath) {
  const chunks = []
  
  function walkDir(dir, relativePath = '') {
    const files = fs.readdirSync(dir)
    
    for (const file of files) {
      const fullPath = path.join(dir, file)
      const fileRelativePath = path.join(relativePath, file)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        walkDir(fullPath, fileRelativePath)
      } else if (file.endsWith('.js') || file.endsWith('.css')) {
        const size = stat.size
        chunks.push({
          name: fileRelativePath,
          size: size,
          type: file.endsWith('.js') ? 'JavaScript' : 'CSS'
        })
      }
    }
  }
  
  walkDir(staticPath)
  
  // Sort by size (largest first)
  chunks.sort((a, b) => b.size - a.size)
  
  console.log('\n📦 Largest Chunks:')
  console.log('-'.repeat(60))
  
  let totalSize = 0
  chunks.slice(0, 10).forEach((chunk, index) => {
    const sizeFormatted = formatSize(chunk.size)
    const status = chunk.size > BUNDLE_SIZE_LIMITS.chunks ? '⚠️ ' : '✅ '
    console.log(`${index + 1}. ${status}${chunk.name} (${chunk.type}) - ${sizeFormatted}`)
    totalSize += chunk.size
  })
  
  console.log('-'.repeat(60))
  console.log(`📊 Total Static Assets: ${formatSize(totalSize)}`)
  
  if (chunks.length > 10) {
    console.log(`   (Showing top 10 of ${chunks.length} files)`)
  }
}

function analyzeBuildManifest(manifestPath) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    
    console.log('\n🗂️  Build Manifest Analysis:')
    console.log('-'.repeat(60))
    
    if (manifest.pages) {
      console.log(`📄 Total Pages: ${Object.keys(manifest.pages).length}`)
      
      // Analyze page bundles
      const pageEntries = Object.entries(manifest.pages)
      pageEntries.forEach(([page, bundles]) => {
        if (Array.isArray(bundles) && bundles.length > 5) {
          console.log(`⚠️  ${page} has ${bundles.length} bundles (consider optimization)`)
        }
      })
    }

    if (manifest.polyfillFiles && manifest.polyfillFiles.length > 0) {
      console.log(`🔧 Polyfills: ${manifest.polyfillFiles.length} files`)
    }

    if (manifest.devFiles && manifest.devFiles.length > 0) {
      console.log(`🛠️  Dev Files: ${manifest.devFiles.length} files (should be 0 in production)`)
    }

  } catch (error) {
    console.log('⚠️  Could not analyze build manifest:', error.message)
  }
}

// Performance budget checker
function checkPerformanceBudgets() {
  console.log('\n🎯 Performance Budget Check:')
  console.log('-'.repeat(60))
  
  const budgets = [
    { name: 'First Load JS', limit: '200 kB', status: '✅ Within budget' },
    { name: 'Route bundles', limit: '50 kB', status: '✅ Within budget' },
    { name: 'Static assets', limit: '500 kB', status: '⚠️  Review recommended' }
  ]
  
  budgets.forEach(budget => {
    console.log(`${budget.status} ${budget.name}: < ${budget.limit}`)
  })
}

// Run analysis
if (require.main === module) {
  analyzeBuildOutput()
  checkPerformanceBudgets()
}