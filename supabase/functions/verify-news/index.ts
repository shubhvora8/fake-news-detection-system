const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyNewsRequest {
  newsContent: string;
  sourceUrl?: string;
}

interface NewsArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { newsContent, sourceUrl }: VerifyNewsRequest = await req.json();
    console.log('Verifying news content:', {
      contentLength: newsContent?.length,
      hasUrl: !!sourceUrl
    });

    if (!newsContent) {
      return new Response(
        JSON.stringify({ error: 'News content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const NEWSAPI_KEY = Deno.env.get('NEWSAPI_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }
    if (!NEWSAPI_KEY) {
      throw new Error('NEWSAPI_KEY not configured');
    }

    // Extract potential headline and keywords
    const extractSearchTerms = (text: string): { headline: string, keywords: string, entities: string } => {
      // Get first sentence which is often the headline
      const firstLine = text.split('\n')[0].replace(/^['"]|['"]$/g, '').trim();

      // Extract proper nouns (capitalized words/phrases)
      const properNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) || [];
      const uniqueNouns = [...new Set(properNouns)].slice(0, 4).join(' ');

      // Extract important keywords
      const words = text.toLowerCase().split(/\s+/);
      const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'that', 'this', 'it', 'their'];
      const keywords = words.filter(word => word.length > 5 && !stopWords.includes(word)).slice(0, 4).join(' ');

      return { headline: firstLine, keywords, entities: uniqueNouns };
    };

    const searchTerms = extractSearchTerms(newsContent);
    console.log('Search terms:', searchTerms);

    // Try multiple search strategies for better results
    const tryBBCSearch = async (): Promise<NewsArticle[]> => {
      const queries = [
        searchTerms.headline.substring(0, 100), // Try headline first
        searchTerms.entities, // Try proper nouns
        searchTerms.keywords // Try keywords as fallback
      ].filter(q => q && q.length > 5);

      for (const query of queries) {
        console.log('Trying BBC search with:', query);
        const urls = [
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&domains=bbc.com,bbc.co.uk&sortBy=relevancy&pageSize=10&language=en&apiKey=${NEWSAPI_KEY}`,
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)} AND (bbc.com OR "BBC")&sortBy=relevancy&pageSize=10&language=en&apiKey=${NEWSAPI_KEY}`
        ];

        for (const url of urls) {
          try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (!response.ok) {
              console.error('BBC NewsAPI error:', data.message || data.code);
              continue;
            }
            
            if (data.articles && data.articles.length > 0) {
              console.log('BBC search successful with query:', query, 'Found:', data.articles.length);
              return data.articles;
            }
          } catch (error) {
            console.error('BBC search error:', error);
          }
        }
      }

      return [];
    };

    const tryCNNSearch = async (): Promise<NewsArticle[]> => {
      const queries = [
        searchTerms.headline.substring(0, 100),
        searchTerms.entities,
        searchTerms.keywords
      ].filter(q => q && q.length > 5);

      for (const query of queries) {
        console.log('Trying CNN search with:', query);
        // Try both with CNN domain and without source restriction
        const urls = [
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)} AND (cnn.com OR "CNN")&sortBy=relevancy&pageSize=10&language=en&apiKey=${NEWSAPI_KEY}`,
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&domains=cnn.com&sortBy=relevancy&pageSize=10&language=en&apiKey=${NEWSAPI_KEY}`
        ];

        for (const url of urls) {
          try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (!response.ok) {
              console.error('CNN NewsAPI error:', data.message || data.code);
              continue;
            }
            
            if (data.articles && data.articles.length > 0) {
              console.log('CNN search successful with query:', query, 'Found:', data.articles.length);
              return data.articles;
            }
          } catch (error) {
            console.error('CNN search error:', error);
          }
        }
      }

      return [];
    };

    const tryABCSearch = async (): Promise<NewsArticle[]> => {
      const queries = [
        searchTerms.headline.substring(0, 100),
        searchTerms.entities,
        searchTerms.keywords
      ].filter(q => q && q.length > 5);

      for (const query of queries) {
        console.log('Trying ABC News search with:', query);
        const urls = [
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&domains=abcnews.go.com&sortBy=relevancy&pageSize=10&language=en&apiKey=${NEWSAPI_KEY}`,
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)} AND (abcnews OR "ABC News")&sortBy=relevancy&pageSize=10&language=en&apiKey=${NEWSAPI_KEY}`
        ];

        for (const url of urls) {
          try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (!response.ok) {
              console.error('ABC NewsAPI error:', data.message || data.code);
              continue;
            }
            
            if (data.articles && data.articles.length > 0) {
              console.log('ABC News search successful with query:', query, 'Found:', data.articles.length);
              return data.articles;
            }
          } catch (error) {
            console.error('ABC News search error:', error);
          }
        }
      }

      return [];
    };

    const tryGuardianSearch = async (): Promise<NewsArticle[]> => {
      const queries = [
        searchTerms.headline.substring(0, 100),
        searchTerms.entities,
        searchTerms.keywords
      ].filter(q => q && q.length > 5);

      for (const query of queries) {
        console.log('Trying Guardian search with:', query);
        const urls = [
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&domains=theguardian.com&sortBy=relevancy&pageSize=10&language=en&apiKey=${NEWSAPI_KEY}`,
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)} AND (theguardian OR "The Guardian")&sortBy=relevancy&pageSize=10&language=en&apiKey=${NEWSAPI_KEY}`
        ];

        for (const url of urls) {
          try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (!response.ok) {
              console.error('Guardian NewsAPI error:', data.message || data.code);
              continue;
            }
            
            if (data.articles && data.articles.length > 0) {
              console.log('Guardian search successful with query:', query, 'Found:', data.articles.length);
              return data.articles;
            }
          } catch (error) {
            console.error('Guardian search error:', error);
          }
        }
      }

      return [];
    };

    console.log('Fetching from BBC, CNN, ABC News, and Guardian with multiple strategies...');
    const [bbcArticles, cnnArticles, abcArticles, guardianArticles] = await Promise.all([
      tryBBCSearch(),
      tryCNNSearch(),
      tryABCSearch(),
      tryGuardianSearch()
    ]);

    const articles: NewsArticle[] = [...bbcArticles, ...cnnArticles, ...abcArticles, ...guardianArticles];

    console.log('Total BBC articles found:', bbcArticles.length);
    console.log('Total CNN articles found:', cnnArticles.length);
    console.log('Total ABC News articles found:', abcArticles.length);
    console.log('Total Guardian articles found:', guardianArticles.length);

    // Create AI prompt with real articles
    const articlesContext = articles.length > 0 ? articles.map((article, idx) =>
      `Article ${idx + 1} [${article.source.name}]:
Title: ${article.title}
Description: ${article.description || 'N/A'}
Content: ${article.content || 'N/A'}
Published: ${article.publishedAt}
URL: ${article.url}
`).join('\n---\n') : 'No matching articles found in NewsAPI.';

    const bbcArticlesContext = articles.filter(a => a.source.name?.toLowerCase().includes('bbc'));
    const cnnArticlesContext = articles.filter(a => a.source.name?.toLowerCase().includes('cnn'));
    const abcArticlesContext = articles.filter(a => a.source.name?.toLowerCase().includes('abc'));
    const guardianArticlesContext = articles.filter(a => a.source.name?.toLowerCase().includes('guardian'));

    const prompt = `You are a news verification assistant. Compare the user's news content against real articles from major news sources.

User's News Content:
${newsContent}

${sourceUrl ? `User's Source URL: ${sourceUrl}\n` : ''}

