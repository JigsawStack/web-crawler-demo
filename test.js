import { JigsawStack } from "jigsawstack";
const jigsawstack = JigsawStack({ apiKey: "your-api-key" });

// Helper function to delay between requests
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));


async function crawlWikipedia(seedUrl, maxDepth = 2, maxArticlesPerLevel = 3) {
  console.log(`Starting Wikipedia crawler from: ${seedUrl}`);
  
  // Track visited URLs and collected articles
  const visited = new Set();
  const articleData = [];
  
  // Queue of URLs to process with their depth level
  let queue = [{ url: seedUrl, depth: 0 }];
  
  // Process the queue
  while (queue.length > 0) {
    const { url, depth } = queue.shift();
    
    // Skip if already visited or exceeding max depth
    if (visited.has(url) || depth > maxDepth) continue;
    
    // Only process English Wikipedia URLs
    if (!url.includes("en.wikipedia.org/wiki/")) {
      console.log(`Skipping non-English Wikipedia URL: ${url}`);
      continue;
    }
    
    // Mark as visited
    visited.add(url);
    console.log(`Crawling (depth ${depth}): ${url}`);
    
    try {
      
      const result = await jigsawstack.web.ai_scrape({
        url: url,
        element_prompts: [
          "Article title", 
          "Article introduction", 
          "Key concepts",
        ],
        wait_for: {
          mode: "selector",
          value: "#content"
        },
        goto_options: {
          timeout: 12000,
          wait_until: "domcontentloaded"
        }
      });
      
      // Extract article information
      const title = result.data
        .filter(item => item.key === "Article title" && item.results?.length > 0)
        .map(item => item.results[0]?.text)[0] || "Unknown Title";
        
      const introduction = result.data
        .filter(item => item.key === "Article introduction" && item.results?.length > 0)
        .map(item => item.results[0]?.text)[0] || "No introduction available";
        
      const keyConcepts = result.data
        .filter(item => item.key === "Key concepts" && item.results?.length > 0)
        .map(item => item.results[0]?.text)[0] || "";
        
      
      // Extract the article's main subject from the URL
      const articleSubject = url.split('/wiki/')[1].replace(/_/g, ' ');
      
      // Store the article data
      articleData.push({
        title,
        url,
        introduction,
        keyConcepts,
        articleSubject,
        depth,
        crawlDate: new Date().toISOString()
      });
      
      // Continue if it hasn't reached max depth
      if (depth < maxDepth) {
        // Extract internal Wikipedia links from the result
        const internalLinks = [];
        
        if (result.link && result.link.length > 0) {
          for (const link of result.link) {
            // Only follow English Wikipedia article links with better filtering
            if (link.href && 
                link.href.includes("en.wikipedia.org/wiki/") && 
                !link.href.includes("File:") &&
                !link.href.includes("Special:") &&
                !link.href.includes("Talk:") &&
                !link.href.includes("Help:") &&
                !link.href.includes("Category:") && 
                !link.href.includes("Wikipedia:") &&
                !link.href.includes("Template:") &&
                !link.href.includes("Portal:") &&
                !link.href.includes("List_of_") &&
                !link.href.includes("#")) {
              
              // Skip the current page to avoid loops
              if (link.href === url) continue;
              
              // Add the link text for better ranking later
              internalLinks.push({
                url: link.href,
                text: link.text || ""
              });
            }
          }
        }
        
        // Remove duplicates by URL
        const uniqueLinks = [];
        const seenUrls = new Set();
        
        for (const link of internalLinks) {
          if (!seenUrls.has(link.url)) {
            seenUrls.add(link.url);
            uniqueLinks.push(link);
          }
        }
        
        // Sort links to prioritize articles that seem most relevant to the current article
        // This uses a simple heuristic of checking if the current article title is in the link text
        uniqueLinks.sort((a, b) => {
          const aContainsTitle = a.text.toLowerCase().includes(title.toLowerCase());
          const bContainsTitle = b.text.toLowerCase().includes(title.toLowerCase());
          
          if (aContainsTitle && !bContainsTitle) return -1;
          if (!aContainsTitle && bContainsTitle) return 1;
          return 0;
        });
        
        // Take only a limited number of links to follow
        const linksToFollow = uniqueLinks
          .slice(0, maxArticlesPerLevel)
          .map(link => ({ 
            url: link.url, 
            depth: depth + 1,
            sourceArticle: title
          }));
        
        console.log(`Following ${linksToFollow.length} links from this article:`);
        linksToFollow.forEach(link => console.log(`  - ${link.url}`));
        
        queue.push(...linksToFollow);
        
        // Add a delay between requests
        await delay(3000);
      }
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
      
      // Implement retry with exponential backoff
      if (depth === 0) {  // Only retry the seed URL
        console.log(`Retrying seed URL with simplified parameters...`);
        try {
          await delay(5000);  // Wait 5 seconds before retry
          
          const retryResult = await jigsawstack.web.ai_scrape({
            url: url,
            element_prompts: ["Article title", "Article text"],
            goto_options: {
              timeout: 15000
            }
          });
          
          if (retryResult && retryResult.data) {
            const title = retryResult.data
              .filter(item => item.key === "Article title" && item.results?.length > 0)
              .map(item => item.results[0]?.text)[0] || "Unknown Title";
              
            const text = retryResult.data
              .filter(item => item.key === "Article text" && item.results?.length > 0)
              .map(item => item.results[0]?.text)[0] || "No text available";
            
            articleData.push({
              title,
              url,
              introduction: text.substring(0, 300) + (text.length > 300 ? "..." : ""),
              keyConcepts: "",
              articleSubject: url.split('/wiki/')[1].replace(/_/g, ' '),
              depth,
              crawlDate: new Date().toISOString(),
              isRetry: true
            });
            
            console.log(`Successfully retrieved content on retry for ${url}`);
          }
        } catch (retryError) {
          console.error(`Retry also failed for ${url}:`, retryError);
        }
      }
    }
  }
  
  return articleData;
}

/**
 * Create a knowledge graph representation of the articles
 */
function createKnowledgeGraph(articles) {
  const graph = {
    nodes: [],
    edges: []
  };
  
  // Add each article as a node
  articles.forEach(article => {
    graph.nodes.push({
      id: article.url,
      label: article.title,
      depth: article.depth
    });
  });
  
  // Add edges between articles that link to each other
  for (let i = 0; i < articles.length; i++) {
    for (let j = 0; j < articles.length; j++) {
      if (i !== j) {
        // If article j is at depth d+1 from article i at depth d, add an edge
        if (articles[j].depth === articles[i].depth + 1) {
          graph.edges.push({
            source: articles[i].url,
            target: articles[j].url
          });
        }
      }
    }
  }
  
  return graph;
}

// Run the crawler 
(async () => {
  try {
    // Choose Wiki article
    const seedUrl = "https://en.wikipedia.org/wiki/Machine_learning";
    
    // Set limits
    const maxDepth = 1;         
    const maxArticles = 5;      // Follow 5 links per article for more breadth
    
    const articles = await crawlWikipedia(seedUrl, maxDepth, maxArticles);
    
    // Generate a knowledge graph
    const knowledgeGraph = createKnowledgeGraph(articles);
    
    // Print the results 
    console.log("\n=== WIKIPEDIA KNOWLEDGE CRAWLER RESULTS ===\n");
    console.log(`Total articles crawled: ${articles.length}`);
    console.log(`Seed article: ${seedUrl}`);
    console.log(`Crawl time: ${new Date().toLocaleString()}`);
    
    console.log("\n=== ARTICLE SUMMARIES ===\n");
    articles.forEach((article, index) => {
      console.log(`\n${index + 1}. ${article.title} (Depth: ${article.depth})`);
      console.log(`   URL: ${article.url}`);
      console.log(`   Introduction: ${article.introduction.substring(0, 250)}${article.introduction.length > 250 ? '...' : ''}`);
      
      if (article.keyConcepts) {
        console.log(`   Key Concepts: ${article.keyConcepts}`);
      }
      
    });
    
    console.log("\n=== KNOWLEDGE GRAPH STATISTICS ===\n");
    console.log(`Nodes: ${knowledgeGraph.nodes.length}`);
    console.log(`Connections: ${knowledgeGraph.edges.length}`);
    
  } catch (error) {
    console.error("Error running Wikipedia crawler:", error);
  }
})();