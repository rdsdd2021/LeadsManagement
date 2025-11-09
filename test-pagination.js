// Quick test to verify pagination is working correctly
// Run this with: node test-pagination.js

const testPagination = async () => {
  console.log('🧪 Testing filter-counts API...\n')
  
  try {
    const response = await fetch('http://localhost:3000/api/filter-counts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school: [],
        district: [],
        gender: [],
        stream: [],
        searchQuery: '',
        dateRange: {},
        customFilters: {},
      })
    })
    
    const data = await response.json()
    
    console.log('📊 Results:')
    console.log(`  Schools: ${Object.keys(data.school).length} unique values`)
    console.log(`  Districts: ${Object.keys(data.district).length} unique values`)
    console.log(`  Genders: ${Object.keys(data.gender).length} unique values`)
    console.log(`  Streams: ${Object.keys(data.stream).length} unique values`)
    console.log(`  Custom Fields: ${Object.keys(data.customFields).length} fields`)
    
    console.log('\n✅ Test complete! Check the server logs for pagination details.')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testPagination()