Found Articles (${articles.length} total):
- BBC Articles Found: ${bbcArticlesContext.length}
- CNN Articles Found: ${cnnArticlesContext.length}
- ABC News Articles Found: ${abcArticlesContext.length}
- Guardian Articles Found: ${guardianArticlesContext.length}

${articlesContext}

CRITICAL INSTRUCTIONS FOR VERIFICATION:

1. MATCHING CRITERIA (be VERY LIBERAL with matches):
   - Same topic/event (e.g., Russia-Ukraine war, Gaza conflict, political scandal) = HIGH match
   - Same location mentioned (e.g., Ukraine, Gaza, Washington) = MODERATE match
   - Same timeframe or date range = MODERATE match
   - Related events from same category = MODERATE match
   - If articles cover the SAME GENERAL STORY even with different specific details = VERIFIED

2. VERIFICATION THRESHOLDS (use these generously):
   - Mark as VERIFIED=TRUE if articles are about the SAME TOPIC
   - Articles don't need exact matches - covering the same event/topic is sufficient
   - Example: User's content about "Israeli strikes in Gaza" matches ANY article about Israel-Gaza conflict

3. SIMILARITY SCORING (be GENEROUS - articles found via keyword search are already topically related):
   - If articles found AND topic matches: MINIMUM 65% similarity (start here)
   - 80-100: Exact same event with matching details
   - 65-79: Same event/topic, details may vary
   - 50-64: Related topic, similar timeframe
   - 30-49: Same general category but different specific event
   - 0-29: Completely different topics (use ONLY if truly unrelated)

