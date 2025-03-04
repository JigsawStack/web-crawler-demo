# Wikipedia Knowledge Crawler

A Node.js tool that crawls Wikipedia articles to build a knowledge graph and extract key information. This tool uses JigsawStack's AI web scraper to intelligently parse Wikipedia articles and follow related links, creating a connected map of knowledge on a topic.

## Features

- 🔍 **Smart Content Extraction** - Extracts article titles, introductions, key concepts, and image captions
- 🕸️ **Knowledge Graph Building** - Creates a graph of related concepts by following relevant links
- 🧠 **Intelligent Link Selection** - Prioritizes links most relevant to the current article
- 🌐 **English Wikipedia Focus** - Filters to ensure only English Wikipedia content is processed
- ⚡ **Efficient Crawling** - Configurable depth and breadth limits with built-in delays to respect servers
- 🔄 **Error Handling** - Includes retry logic with simplified parameters for failed requests

## Installation

Clone the repository:
```bash
git clone https://github.com/yourusername/wikipedia-knowledge-crawler.git
cd wikipedia-knowledge-crawler
```

Install dependencies:
```bash
npm install jigsawstack
```

## Configuration

Before using the crawler, you need to sign up for a JigsawStack API key at [jigsawstack.com](https://jigsawstack.com).

Create a `.env` file in the project root:
```
JIGSAWSTACK_API_KEY=your_api_key_here
```

## Usage

### JavaScript API

```javascript
// Basic usage
const crawler = require('./wikipedia-crawler');

// Start crawling from a specific Wikipedia article
crawler.start({
  seedUrl: "https://en.wikipedia.org/wiki/Machine_learning",
  maxDepth: 1,             // How many links deep to crawl
  maxArticlesPerLevel: 3,  // How many links to follow from each article
  outputFile: "output.json" // Optional: save results to a file
});
```

### Command Line Usage

Run with default settings (Machine Learning as seed topic):
```bash 
node index.js
```

Run with custom topic:
```bash
node index.js --seed="https://en.wikipedia.org/wiki/Artificial_intelligence" --depth=2 --breadth=5
```

## Example Output

The crawler generates a detailed output including:
- Article Summaries - Introduction and key concepts for each article
- Knowledge Graph - Connections between related articles
- Crawl Statistics - Number of articles, depth, crawl time

### Example console output:

```
=== WIKIPEDIA KNOWLEDGE CRAWLER RESULTS ===

Total articles crawled: 4
Seed article: https://en.wikipedia.org/wiki/Machine_learning
Crawl time: February 26, 2025, 3:45:12 PM

=== ARTICLE SUMMARIES ===

1. Machine learning (Depth: 0)
   URL: https://en.wikipedia.org/wiki/Machine_learning
   Introduction: Machine learning (ML) is a field of study in artificial intelligence concerned with the development and study of statistical algorithms that can learn from data and generalize to unseen data...
   Key Concepts: Neural networks, supervised learning, unsupervised learning, reinforcement learning

2. Artificial intelligence (Depth: 1)
   URL: https://en.wikipedia.org/wiki/Artificial_intelligence
   Introduction: Artificial intelligence (AI) is the intelligence of machines or software, as opposed to the intelligence of humans or animals. It is a field of study in computer science that develops and studies intelligent machines...
   Key Concepts: Machine learning, neural networks, natural language processing, computer vision

3. Neural network (Depth: 1)
   URL: https://en.wikipedia.org/wiki/Neural_network
   Introduction: A neural network is a network or circuit of biological neurons, or, in a modern sense, an artificial neural network, composed of artificial neurons or nodes...
   Image: A simple neural network with two inputs, one hidden layer with two nodes, and one output

=== KNOWLEDGE GRAPH STATISTICS ===

Nodes: 4
Connections: 3
```

### Saved Output Format

When saving to a file, the crawler produces a JSON structure:

```json
{
  "articles": [
    {
      "title": "Machine learning",
      "url": "https://en.wikipedia.org/wiki/Machine_learning",
      "introduction": "Machine learning (ML) is a field of study...",
      "keyConcepts": "Neural networks, supervised learning...",
      "articleSubject": "Machine_learning",
      "depth": 0,
      "crawlDate": "2025-02-26T15:45:12.000Z"
    },
    ...
  ],
  "knowledgeGraph": {
    "nodes": [
      {"id": "https://en.wikipedia.org/wiki/Machine_learning", "label": "Machine learning", "depth": 0},
      ...
    ],
    "edges": [
      {"source": "https://en.wikipedia.org/wiki/Machine_learning", "target": "https://en.wikipedia.org/wiki/Artificial_intelligence"},
      ...
    ]
  },
  "metadata": {
    "seedUrl": "https://en.wikipedia.org/wiki/Machine_learning",
    "crawlTime": "2025-02-26T15:45:12.000Z",
    "maxDepth": 1,
    "maxArticlesPerLevel": 3
  }
}
```

## Advanced Configuration

The crawler accepts several configuration options:

```javascript
{
  seedUrl: "https://en.wikipedia.org/wiki/Machine_learning", // Starting point
  maxDepth: 2,             // How many links deep to follow
  maxArticlesPerLevel: 5,  // Maximum links to follow from each article
  delayBetweenRequests: 3000, // Milliseconds to wait between requests
  timeout: 12000,          // Milliseconds before timing out a request
  outputFile: "output.json", // File to save results (optional)
  retryFailedRequests: true // Whether to retry failed requests
}
```

## Limitations

- The crawler only works with English Wikipedia articles
- Performance depends on JigsawStack's AI web scraper capabilities
- Wikipedia's structure may change, potentially affecting extraction quality
- Respect Wikipedia's terms of service and avoid excessive crawling

## Future Improvements

- Visualization tools for the knowledge graph
- Support for other languages
- Topic-based filtering to stay within a specific domain
- Integration with other knowledge sources
- Natural language search across the collected knowledge

## Dependencies

- [JigsawStack](https://jigsawstack.com/ai-web-scraper) - AI Web Scraper
- Node.js (v14 or higher)