// src/components/NewsSection.js
'use client';

import { useState, useEffect, useCallback } from 'react'; // Import useCallback
import styles from './NewsSection.module.css';

// Simple exponential backoff function (remains the same)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const fetchWithBackoff = async (url, options, retries = 3, initialDelay = 1000) => {
    let currentDelay = initialDelay;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                     console.error(`Client error fetching news: ${response.status}`);
                     if (response.status === 400) {
                         // Attempt to read error body for more details
                         try {
                             const errorBody = await response.json();
                             console.error("API Error Body:", errorBody);
                             throw new Error(`API Request Error (400): ${errorBody?.error?.message || 'Bad Request'}`);
                         } catch (jsonError) {
                              // If response isn't JSON or reading fails, use status text
                              throw new Error(`API Request Error (400): ${response.statusText || 'Bad Request'}`);
                         }
                     }
                     throw new Error(`Request failed with status ${response.status}`);
                 }
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            // Check content type before parsing as JSON
             const contentType = response.headers.get("content-type");
             if (contentType && contentType.indexOf("application/json") !== -1) {
                 return await response.json();
             } else {
                 // Handle non-JSON responses if necessary, or throw error
                 const textResponse = await response.text();
                 console.error("Received non-JSON response:", textResponse);
                 throw new Error(`Unexpected response format: ${contentType}`);
             }
        } catch (error) {
            console.error(`Fetch attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw error; // Rethrow last error
            console.warn(`Retrying in ${currentDelay}ms...`);
            await delay(currentDelay);
            currentDelay *= 2; // Exponential backoff
        }
    }
     throw new Error("Fetch failed after multiple retries."); // Should be unreachable if retries > 0
};


// Fallback Parsing Function (remains the same)
const parseNewsFromText = (text) => {
    const articles = [];
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
        if (match[1] && match[2]) {
            articles.push({ title: match[1].trim(), uri: match[2].trim() });
        } else if (match[3]) {
             try {
                const url = new URL(match[3].trim());
                let possibleTitle = url.pathname.split('/').pop()?.replace(/[-_]/g, ' ') || url.hostname;
                possibleTitle = possibleTitle.replace(/\.(html|php|asp|aspx)$/i, '');
                possibleTitle = possibleTitle.charAt(0).toUpperCase() + possibleTitle.slice(1);
                if (!articles.some(a => a.uri === match[3].trim())) {
                    articles.push({ title: possibleTitle || `Source: ${url.hostname}`, uri: match[3].trim() });
                }
             } catch (e) {
                 console.warn("Could not parse URL for title:", match[3]);
                 if (!articles.some(a => a.uri === match[3].trim())) {
                    articles.push({ title: "News Source Link", uri: match[3].trim() });
                 }
             }
        }
    }
     return Array.from(new Map(articles.map(item => [item['uri'], item])).values());
};


const NewsSection = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(false); // Start as false, set true during fetch
    const [error, setError] = useState(null);

    // Wrap fetchNews in useCallback to prevent re-creation on every render
    const fetchNews = useCallback(async () => {
        console.log("Fetching news..."); // Log when fetch starts
        setLoading(true);
        setError(null);
        setNews([]); // Clear previous news immediately for visual feedback
        const apiKey = "AIzaSyDpMo83guCP-9Ng_NXiq3ZTO1gHvpfosro";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

        const systemPrompt = "You are an assistant that finds and lists recent news articles about global warming and climate change. Provide web search results with links (URLs) and titles for each article. Focus on factual news reports from reputable sources published recently.";
        const userQuery = "List 3-5 recent news articles (from the last month if available) about global warming, climate change impacts, relevant policy, or major sustainability projects. Format each as Title and URL.";

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            tools: [{ "google_search": {} }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
        };

        try {
            const result = await fetchWithBackoff(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const candidate = result.candidates?.[0];
            const generatedText = candidate?.content?.parts?.[0]?.text;

            if (!candidate) {
                 if (result.promptFeedback?.blockReason) {
                     throw new Error(`API request blocked: ${result.promptFeedback.blockReason}`);
                 }
                throw new Error('No valid candidates found in API response.');
            }
             if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
                const safetyInfo = candidate.safetyRatings ? `Safety Ratings: ${candidate.safetyRatings.map(r => `${r.category}: ${r.probability}`).join(', ')}` : '';
                throw new Error(`API call finished unexpectedly: ${candidate.finishReason}. ${safetyInfo}`);
             }

            let sources = [];
            const groundingMetadata = candidate.groundingMetadata;

            if (groundingMetadata?.groundingAttributions && groundingMetadata.groundingAttributions.length > 0) {
                sources = groundingMetadata.groundingAttributions
                    .map(attribution => ({
                        uri: attribution.web?.uri,
                        title: attribution.web?.title,
                    }))
                    .filter(source => source.uri && source.title);
                const uniqueSources = Array.from(new Map(sources.map(item => [item['uri'], item])).values());
                setNews(uniqueSources);
                console.log("News fetched from groundingMetadata.", uniqueSources);

            } else if (generatedText) {
                console.warn("Grounding metadata missing/empty, parsing text.");
                const parsedArticles = parseNewsFromText(generatedText);
                if (parsedArticles.length > 0) {
                    setNews(parsedArticles);
                    console.log("News parsed from text.", parsedArticles);
                } else {
                     setError("Could not retrieve structured news sources, and no links found in the response text.");
                     console.warn("Generated text:", generatedText);
                     setNews([]); // Ensure news is empty
                }
            } else {
                 throw new Error('No valid content or grounding metadata in API response.');
            }
             // Clear error if fetch was successful
             setError(null);

        } catch (err) {
            console.error('Error fetching or processing news:', err);
             setError(`Failed to fetch news articles. ${err.message || 'Please try again later.'}`);
            setNews([]); // Ensure news is empty on error
        } finally {
            setLoading(false);
            console.log("Finished fetching news."); // Log when fetch ends
        }
    }, []); // Empty dependency array for useCallback: fetchNews doesn't depend on props/state

    // Run fetchNews once on initial component mount
    useEffect(() => {
        fetchNews();
    }, [fetchNews]); // Include fetchNews (stable due to useCallback)

    // Handler for the reload button
    const handleReload = () => {
        fetchNews(); // Manually trigger fetch
    };

    return (
        <div className={styles.newsSection}>
             {/* Header with Reload Button */}
             <div className={styles.newsHeader}>
                 <h2>Climate & Environment News</h2>
                 <button onClick={handleReload} disabled={loading} className={styles.reloadButton}>
                     {loading ? 'Loading...' : 'Reload News'}
                 </button>
             </div>

            {/* Content Area */}
            {loading && news.length === 0 && <p className={styles.loading}>Loading news...</p>} {/* Show loading only if news is empty */}
            {error && <p className={styles.error}>{error}</p>}
            {!loading && !error && news.length === 0 && <p>No recent news articles found or failed to parse sources.</p>}
            {!loading && !error && news.length > 0 && (
                <ul className={styles.newsList}>
                    {news.map((item, index) => (
                        <li key={item.uri || index} className={styles.newsItem}>
                            <a href={item.uri} target="_blank" rel="noopener noreferrer" className={styles.newsLink}>
                                {item.title || "Untitled Article"}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default NewsSection;

