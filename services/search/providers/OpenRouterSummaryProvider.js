/**
 * OpenRouter AI Summary Provider
 * Uses OpenRouter API with Qwen model for intelligent analysis
 */

const axios = require('axios');
const logger = require('../../../utils/logger');

class OpenRouterSummaryProvider {
  constructor() {
    this.name = 'OpenRouterSummaryProvider';
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.model = 'meta-llama/llama-3.3-70b-instruct';
    
    if (!this.apiKey) {
      logger.warn('OpenRouter API key not configured');
      this.enabled = false;
    } else {
      this.enabled = true;
      logger.info('OpenRouter initialized', { model: this.model });
    }
  }

  /**
   * Generate AI summary from search results
   * @param {Object} data - Combined search results
   * @returns {Promise<Object>} AI-generated summary
   */
  async generateSummary(data) {
    if (!this.enabled) {
      return this.getDefaultSummary(data);
    }

    try {
      const prompt = this.buildPrompt(data);
      
      logger.info('OpenRouter AI summary generation', { 
        profilesCount: data.profiles?.length || 0,
        imagesCount: data.imageMatches?.length || 0
      });

      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a trust intelligence analyst. Analyze search results and provide structured risk assessment. Be concise and factual. CRITICAL: Return ONLY valid JSON. No markdown code blocks. No explanations. No extra text. Just pure JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://deeptrust.app',
            'X-Title': 'DeepTrust Intelligence'
          },
          timeout: 30000
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      const summary = this.parseAIResponse(aiResponse, data);
      
      logger.info('AI summary generated', { 
        confidence: summary.identityConfidence 
      });

      return summary;

    } catch (error) {
      logger.error('OpenRouter API error', { 
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data ? JSON.stringify(error.response.data).substring(0, 200) : 'N/A',
        model: this.model
      });
      
      return this.getDefaultSummary(data);
    }
  }

  /**
   * Build prompt for AI analysis
   * @param {Object} data - Search results
   * @returns {string} Prompt text
   */
  buildPrompt(data) {
    const { profiles = [], imageMatches = [], labels = [], searchQuery } = data;
    
    let prompt = `Analyze this person's digital footprint and provide a trust assessment.\n\n`;
    
    // Search query
    if (searchQuery) {
      prompt += `SEARCH QUERY:\n`;
      if (searchQuery.name) prompt += `Name: ${searchQuery.name}\n`;
      if (searchQuery.username) prompt += `Username: ${searchQuery.username}\n`;
      prompt += `\n`;
    }
    
    // Profiles found
    if (profiles.length > 0) {
      prompt += `PROFILES FOUND (${profiles.length}):\n`;
      profiles.slice(0, 10).forEach((profile, i) => {
        prompt += `${i + 1}. ${profile.platform}: ${profile.displayName} (@${profile.username})\n`;
        if (profile.bio) prompt += `   Bio: ${profile.bio.substring(0, 100)}\n`;
        if (profile.location) prompt += `   Location: ${profile.location}\n`;
        prompt += `   Verified: ${profile.isVerified ? 'Yes' : 'No'}\n`;
      });
      prompt += `\n`;
    }
    
    // Image matches
    if (imageMatches.length > 0) {
      prompt += `IMAGE MATCHES (${imageMatches.length}):\n`;
      const platforms = [...new Set(imageMatches.map(m => m.source))];
      prompt += `Found on: ${platforms.join(', ')}\n`;
      prompt += `Match types: ${[...new Set(imageMatches.map(m => m.matchType))].join(', ')}\n\n`;
    }
    
    // Labels
    if (labels.length > 0) {
      prompt += `IMAGE LABELS:\n`;
      labels.slice(0, 5).forEach(label => {
        prompt += `- ${label.description} (${label.score}%)\n`;
      });
      prompt += `\n`;
    }
    
    prompt += `Provide analysis in this EXACT JSON format (no markdown, no extra text):\n`;
    prompt += `{\n`;
    prompt += `  "identityConfidence": <number 0-100>,\n`;
    prompt += `  "riskLevel": "<low|medium|high|critical>",\n`;
    prompt += `  "riskFlags": [<array of risk indicators>],\n`;
    prompt += `  "summary": "<2-3 sentence summary>",\n`;
    prompt += `  "platformsFound": [<array of platforms>],\n`;
    prompt += `  "duplicateImageRisk": <boolean>,\n`;
    prompt += `  "recommendations": [<array of 2-3 recommendations>]\n`;
    prompt += `}`;
    
    return prompt;
  }

  /**
   * Parse AI response
   * @param {string} aiResponse - Raw AI response
   * @param {Object} data - Original data for fallback
   * @returns {Object} Parsed summary
   */
  parseAIResponse(aiResponse, data) {
    try {
      // Try to extract JSON from response
      let jsonStr = aiResponse.trim();
      
      // Remove markdown code blocks if present (```json or ```)
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Remove any leading/trailing non-JSON text
      jsonStr = jsonStr.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      
      // Find JSON object (greedy match for nested objects)
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      const parsed = JSON.parse(jsonStr);
      
      // Validate and normalize
      return {
        identityConfidence: this.normalizeConfidence(parsed.identityConfidence),
        riskLevel: this.normalizeRiskLevel(parsed.riskLevel),
        riskFlags: Array.isArray(parsed.riskFlags) ? parsed.riskFlags : [],
        summary: parsed.summary || this.generateDefaultSummary(data),
        platformsFound: Array.isArray(parsed.platformsFound) 
          ? parsed.platformsFound 
          : this.extractPlatforms(data),
        duplicateImageRisk: Boolean(parsed.duplicateImageRisk),
        recommendations: Array.isArray(parsed.recommendations) 
          ? parsed.recommendations 
          : []
      };
      
    } catch (error) {
      logger.warn('Failed to parse AI response, using default', { error: error.message });
      return this.getDefaultSummary(data);
    }
  }

  /**
   * Get default summary when AI fails
   * @param {Object} data - Search results
   * @returns {Object} Default summary
   */
  getDefaultSummary(data) {
    const { profiles = [], imageMatches = [] } = data;
    
    const platformsFound = this.extractPlatforms(data);
    const identityConfidence = this.calculateDefaultConfidence(data);
    const riskFlags = this.generateDefaultRiskFlags(data);
    
    return {
      identityConfidence,
      riskLevel: this.calculateRiskLevel(identityConfidence, riskFlags),
      riskFlags,
      summary: this.generateDefaultSummary(data),
      platformsFound,
      duplicateImageRisk: imageMatches.length > 3,
      recommendations: this.generateDefaultRecommendations(data)
    };
  }

  /**
   * Extract platforms from data
   * @param {Object} data - Search results
   * @returns {Array} Platform names
   */
  extractPlatforms(data) {
    const platforms = new Set();
    
    if (data.profiles) {
      data.profiles.forEach(p => platforms.add(p.platform));
    }
    
    if (data.imageMatches) {
      data.imageMatches.forEach(m => platforms.add(m.source));
    }
    
    return Array.from(platforms);
  }

  /**
   * Calculate default confidence
   * @param {Object} data - Search results
   * @returns {number} Confidence score
   */
  calculateDefaultConfidence(data) {
    const { profiles = [], imageMatches = [] } = data;
    
    let score = 30; // Base score
    
    // Profiles boost
    if (profiles.length > 0) score += 20;
    if (profiles.length >= 3) score += 15;
    if (profiles.length >= 5) score += 10;
    
    // Verified accounts
    const verifiedCount = profiles.filter(p => p.isVerified).length;
    score += verifiedCount * 10;
    
    // Image matches
    if (imageMatches.length > 0) score += 10;
    if (imageMatches.length >= 5) score += 10;
    
    // High confidence profiles
    const highConfProfiles = profiles.filter(p => p.confidence >= 80).length;
    score += highConfProfiles * 5;
    
    return Math.min(score, 100);
  }

  /**
   * Generate default risk flags
   * @param {Object} data - Search results
   * @returns {Array} Risk flags
   */
  generateDefaultRiskFlags(data) {
    const flags = [];
    const { profiles = [], imageMatches = [] } = data;
    
    if (profiles.length === 0) {
      flags.push('No public profiles found');
    }
    
    if (profiles.length === 1) {
      flags.push('Limited online presence');
    }
    
    if (imageMatches.length > 5) {
      flags.push('Image appears on multiple platforms');
    }
    
    const lowConfProfiles = profiles.filter(p => p.confidence < 50).length;
    if (lowConfProfiles > 0) {
      flags.push(`${lowConfProfiles} low-confidence matches`);
    }
    
    const platforms = this.extractPlatforms(data);
    if (platforms.length >= 5) {
      flags.push('Multi-platform presence detected');
    }
    
    return flags;
  }

  /**
   * Generate default summary text
   * @param {Object} data - Search results
   * @returns {string} Summary text
   */
  generateDefaultSummary(data) {
    const { profiles = [], imageMatches = [], searchQuery } = data;
    
    let summary = '';
    
    if (profiles.length > 0) {
      summary += `Found ${profiles.length} profile${profiles.length !== 1 ? 's' : ''} `;
      const platforms = this.extractPlatforms(data);
      summary += `across ${platforms.length} platform${platforms.length !== 1 ? 's' : ''}. `;
    } else {
      summary += 'No public profiles found. ';
    }
    
    if (imageMatches.length > 0) {
      summary += `Image found on ${imageMatches.length} source${imageMatches.length !== 1 ? 's' : ''}. `;
    }
    
    const verifiedCount = profiles.filter(p => p.isVerified).length;
    if (verifiedCount > 0) {
      summary += `${verifiedCount} verified account${verifiedCount !== 1 ? 's' : ''} detected.`;
    }
    
    return summary.trim();
  }

  /**
   * Generate default recommendations
   * @param {Object} data - Search results
   * @returns {Array} Recommendations
   */
  generateDefaultRecommendations(data) {
    const recommendations = [];
    const { profiles = [], imageMatches = [] } = data;
    
    if (profiles.length === 0) {
      recommendations.push('Verify identity through alternative methods');
      recommendations.push('Request additional documentation');
    } else if (profiles.length === 1) {
      recommendations.push('Cross-reference with additional sources');
      recommendations.push('Verify profile authenticity');
    } else {
      recommendations.push('Review all profiles for consistency');
      recommendations.push('Check for verified accounts');
    }
    
    if (imageMatches.length > 5) {
      recommendations.push('Investigate image usage across platforms');
    }
    
    return recommendations.slice(0, 3);
  }

  /**
   * Calculate risk level
   * @param {number} confidence - Identity confidence
   * @param {Array} flags - Risk flags
   * @returns {string} Risk level
   */
  calculateRiskLevel(confidence, flags) {
    if (confidence >= 80 && flags.length <= 1) return 'low';
    if (confidence >= 60 && flags.length <= 3) return 'medium';
    if (confidence >= 40) return 'high';
    return 'critical';
  }

  /**
   * Normalize confidence score
   * @param {number} value - Raw confidence
   * @returns {number} Normalized confidence (0-100)
   */
  normalizeConfidence(value) {
    const num = parseInt(value);
    if (isNaN(num)) return 50;
    return Math.max(0, Math.min(100, num));
  }

  /**
   * Normalize risk level
   * @param {string} level - Raw risk level
   * @returns {string} Normalized risk level
   */
  normalizeRiskLevel(level) {
    const normalized = (level || '').toLowerCase();
    if (['low', 'medium', 'high', 'critical'].includes(normalized)) {
      return normalized;
    }
    return 'medium';
  }
}

module.exports = OpenRouterSummaryProvider;
