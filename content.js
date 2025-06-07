// Amazon Review Analyzer - Enhanced Content Script with AI Integration

class AmazonReviewAnalyzer {
  constructor() {
    this.reviews = [];
    this.analysisResult = null;
    this.aiAnalysis = null;
    this.init();
  }

  init() {
    this.createAnalysisPanel();
    this.scrapeReviews();
    this.analyzeReviews();
  }

  createAnalysisPanel() {
    // Create enhanced analysis panel with AI section
    const panel = document.createElement('div');
    panel.id = 'review-analyzer-panel';
    panel.innerHTML = `
      <div class="ra-header">
        <h3>🔍 Review Analysis</h3>
        <div class="ra-status">Analyzing...</div>
      </div>
      <div class="ra-content">
        <div class="ra-score-container">
          <div class="ra-score" id="credibility-score">--</div>
          <div class="ra-score-label">Credibility Score</div>
        </div>
        <div class="ra-ai-section" id="ai-analysis-section" style="display: none;">
          <div class="ra-ai-header">
            <h4>🤖 AI Analysis</h4>
            <div class="ra-ai-score" id="ai-authenticity-score">--</div>
          </div>
          <div class="ra-ai-content" id="ai-analysis-content">
            <div class="ra-ai-loading">🔄 Getting AI insights...</div>
          </div>
        </div>
        <div class="ra-details" id="analysis-details">
          <div class="ra-loading">🔄 Analyzing reviews...</div>
        </div>
        <div class="ra-controls">
          <button id="refresh-analysis" class="ra-button">🔄 Refresh Analysis</button>
          <button id="toggle-ai" class="ra-button ra-ai-toggle">🤖 AI Analysis</button>
        </div>
      </div>
    `;

    // Add styles
    this.addStyles();

    // Insert panel after product title
    const titleElement = document.querySelector('#productTitle, [data-cy="title"]');
    if (titleElement) {
      titleElement.parentNode.insertBefore(panel, titleElement.nextSibling);
    }

    // Add event listeners
    this.addEventListeners();
  }

