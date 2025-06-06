// Background service worker for Amazon Review Analyzer with Gemini API integration

// Configuration
let GEMINI_API_KEY = null; // Will be loaded from storage
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Load API key from storage on startup
chrome.storage.sync.get(['geminiApiKey'], function(result) {
  if (result.geminiApiKey) {
    GEMINI_API_KEY = result.geminiApiKey;
    console.log('Gemini API key loaded from storage');
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Amazon Review Analyzer with AI installed');
});

// Check if URL is an Amazon product page
function isAmazonProductPage(url) {
  return url.includes('amazon.') &&
         (url.includes('/dp/') || url.includes('/gp/product/'));
}

// Handle badge on tab update
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (isAmazonProductPage(tab.url)) {
      chrome.action.setBadgeText({ text: '✓', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  }
});

// Gemini API integration
async function analyzeReviewsWithGemini(reviewsData) {
  if (!GEMINI_API_KEY) {
    const result = await new Promise(resolve => {
      chrome.storage.sync.get(['geminiApiKey'], resolve);
    });
    GEMINI_API_KEY = result.geminiApiKey || null;
  }

  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Please set it in the extension popup.');
  }

  const reviewTexts = reviewsData.reviews.map(review => ({
    rating: review.rating,
    text: review.text.substring(0, 500),
    verified: review.verified,
    reviewer: review.reviewer
  }));

  const prompt = `
    Analyze these Amazon product reviews for authenticity and quality. Provide insights on:
    1. Overall sentiment and authenticity
    2. Common themes and concerns
    3. Potential fake review indicators
    4. Product quality insights
    5. Reliability score (1-100)

    Reviews data:
    ${JSON.stringify(reviewTexts.slice(0, 20), null, 2)}

    Product statistics:
    - Total reviews: ${reviewsData.totalReviews}
    - Verified purchases: ${reviewsData.verifiedPercentage}%
    - 5-star percentage: ${reviewsData.ratingDistribution?.fiveStarPercentage}%

    Please provide a structured analysis in JSON format with the following structure:
    {
      "authenticity_score": number (1-100),
      "sentiment_analysis": "positive/negative/mixed",
      "key_themes": ["theme1", "theme2", "theme3"],
      "quality_insights": "brief description",
      "fake_indicators": ["indicator1", "indicator2"],
      "recommendation": "brief recommendation",
      "confidence_level": "high/medium/low"
    }
  `;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) throw new Error('No response from Gemini API');

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : parseTextResponse(aiResponse);
    } catch {
      console.warn('Failed to parse AI response as JSON, using text analysis');
      return parseTextResponse(aiResponse);
    }

  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// Fallback text response parser
function parseTextResponse(text) {
  const scoreMatch = text.match(/(?:authenticity|reliability|score)[:\s]*(\d+)/i);
  const sentiment = text.toLowerCase().includes('positive') ? 'positive' :
                   text.toLowerCase().includes('negative') ? 'negative' : 'mixed';

  return {
    authenticity_score: scoreMatch ? parseInt(scoreMatch[1]) : 70,
    sentiment_analysis: sentiment,
    key_themes: extractThemes(text),
    quality_insights: text.substring(0, 200) + '...',
    fake_indicators: extractFakeIndicators(text),
    recommendation: extractRecommendation(text),
    confidence_level: 'medium'
  };
}

function extractThemes(text) {
  const themes = [];
  const keywords = ['quality', 'price', 'shipping', 'durability', 'design', 'functionality'];
  for (const keyword of keywords) {
    if (text.toLowerCase().includes(keyword)) themes.push(keyword);
  }
  return themes.slice(0, 3);
}

function extractFakeIndicators(text) {
  const indicators = [];
  const lowerText = text.toLowerCase();
  if (lowerText.includes('generic')) indicators.push('Generic language');
  if (lowerText.includes('similar')) indicators.push('Similar reviews');
  if (lowerText.includes('suspicious')) indicators.push('Suspicious patterns');
  return indicators;
}

function extractRecommendation(text) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('recommend')) return 'Product appears to have positive reviews';
  if (lowerText.includes('caution')) return 'Exercise caution when considering this product';
  return 'Mixed signals in review analysis';
}

// Context menu
chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({
    id: "analyzeReviews",
    title: "Analyze Reviews",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyzeReviews") {
    chrome.tabs.sendMessage(tab.id, { action: "refreshAnalysis" });
  }
});

// Listen for storage API key changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.geminiApiKey) {
    GEMINI_API_KEY = changes.geminiApiKey.newValue;
    console.log('API key updated from storage');
  }
});

// Test Gemini API Key
async function testGeminiApiKey(apiKey) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }]
      })
    });
    console.log('API test response:', response);
    const ans = await response.json();
    console.log('API test response:', ans);

    return response.ok;
  } catch (error) {
    console.error('API test failed:', error);
    return false;
  }
}

// Main message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateBadge') {
    chrome.action.setBadgeText({
      text: request.score ? request.score.toString() : '?',
      tabId: sender.tab.id
    });

    let color = '#4CAF50';
    if (request.score < 60) color = '#F44336';
    else if (request.score < 80) color = '#FF9800';

    chrome.action.setBadgeBackgroundColor({
      color,
      tabId: sender.tab.id
    });

  } else if (request.action === 'analyzeWithAI') {
    analyzeReviewsWithGemini(request.data)
      .then(result => sendResponse({ success: true, analysis: result }))
      .catch(error => {
        console.error('AI analysis failed:', error);
        sendResponse({ success: false, error: error.message, fallback: true });
      });
    return true; // async response

  } else if (request.action === 'apiKeyUpdated') {
    chrome.storage.sync.get(['geminiApiKey'], function(result) {
      if (result.geminiApiKey) {
        GEMINI_API_KEY = result.geminiApiKey;
        console.log('API key updated');
      }
    });

  } else if (request.action === 'testApiKey') {
    testGeminiApiKey(request.apiKey)
      .then(result => sendResponse({ success: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // async response
  }
});