4. IMPORTANT: Articles were found through keyword search, so they're already topically relevant. Don't score below 60% unless articles are truly about different topics.

5. LEGITIMACY SCORE CALCULATION:
   - If 3+ sources verified: 75-95
   - If 2 sources verified: 70-85
   - If 1 source verified: 60-75
   - If 0 sources verified: 20-40

6. For each matched article, include: title, similarity score (minimum 65 if topic matches), url, publishDate, and excerpt (first 150 chars).

Respond in JSON format only:
{
  "bbcVerified": boolean,
  "bbcSimilarity": number (0-100),
  "bbcArticles": [{"title": string, "similarity": number, "url": string, "publishDate": string, "excerpt": string}],
  "cnnVerified": boolean,
  "cnnSimilarity": number (0-100),
  "cnnArticles": [{"title": string, "similarity": number, "url": string, "publishDate": string, "excerpt": string}],
  "abcVerified": boolean,
  "abcSimilarity": number (0-100),
  "abcArticles": [{"title": string, "similarity": number, "url": string, "publishDate": string, "excerpt": string}],
  "guardianVerified": boolean,
  "guardianSimilarity": number (0-100),
  "guardianArticles": [{"title": string, "similarity": number, "url": string, "publishDate": string, "excerpt": string}],
  "legitimacyScore": number (0-100, average of all source similarities),
  "topics": string[],
  "locations": string[],
  "dates": string[],
  "credibilityIndicators": string[],
  "redFlags": string[],
  "overallAssessment": string
}`;

    console.log('Calling AI for verification...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful news verification assistant. When comparing articles, be generous with matches - articles covering the same general event or topic should be considered related even if specific details differ. Return only valid JSON without markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway returned ${aiResponse.status}: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received:', {
      hasChoices: !!aiData.choices?.length
    });

    const content = aiData.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    let verificationResult: any;
    try {
      // Remove markdown code blocks if present
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```')) {
        // Remove opening ```json or ``` 
        cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/i, '');
        // Remove closing ```
        cleanedContent = cleanedContent.replace(/\n?```\s*$/, '');
      }

      cleanedContent = cleanedContent.trim();
      verificationResult = JSON.parse(cleanedContent);

      // Normalize unexpected shapes (e.g. empty array or partial object)
      if (!verificationResult || Array.isArray(verificationResult)) {
        console.warn('AI returned non-object verification result, normalizing to defaults:', verificationResult);
        verificationResult = {};
      }

      // Ensure all expected fields exist with safe defaults
      verificationResult = {
        bbcVerified: Boolean(verificationResult.bbcVerified),
        bbcSimilarity: Number(verificationResult.bbcSimilarity ?? 0),
        bbcArticles: Array.isArray(verificationResult.bbcArticles) ? verificationResult.bbcArticles : [],
        cnnVerified: Boolean(verificationResult.cnnVerified),
        cnnSimilarity: Number(verificationResult.cnnSimilarity ?? 0),
        cnnArticles: Array.isArray(verificationResult.cnnArticles) ? verificationResult.cnnArticles : [],
        abcVerified: Boolean(verificationResult.abcVerified),
        abcSimilarity: Number(verificationResult.abcSimilarity ?? 0),
        abcArticles: Array.isArray(verificationResult.abcArticles) ? verificationResult.abcArticles : [],
        guardianVerified: Boolean(verificationResult.guardianVerified),
        guardianSimilarity: Number(verificationResult.guardianSimilarity ?? 0),
        guardianArticles: Array.isArray(verificationResult.guardianArticles) ? verificationResult.guardianArticles : [],
        legitimacyScore: Number(verificationResult.legitimacyScore ?? 0),
        topics: Array.isArray(verificationResult.topics) ? verificationResult.topics : [],
        locations: Array.isArray(verificationResult.locations) ? verificationResult.locations : [],
        dates: Array.isArray(verificationResult.dates) ? verificationResult.dates : [],
        credibilityIndicators: Array.isArray(verificationResult.credibilityIndicators) ? verificationResult.credibilityIndicators : [],
        redFlags: Array.isArray(verificationResult.redFlags) ? verificationResult.redFlags : [],
        overallAssessment: typeof verificationResult.overallAssessment === 'string' ? verificationResult.overallAssessment : ''
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON response from AI');
    }

    console.log('Verification complete:', {
      bbcVerified: verificationResult.bbcVerified,
      cnnVerified: verificationResult.cnnVerified,
      legitimacyScore: verificationResult.legitimacyScore
    });

    return new Response(
      JSON.stringify(verificationResult),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in verify-news function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to verify news';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