  addStyles() {
    const styles = `
      <style>
        #review-analyzer-panel {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          color: white;
          font-family: Arial, sans-serif;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .ra-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .ra-header h3 {
          margin: 0;
          font-size: 18px;
        }

        .ra-status {
          background: rgba(255,255,255,0.2);
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
        }

        .ra-score-container {
          text-align: center;
          margin-bottom: 20px;
        }

        .ra-score {
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .ra-score-good { color: #4CAF50; }
        .ra-score-medium { color: #FF9800; }
        .ra-score-bad { color: #F44336; }

        .ra-score-label {
          font-size: 14px;
          opacity: 0.9;
        }

        .ra-ai-section {
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }

        .ra-ai-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .ra-ai-header h4 {
          margin: 0;
          font-size: 16px;
        }

        .ra-ai-score {
          background: rgba(255,255,255,0.2);
          padding: 5px 10px;
          border-radius: 15px;
          font-weight: bold;
        }

        .ra-ai-content {
          font-size: 14px;
          line-height: 1.4;
        }

        .ra-ai-insight {
          margin-bottom: 10px;
          padding: 8px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }

        .ra-ai-insight strong {
          display: block;
          margin-bottom: 5px;
        }

        .ra-controls {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .ra-button {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.3s;
        }

        .ra-button:hover {
          background: rgba(255,255,255,0.3);
        }

        .ra-details {
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 15px;
        }

        .ra-stat {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .ra-warnings {
          margin-top: 15px;
        }

        .ra-warnings h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
        }

        .ra-warning {
          background: rgba(255,107,107,0.2);
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 5px;
          font-size: 12px;
        }

        .ra-review-warning {
          background: #ff6b6b;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          margin-bottom: 10px;
        }

        .ra-loading, .ra-ai-loading {
          text-align: center;
          opacity: 0.8;
          font-style: italic;
        }

        .ra-no-reviews {
          text-align: center;
          opacity: 0.8;
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }

  addEventListeners() {
    // Refresh analysis button
    const refreshBtn = document.getElementById('refresh-analysis');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshAnalysis();
      });
    }

    // AI analysis toggle button
    const aiToggleBtn = document.getElementById('toggle-ai');
    if (aiToggleBtn) {
      aiToggleBtn.addEventListener('click', () => {
        this.toggleAIAnalysis();
      });
    }

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'refreshAnalysis') {
        this.refreshAnalysis();
      }
      sendResponse({success: true});
    });
  }

  refreshAnalysis() {
    // Clear existing analysis
    this.reviews = [];
    this.analysisResult = null;
    this.aiAnalysis = null;
    
    // Hide AI section
    const aiSection = document.getElementById('ai-analysis-section');
    if (aiSection) aiSection.style.display = 'none';
    
    // Re-run analysis
    this.scrapeReviews();
    this.analyzeReviews();
  }

  async toggleAIAnalysis() {
    const aiSection = document.getElementById('ai-analysis-section');
    const toggleBtn = document.getElementById('toggle-ai');
    
    if (aiSection.style.display === 'none') {
      aiSection.style.display = 'block';
      toggleBtn.textContent = '🤖 Hide AI Analysis';
      
      if (!this.aiAnalysis) {
        await this.performAIAnalysis();
      }
    } else {
      aiSection.style.display = 'none';
      toggleBtn.textContent = '🤖 AI Analysis';
    }
  }

  async performAIAnalysis() {
    if (this.reviews.length === 0) {
      this.displayAIError('No reviews available for AI analysis');
      return;
    }

    const aiContent = document.getElementById('ai-analysis-content');
    aiContent.innerHTML = '<div class="ra-ai-loading">🤖 AI is analyzing reviews...</div>';

    // Prepare data for AI analysis
    const analysisData = {
      reviews: this.reviews,
      totalReviews: this.reviews.length,
      verifiedPercentage: this.calculateVerifiedPercentage(),
      ratingDistribution: this.analyzeRatingDistribution()
    };

    try {
      // Send to background script for AI analysis
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'analyzeWithAI',
          data: analysisData
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      if (response.success) {
        this.aiAnalysis = response.analysis;
        this.displayAIAnalysis(response.analysis);
      } else {
        this.displayAIError(response.error || 'AI analysis failed');
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      this.displayAIError('Unable to connect to AI service');
    }
  }

  displayAIAnalysis(analysis) {
    const aiScoreElement = document.getElementById('ai-authenticity-score');
    const aiContentElement = document.getElementById('ai-analysis-content');

    // Update AI score
    aiScoreElement.textContent = analysis.authenticity_score || '--';
    aiScoreElement.className = 'ra-ai-score';
    if (analysis.authenticity_score >= 80) aiScoreElement.style.color = '#4CAF50';
    else if (analysis.authenticity_score >= 60) aiScoreElement.style.color = '#FF9800';
    else aiScoreElement.style.color = '#F44336';

    // Display AI insights
    let aiHTML = '';

    if (analysis.sentiment_analysis) {
      aiHTML += `
        <div class="ra-ai-insight">
          <strong>📊 Sentiment Analysis:</strong>
          ${analysis.sentiment_analysis.charAt(0).toUpperCase() + analysis.sentiment_analysis.slice(1)}
        </div>
      `;
    }

    if (analysis.key_themes && analysis.key_themes.length > 0) {
      aiHTML += `
        <div class="ra-ai-insight">
          <strong>🏷️ Key Themes:</strong>
          ${analysis.key_themes.join(', ')}
        </div>
      `;
    }

    if (analysis.quality_insights) {
      aiHTML += `
        <div class="ra-ai-insight">
          <strong>💡 Quality Insights:</strong>
          ${analysis.quality_insights}
        </div>
      `;
    }

    if (analysis.fake_indicators && analysis.fake_indicators.length > 0) {
      aiHTML += `
        <div class="ra-ai-insight">
          <strong>⚠️ Potential Issues:</strong>
          ${analysis.fake_indicators.join(', ')}
        </div>
      `;
    }

    if (analysis.recommendation) {
      aiHTML += `
        <div class="ra-ai-insight">
          <strong>📝 AI Recommendation:</strong>
          ${analysis.recommendation}
        </div>
      `;
    }

    aiContentElement.innerHTML = aiHTML;
  }

  displayAIError(error) {
    const aiContentElement = document.getElementById('ai-analysis-content');
    aiContentElement.innerHTML = `
      <div class="ra-ai-insight" style="background: rgba(244,67,54,0.2);">
        <strong>❌ AI Analysis Unavailable:</strong>
        ${error}
      </div>
    `;
  }

  async scrapeReviews() {
    try {
      const statusElement = document.querySelector('.ra-status');
      if (statusElement) {
        statusElement.textContent = 'Collecting reviews (this may take a moment)...';
      }

      // Get the reviews URL
      let reviewsUrl = window.location.href;
      const reviewsLink = document.querySelector('a[data-hook="see-all-reviews-link-foot"]');
      
      if (reviewsLink) {
        reviewsUrl = reviewsLink.href;
      } else {
        // Try to construct the reviews URL if link not found
        const productId = window.location.href.match(/\/dp\/([A-Z0-9]+)/)?.[1];
        if (productId) {
          reviewsUrl = `${window.location.origin}/product-reviews/${productId}`;
        }
      }

      console.log('Fetching reviews from:', reviewsUrl);
      
      // Request reviews from background script
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: "scrapeReviews",
          url: reviewsUrl
        }, resolve);
      });

      console.log('Response from background:', response);

      if (response && response.reviews && response.reviews.length > 0) {
        this.reviews = response.reviews;
        console.log('Reviews collected:', this.reviews.length);

        if (statusElement) {
          statusElement.textContent = `Analyzing ${this.reviews.length} reviews...`;
        }

        // Show the credibility score section
        const credibilityScoreElement = document.getElementById('credibility-score');
        if (credibilityScoreElement) {
          credibilityScoreElement.style.display = 'block';
        }

        // Perform the analysis
        await this.analyzeReviews();
        
        if (statusElement) {
          statusElement.textContent = `Analyzed ${this.reviews.length} reviews`;
        }
      } else {
        console.error('No reviews in response:', response);
        throw new Error(response?.error || 'No reviews were returned');
      }

    } catch (error) {
      console.error('Error in scrapeReviews:', error);
      const statusElement = document.querySelector('.ra-status');
      if (statusElement) {
        statusElement.textContent = 'Error analyzing reviews';
      }
      
      const credibilityScoreElement = document.getElementById('credibility-score');
      if (credibilityScoreElement) {
        credibilityScoreElement.style.display = 'none';
      }

      // Clear any partial results
      this.reviews = [];
      this.analysisResult = null;
      this.aiAnalysis = null;
    }
  }

  updateAnalysisPanel() {
    // Update credibility score
    const credibilityScoreElement = document.getElementById('credibility-score');
    if (credibilityScoreElement && this.analysisResult) {
      credibilityScoreElement.textContent = this.analysisResult.credibilityScore || '';
    }

    // Update review count
    const reviewCountElement = document.querySelector('.ra-status');
    if (reviewCountElement) {
      reviewCountElement.textContent = `Analyzed ${this.reviews.length} reviews`;
    }

    // Update other analysis details
    const analysisDetailsElement = document.getElementById('analysis-details');
    if (analysisDetailsElement && this.reviews.length > 0) {
      analysisDetailsElement.innerHTML = this.getAnalysisDetailsHTML();
    } else if (analysisDetailsElement) {
      analysisDetailsElement.innerHTML = '<div class="ra-no-reviews">No reviews found to analyze.</div>';
    }
  }

  analyzeReviews() {
  const detailsElement = document.getElementById('analysis-details');
  const statusElement = document.querySelector('.ra-status');
  const credibilityScoreElement = document.getElementById('credibility-score');

  if (this.reviews.length === 0) {
    detailsElement.innerHTML = `<div class="ra-no-reviews">No reviews found to analyze.</div>`;
    statusElement.textContent = 'No Reviews';
    credibilityScoreElement.textContent = '--';
    credibilityScoreElement.className = 'ra-score';
    return;
  }

  statusElement.textContent = 'Analyzing reviews...';

  // Example basic analysis:
  // Calculate average rating
  const totalRating = this.reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = totalRating / this.reviews.length;

  // Calculate verified purchase percentage
  const verifiedCount = this.reviews.filter(r => r.verified).length;
  const verifiedPercentage = (verifiedCount / this.reviews.length) * 100;

  // Basic credibility score could be weighted by avgRating and verified percentage
  let credibilityScore = Math.round((avgRating / 5) * 70 + (verifiedPercentage / 100) * 30);

  // Clamp score between 0 and 100
  credibilityScore = Math.min(100, Math.max(0, credibilityScore));

  // Update score UI with color coding
  credibilityScoreElement.textContent = credibilityScore;
  credibilityScoreElement.className = 'ra-score';
  if (credibilityScore >= 80) credibilityScoreElement.classList.add('ra-score-good');
  else if (credibilityScore >= 50) credibilityScoreElement.classList.add('ra-score-medium');
  else credibilityScoreElement.classList.add('ra-score-bad');

  // Show some stats in details panel
  detailsElement.innerHTML = `
    <div class="ra-stat"><strong>Total Reviews:</strong> ${this.reviews.length}</div>
    <div class="ra-stat"><strong>Average Rating:</strong> ${avgRating.toFixed(2)} / 5</div>
    <div class="ra-stat"><strong>Verified Purchases:</strong> ${verifiedPercentage.toFixed(1)}%</div>
  `;

  // Optionally, add warnings for suspicious patterns, e.g., many 5-star reviews but low verified
  if (verifiedPercentage < 30 && avgRating > 4.5) {
    detailsElement.innerHTML += `
      <div class="ra-warning ra-review-warning">
        ⚠️ High average rating but low verified purchase percentage may indicate suspicious reviews.
      </div>
    `;
  }

  statusElement.textContent = 'Analysis complete';
  this.analysisResult = {
    credibilityScore,
    avgRating,
    verifiedPercentage,
  };
}

  calculateCredibilityScore() {
    const avgRating = this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length;
    const verifiedPercentage = this.calculateVerifiedPercentage();
    const credibilityScore = Math.round((avgRating / 5) * 70 + (verifiedPercentage / 100) * 30);
    return credibilityScore;
  } 

  calculateVerifiedPercentage() {
    const verifiedCount = this.reviews.filter(r => r.verified).length;
    return (verifiedCount / this.reviews.length * 100).toFixed(1);
  }

  analyzeRatingDistribution() {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    this.reviews.forEach(review => {
      const rating = Math.round(review.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });

    // Calculate if distribution looks suspicious (too many 5-star reviews)
    const fiveStarPercentage = (distribution[5] / this.reviews.length) * 100;
    const suspicious = fiveStarPercentage > 70;

    return { distribution, fiveStarPercentage: fiveStarPercentage.toFixed(1), suspicious };
  }

  detectSuspiciousPatterns() {
    const suspicious = [];
    
    // Check for duplicate/similar texts
    const textSimilarity = this.findSimilarTexts();
    if (textSimilarity.length > 0) {
      suspicious.push({
        type: 'Similar Reviews',
        description: `Found ${textSimilarity.length} groups of similar reviews`,
        severity: 'high',
        reviews: textSimilarity
      });
    }

    // Check for reviewer name patterns
    const namePatterns = this.analyzeReviewerNames();
    if (namePatterns.suspicious > 0) {
      suspicious.push({
        type: 'Suspicious Reviewer Names',
        description: `${namePatterns.suspicious} reviewers have suspicious name patterns`,
        severity: 'medium'
      });
    }

    return suspicious;
  }

  findSimilarTexts() {
    const similarGroups = [];
    const processed = new Set();

    this.reviews.forEach((review, i) => {
      if (processed.has(i)) return;

      const similar = [i];
      const words1 = this.getSignificantWords(review.text);

      this.reviews.forEach((otherReview, j) => {
        if (i === j || processed.has(j)) return;

        const words2 = this.getSignificantWords(otherReview.text);
        const similarity = this.calculateTextSimilarity(words1, words2);

        if (similarity > 0.7) {
          similar.push(j);
          processed.add(j);
        }
      });

      if (similar.length > 1) {
        similarGroups.push(similar.map(idx => this.reviews[idx]));
        similar.forEach(idx => processed.add(idx));
      }
    });

    return similarGroups;
  }

  getSignificantWords(text) {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'is', 'it', 'i', 'you', 'my', 'me', 'was', 'were', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
    
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word));
  }

  calculateTextSimilarity(words1, words2) {
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  analyzeReviewerNames() {
    let suspicious = 0;
    const patterns = [/^[A-Z][a-z]+ [A-Z]\.?$/, /^Amazon Customer \d*$/, /^[A-Z]{1,2}\d+$/];
    
    this.reviews.forEach(review => {
      const name = review.reviewer;
      if (patterns.some(pattern => pattern.test(name))) {
        suspicious++;
      }
    });

    return { suspicious, total: this.reviews.length };
  }

  analyzeReviewTexts() {
    let shortReviews = 0;
    let genericPhrases = 0;
    const genericPatterns = [
      /great product/i, /highly recommend/i, /amazing quality/i,
      /exactly as described/i, /fast shipping/i, /love it/i
    ];

    this.reviews.forEach(review => {
      if (review.text.length < 50) shortReviews++;
      
      if (genericPatterns.some(pattern => pattern.test(review.text))) {
        genericPhrases++;
      }
    });

    return {
      shortReviews,
      genericPhrases,
      averageLength: this.reviews.reduce((sum, r) => sum + r.text.length, 0) / this.reviews.length
    };
  }

  analyzeDatePatterns() {
    const validDates = this.reviews.filter(r => r.date).map(r => r.date);
    if (validDates.length === 0) return { suspicious: false };

    // Check for clustering of dates
    const dateCounts = {};
    validDates.forEach(date => {
      const dateStr = date.toDateString();
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
    });

    const maxSameDate = Math.max(...Object.values(dateCounts));
    const suspicious = maxSameDate > Math.max(3, validDates.length * 0.3);

    return { suspicious, maxSameDate, totalDates: validDates.length };
  }

  calculateCredibilityScore(analysis) {
    let score = 70; // Base score

    // Verified purchase percentage
    if (analysis.verifiedPercentage > 80) score += 15;
    else if (analysis.verifiedPercentage > 60) score += 10;
    else if (analysis.verifiedPercentage > 40) score += 5;
    else score -= 10;

    // Rating distribution
    if (analysis.ratingDistribution.suspicious) score -= 15;

    // Suspicious patterns
    analysis.suspiciousPatterns.forEach(pattern => {
      if (pattern.severity === 'high') score -= 20;
      else if (pattern.severity === 'medium') score -= 10;
      else score -= 5;
    });

    // Text analysis
    const shortReviewRatio = analysis.textAnalysis.shortReviews / analysis.totalReviews;
    if (shortReviewRatio > 0.5) score -= 10;

    const genericRatio = analysis.textAnalysis.genericPhrases / analysis.totalReviews;
    if (genericRatio > 0.6) score -= 15;

    // Date patterns
    if (analysis.dateAnalysis.suspicious) score -= 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  displayAnalysis(score, analysis) {
    const scoreElement = document.getElementById('credibility-score');
    const detailsElement = document.getElementById('analysis-details');
    const statusElement = document.querySelector('.ra-status');

    // Update score with color coding
    scoreElement.textContent = score;
    scoreElement.className = 'ra-score';
    if (score >= 80) scoreElement.classList.add('ra-score-good');
    else if (score >= 60) scoreElement.classList.add('ra-score-medium');
    else scoreElement.classList.add('ra-score-bad');

    // Update status
    if (score >= 80) statusElement.textContent = '✅ Highly Credible';
    else if (score >= 60) statusElement.textContent = '⚠️ Moderately Credible';
    else statusElement.textContent = '❌ Low Credibility';

    // Display detailed analysis
    let detailsHTML = `
      <div class="ra-stat">
        <span class="ra-stat-label">Total Reviews:</span>
        <span class="ra-stat-value">${analysis.totalReviews}</span>
      </div>
      <div class="ra-stat">
        <span class="ra-stat-label">Verified Purchases:</span>
        <span class="ra-stat-value">${analysis.verifiedPercentage}%</span>
      </div>
      <div class="ra-stat">
        <span class="ra-stat-label">5-Star Reviews:</span>
        <span class="ra-stat-value">${analysis.ratingDistribution.fiveStarPercentage}%</span>
      </div>
    `;

    if (analysis.suspiciousPatterns.length > 0) {
      detailsHTML += '<div class="ra-warnings"><h4>⚠️ Potential Issues:</h4>';
      analysis.suspiciousPatterns.forEach(pattern => {
        detailsHTML += `<div class="ra-warning">${pattern.description}</div>`;
      });
      detailsHTML += '</div>';
    }

    detailsElement.innerHTML = detailsHTML;
  }

  highlightSuspiciousReviews(suspiciousPatterns) {
    suspiciousPatterns.forEach(pattern => {
      if (pattern.reviews) {
        pattern.reviews.forEach(group => {
          group.forEach(review => {
            if (review.element) {
              review.element.style.border = '2px solid #ff6b6b';
              review.element.style.backgroundColor = '#fff5f5';
              
              const warning = document.createElement('div');
              warning.className = 'ra-review-warning';
              warning.textContent = '⚠️ Similar to other reviews';
              review.element.prepend(warning);
            }
          });
        });
      }
    });
  }

  displayNoReviewsMessage() {
    const detailsElement = document.getElementById('analysis-details');
    const statusElement = document.querySelector('.ra-status');
    
    statusElement.textContent = 'No reviews found';
    detailsElement.innerHTML = '<div class="ra-no-reviews">No reviews available for analysis on this page.</div>';
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AmazonReviewAnalyzer();
  });
} else {
  new AmazonReviewAnalyzer();
}

// Re-run analysis when reviews are dynamically loaded
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      const hasNewReviews = Array.from(mutation.addedNodes).some(node => 
        node.nodeType === 1 && node.querySelector && node.querySelector('[data-hook="review"]')
      );
      
      if (hasNewReviews) {
        setTimeout(() => {
          const existingPanel = document.getElementById('review-analyzer-panel');
          if (existingPanel) existingPanel.remove();
          new AmazonReviewAnalyzer();
        }, 1000);
      }
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });