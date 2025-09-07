// 🔍 BROWSER CONSOLE DEBUG SCRIPT
// Copy and paste this into your browser console on both local and production

console.log('🔍 Starting Recipe Extractor Debug...');

async function debugRecipeExtractor() {
  const results = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    environment: window.location.hostname.includes('localhost') ? 'LOCAL' : 'PRODUCTION',
    tests: {}
  };

  console.log(`🌍 Environment: ${results.environment}`);
  console.log(`📍 URL: ${results.url}`);

  // Test 1: Check if debug API exists
  try {
    console.log('\n📡 Test 1: Calling debug API...');
    const debugResponse = await fetch('/api/debug');
    const debugData = await debugResponse.json();
    
    results.tests.debugAPI = {
      success: debugResponse.ok,
      status: debugResponse.status,
      data: debugData
    };
    
    if (debugResponse.ok) {
      console.log('✅ Debug API Success!');
      console.log(`📊 Recipe Count: ${debugData.recipes?.count || 0}`);
      console.log(`⏱️ Query Time: ${debugData.queryTimeMs}ms`);
      console.log(`🗄️ Database: ${debugData.database?.url}`);
      
      if (debugData.recipes?.details) {
        console.log('\n📋 Recipes found:');
        debugData.recipes.details.forEach(recipe => {
          console.log(`  ${recipe.index}. ${recipe.title} (${recipe.sourceType}) - ${recipe.createdAt}`);
        });
      }
    } else {
      console.log('❌ Debug API Failed:', debugData);
    }
  } catch (error) {
    console.log('❌ Debug API Error:', error.message);
    results.tests.debugAPI = {
      success: false,
      error: error.message
    };
  }

  // Test 2: Check history page content
  try {
    console.log('\n📡 Test 2: Checking history page...');
    const historyResponse = await fetch('/history');
    const historyHTML = await historyResponse.text();
    
    // Extract recipe count from history page
    const recipeCountMatch = historyHTML.match(/(\d+)\s+recipes?\s+extracted/);
    const historyRecipeCount = recipeCountMatch ? parseInt(recipeCountMatch[1]) : 0;
    
    results.tests.historyPage = {
      success: historyResponse.ok,
      status: historyResponse.status,
      recipeCount: historyRecipeCount,
      hasRecipeGrid: historyHTML.includes('Recipe Grid'),
      hasEmptyState: historyHTML.includes('No recipes yet')
    };
    
    console.log(`✅ History Page - Recipe Count: ${historyRecipeCount}`);
    console.log(`📋 Has Recipe Grid: ${results.tests.historyPage.hasRecipeGrid}`);
    console.log(`🚫 Has Empty State: ${results.tests.historyPage.hasEmptyState}`);
    
  } catch (error) {
    console.log('❌ History Page Error:', error.message);
    results.tests.historyPage = {
      success: false,
      error: error.message
    };
  }

  // Test 3: Check if we can access a specific recipe
  if (results.tests.debugAPI?.success && results.tests.debugAPI.data?.recipes?.details?.length > 0) {
    try {
      console.log('\n📡 Test 3: Testing recipe access...');
      const firstRecipe = results.tests.debugAPI.data.recipes.details[0];
      const recipeResponse = await fetch(`/recipes/${firstRecipe.id}`);
      
      results.tests.recipeAccess = {
        success: recipeResponse.ok,
        status: recipeResponse.status,
        recipeId: firstRecipe.id,
        recipeTitle: firstRecipe.title
      };
      
      console.log(`✅ Recipe Access - ${firstRecipe.title}: ${recipeResponse.status}`);
      
    } catch (error) {
      console.log('❌ Recipe Access Error:', error.message);
      results.tests.recipeAccess = {
        success: false,
        error: error.message
      };
    }
  }

  // Summary
  console.log('\n📊 SUMMARY:');
  console.log('='.repeat(50));
  console.log(`Environment: ${results.environment}`);
  console.log(`Debug API: ${results.tests.debugAPI?.success ? '✅' : '❌'} (${results.tests.debugAPI?.data?.recipes?.count || 0} recipes)`);
  console.log(`History Page: ${results.tests.historyPage?.success ? '✅' : '❌'} (${results.tests.historyPage?.recipeCount || 0} recipes)`);
  console.log(`Recipe Access: ${results.tests.recipeAccess?.success ? '✅' : '❌'}`);
  
  // Check for discrepancies
  const debugCount = results.tests.debugAPI?.data?.recipes?.count || 0;
  const historyCount = results.tests.historyPage?.recipeCount || 0;
  
  if (debugCount !== historyCount) {
    console.log('\n⚠️  DISCREPANCY DETECTED!');
    console.log(`Debug API shows ${debugCount} recipes, but History page shows ${historyCount} recipes`);
    console.log('This suggests a caching or rendering issue.');
  } else if (debugCount === 0) {
    console.log('\n🚫 NO RECIPES FOUND');
    console.log('Either the database is empty or there\'s a connection issue.');
  } else {
    console.log('\n✅ COUNTS MATCH');
    console.log('Debug API and History page show the same number of recipes.');
  }

  console.log('\n📋 Full Results Object:');
  console.log(results);
  
  return results;
}

// Run the debug function
debugRecipeExtractor().then(results => {
  console.log('\n🎉 Debug complete! Results stored in window.debugResults');
  window.debugResults = results;
}).catch(error => {
  console.error('💥 Debug failed:', error);
});
