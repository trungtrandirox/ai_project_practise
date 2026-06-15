/**
 * RAG Text Chunking Utilities — Course: RAG module
 *
 * Chunking strategy chosen: Structure-based (split on markdown ## headers)
 * Rationale: QA specs, user stories, and acceptance criteria are naturally
 * structured documents. Each ## section = one feature = one test suite.
 * Structure-based gives semantically coherent chunks with zero NLP overhead.
 *
 * Fallback: Sentence-based chunking for plain text with no markdown structure.
 */

export interface RequirementChunk {
  /** Feature/section name extracted from the ## header */
  feature: string;
  /** Full text content of this section */
  content: string;
  /** Source file or identifier this chunk came from */
  source: string;
  /** Character offset where this chunk starts in the original document */
  startIndex: number;
}

// ── Strategy 1: Structure-based chunking ──────────────────────────────────────
// Best for: Markdown specs, user stories, Gherkin feature files.
// Split on ## headers — each section is one coherent feature chunk.
// Lesson: "works beautifully when you have guarantees about document structure"
export function chunkBySection(documentText: string, source = "unknown"): RequirementChunk[] {
  // Split on ## headings (also handles ### by grouping under nearest ##)
  const pattern = /\n(?=## )/;
  const rawSections = documentText.split(pattern).filter((s) => s.trim().length > 0);

  const chunks: RequirementChunk[] = [];
  let currentOffset = 0;

  for (const section of rawSections) {
    const firstLine = section.split("\n")[0].replace(/^#+\s*/, "").trim();
    const feature = firstLine || "Introduction";

    chunks.push({
      feature,
      content: section.trim(),
      source,
      startIndex: documentText.indexOf(section, currentOffset),
    });

    currentOffset += section.length;
  }

  return chunks;
}

// ── Strategy 2: Sentence-based chunking (fallback) ────────────────────────────
// Best for: Plain text, PDF exports, docs without consistent structure.
// Lesson: "good middle ground" — avoids mid-word cuts, preserves sentence meaning.
// overlap_sentences: include last N sentences from previous chunk for context continuity.
export function chunkBySentence(
  text: string,
  maxSentencesPerChunk = 5,
  overlapSentences = 1,
  source = "unknown"
): RequirementChunk[] {
  // Split on sentence-ending punctuation followed by space/newline
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);

  const chunks: RequirementChunk[] = [];
  let i = 0;

  while (i < sentences.length) {
    const slice = sentences.slice(i, i + maxSentencesPerChunk);
    const content = slice.join(" ").trim();

    chunks.push({
      feature: `Chunk ${chunks.length + 1}`,
      content,
      source,
      startIndex: i,
    });

    // Move forward by (maxSentences - overlap) to ensure context continuity
    i += Math.max(1, maxSentencesPerChunk - overlapSentences);
  }

  return chunks;
}

// ── Auto-detect and chunk ─────────────────────────────────────────────────────
// Primary entry point: use structure-based if document has ## headers,
// fall back to sentence-based for unstructured text.
export function chunkRequirements(documentText: string, source = "unknown"): RequirementChunk[] {
  const hasMarkdownHeaders = /\n## /m.test(documentText);

  if (hasMarkdownHeaders) {
    return chunkBySection(documentText, source);
  }

  return chunkBySentence(documentText, 5, 1, source);
}

// ── Step 5: Cosine Similarity — Lesson: Full RAG Flow ────────────────────────
// Measures how "close" two vectors are in direction (not magnitude).
// Returns a value from -1 to 1:
//   1.0  = same direction (very relevant)
//   0.0  = perpendicular (unrelated)
//  -1.0  = opposite direction (very different)
// Used to rank chunks: higher cosine similarity = more relevant to query.
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  const dot    = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA   = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB   = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

// Cosine distance = 1 - similarity. Smaller = more similar (used in vector DBs).
export function cosineDistance(a: number[], b: number[]): number {
  return 1 - cosineSimilarity(a, b);
}

// ── TF-IDF Vector — lightweight "embedding" without an external model ─────────
// Converts text to a sparse vector of term frequencies weighted by inverse
// document frequency. Good approximation of semantic similarity for structured
// QA docs where vocabulary is domain-specific and consistent.
// This avoids needing a Voyage AI / OpenAI embedding API key for this project.
function buildTFIDFVector(text: string, vocabulary: string[]): number[] {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  const tf = new Map<string, number>();
  for (const w of words) tf.set(w, (tf.get(w) ?? 0) + 1 / words.length);
  return vocabulary.map((term) => tf.get(term) ?? 0);
}

// ── Step 5 + 6: Semantic Search + RAG Retrieval ───────────────────────────────
// Replaces naive keyword search with cosine-similarity ranking.
// Lesson: "find the stored embedding closest to the user query embedding"
// topK: how many chunks to return (like a vector DB returning top-N results).
export function searchChunks(
  chunks: RequirementChunk[],
  query: string,
  topK = 3
): RequirementChunk[] {
  if (chunks.length === 0) return [];

  // Build shared vocabulary from all chunks + query (our "vector database index")
  const allText = [query, ...chunks.map((c) => c.feature + " " + c.content)];
  const vocabulary = [...new Set(
    allText.flatMap((t) => t.toLowerCase().split(/\W+/).filter((w) => w.length > 2))
  )];

  const queryVec = buildTFIDFVector(query, vocabulary);

  return chunks
    .map((chunk) => {
      const chunkVec = buildTFIDFVector(chunk.feature + " " + chunk.content, vocabulary);
      const similarity = cosineSimilarity(queryVec, chunkVec);
      return { chunk, similarity };
    })
    .filter(({ similarity }) => similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)   // highest similarity first
    .slice(0, topK)
    .map(({ chunk }) => chunk);
}

// ── Step 6: Build Final Prompt ────────────────────────────────────────────────
// Lesson: "take the user's question + most relevant text chunk → combine into prompt"
// This is the final step of the RAG pipeline before calling Claude.
// Retrieved chunks are injected as <requirements> context so Claude
// generates tests from actual spec content, not just user-typed steps.
export function buildRAGPrompt(featureName: string, relevantChunks: RequirementChunk[]): string {
  if (relevantChunks.length === 0) {
    return `Generate Playwright tests for the feature: ${featureName}`;
  }

  const context = relevantChunks
    .map((c) => `### ${c.feature} (from: ${c.source})\n${c.content}`)
    .join("\n\n---\n\n");

  return `Generate Playwright TypeScript tests for the following feature.

<requirements>
${context}
</requirements>

Feature to test: ${featureName}

Use the requirements above as the source of truth for test cases, acceptance criteria,
and edge cases. Do not invent behaviour not described in the requirements.`;
}

// ── VectorIndex — in-memory vector database (semantic search) ─────────────────
// Lesson: "store both the embedding AND the original text content"
// Implements the 5-step RAG flow as a single reusable class:
//   add_vector(embedding, doc)  → Step 3: store
//   search(queryEmbedding, k)   → Step 5: retrieve top-K by cosine distance
//
// Production alternative: replace with Pinecone / Chroma / pgvector when
// the requirements corpus grows beyond a few hundred chunks.
interface StoredVector {
  embedding: number[];
  doc: RequirementChunk;
}

export class VectorIndex {
  private store: StoredVector[] = [];

  /** Step 3: Add a chunk + its embedding to the index */
  addVector(embedding: number[], doc: RequirementChunk): void {
    this.store.push({ embedding, doc });
  }

  /** Step 5: Return the k most relevant chunks for a query embedding.
   *  Returns [doc, distance] pairs sorted ascending by cosine distance
   *  (distance 0 = identical, 1 = unrelated, 2 = opposite).
   *  Lesson: "lower distance score = more similar to query"
   */
  search(queryEmbedding: number[], k = 3): Array<[RequirementChunk, number]> {
    return this.store
      .map(({ embedding, doc }) => {
        const distance = cosineDistance(queryEmbedding, embedding);
        return [doc, distance] as [RequirementChunk, number];
      })
      .sort((a, b) => a[1] - b[1])   // ascending: smallest distance first
      .slice(0, k);
  }

  get size(): number { return this.store.length; }
  clear(): void { this.store = []; }
}

// ── buildIndex — wire chunking + embedding + VectorIndex together ─────────────
// Full 5-step RAG pipeline in one call, ready to use from MCP tool or agent.
//
// Usage:
//   const index = buildIndex(markdownSpec, "requirements.md");
//   const results = index.search(buildTFIDFVector("login feature", vocab), 3);
//   const prompt  = buildRAGPrompt("Login", results.map(([doc]) => doc));
//
// Lesson Step 1+2+3 combined: chunk → embed → store
export function buildIndex(documentText: string, source = "unknown"): {
  index: VectorIndex;
  vocabulary: string[];
} {
  const chunks = chunkRequirements(documentText, source);

  // Build shared vocabulary once across all chunks (our "embedding space")
  const vocabulary = [...new Set(
    chunks.flatMap((c) =>
      (c.feature + " " + c.content).toLowerCase().split(/\W+/).filter((w) => w.length > 2)
    )
  )];

  const index = new VectorIndex();
  for (const chunk of chunks) {
    const embedding = buildTFIDFVector(chunk.feature + " " + chunk.content, vocabulary);
    index.addVector(embedding, chunk);   // store embedding + original text together
  }

  return { index, vocabulary };
}

// ── Contextual Retrieval — Lesson: add context before indexing ────────────────
// Problem: after chunking, each chunk loses its relationship to the rest of the doc.
// Solution: ask Claude to write a short "situating" snippet for each chunk,
//   then prepend it to the chunk content before indexing.
// Result: "Login Feature" chunk now also knows it relates to "Auth Module" etc.
//
// For large documents: provide only start chunks + immediately preceding chunks
// instead of the whole document — avoids hitting context window limits.
//
// Cost note: N chunks = N extra API calls. Use claude-haiku (cheapest) for this.

export async function contextualizeChunks(
  chunks: RequirementChunk[],
  anthropic: import("@anthropic-ai/sdk").default,
  model = "claude-haiku-4-5",
  numStartChunks = 2,
  numPrevChunks  = 2,
): Promise<RequirementChunk[]> {
  const contextualized: RequirementChunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Build reduced context: first N chunks + N chunks before current
    // Lesson: "provide a few chunks from the start + chunks immediately before"
    const startPart = chunks.slice(0, Math.min(numStartChunks, i));
    const prevPart  = chunks.slice(Math.max(0, i - numPrevChunks), i);
    const contextParts = [...startPart, ...prevPart];
    const context = contextParts.map((c) => `## ${c.feature}\n${c.content}`).join("\n\n");

    const prompt = context.length > 0
      ? `Write a short succinct snippet (1-2 sentences) to situate the following chunk within the overall requirements document for the purpose of improving search retrieval. Answer ONLY with the snippet, nothing else.

<document_context>
${context}
</document_context>

<chunk_to_situate>
## ${chunk.feature}
${chunk.content}
</chunk_to_situate>`
      : null;

    if (!prompt) {
      // First chunk has no prior context — keep as-is
      contextualized.push(chunk);
      continue;
    }

    try {
      const response = await anthropic.messages.create({
        model,
        max_tokens: 150,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      });

      const contextSnippet = response.content
        .filter((b): b is import("@anthropic-ai/sdk").TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");

      // Prepend the context snippet to the chunk content (lesson: "combine context + original chunk")
      contextualized.push({
        ...chunk,
        content: `${contextSnippet}\n\n${chunk.content}`,
      });
    } catch {
      // On API error, fall back to original chunk unchanged
      contextualized.push(chunk);
    }
  }

  return contextualized;
}

// ── BM25Index — lexical search (exact term matching) ─────────────────────────
// Lesson: "semantic search focuses on meaning; BM25 focuses on exact term matches"
// Particularly important for QA: exact TC-IDs (TC-001), ticket refs (BUG-123),
// API names, component names — semantic search misses these.
//
// BM25 formula weights rare terms higher than common ones.
// Parameters: k1=1.5 (term saturation), b=0.75 (length normalisation)
const BM25_K1 = 1.5;
const BM25_B  = 0.75;

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\W+/).filter((w) => w.length > 1);
}

export class BM25Index {
  private docs: Array<{ chunk: RequirementChunk; tokens: string[] }> = [];
  private idf = new Map<string, number>();
  private avgDocLen = 0;

  /** Add a chunk to the index (same API as VectorIndex.addVector) */
  addDocument(chunk: RequirementChunk): void {
    const tokens = tokenize(chunk.feature + " " + chunk.content);
    this.docs.push({ chunk, tokens });
    this._rebuildIDF();
  }

  /** Search for top-k chunks by BM25 score (higher = better match).
   *  Lesson: "rare terms like TC-001 get higher importance scores"
   */
  search(query: string, k = 3): Array<[RequirementChunk, number]> {
    if (this.docs.length === 0) return [];

    const queryTokens = tokenize(query);
    this.avgDocLen = this.docs.reduce((s, d) => s + d.tokens.length, 0) / this.docs.length;

    return this.docs
      .map(({ chunk, tokens }) => {
        const score = queryTokens.reduce((sum, term) => {
          const tf  = tokens.filter((t) => t === term).length;
          const idf = this.idf.get(term) ?? 0;
          const num = tf * (BM25_K1 + 1);
          const den = tf + BM25_K1 * (1 - BM25_B + BM25_B * tokens.length / this.avgDocLen);
          return sum + idf * (num / den);
        }, 0);
        return [chunk, score] as [RequirementChunk, number];
      })
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])  // descending: highest BM25 score first
      .slice(0, k);
  }

  private _rebuildIDF(): void {
    const N = this.docs.length;
    const df = new Map<string, number>();
    for (const { tokens } of this.docs) {
      for (const term of new Set(tokens)) {
        df.set(term, (df.get(term) ?? 0) + 1);
      }
    }
    this.idf.clear();
    for (const [term, n] of df) {
      // Smoothed IDF: log((N - n + 0.5) / (n + 0.5) + 1)
      this.idf.set(term, Math.log((N - n + 0.5) / (n + 0.5) + 1));
    }
  }

  get size(): number { return this.docs.length; }
}

// ── hybridSearch — BM25 + semantic, merged (simple dedup) ────────────────────
// Kept for backwards compatibility. Prefer Retriever class for new code.
export async function hybridSearch(
  vectorIndex: VectorIndex,
  bm25Index: BM25Index,
  queryEmbedding: number[],
  queryText: string,
  k = 4,
): Promise<RequirementChunk[]> {
  return new Retriever(vectorIndex, bm25Index)
    .search(queryEmbedding, queryText, k);
}

// ── Retriever — unified multi-index search with Reciprocal Rank Fusion ────────
// Lesson: "coordinator that forwards queries to both indexes, merges with RRF"
//
// Why RRF instead of raw score merging:
//   VectorIndex returns cosine distances (0-2), BM25 returns TF-IDF scores (0-∞).
//   These can't be added directly. RRF uses only *rank position*, so scores are
//   always comparable regardless of the underlying search method.
//
// RRF formula: score(d) = Σ 1/(k_rrf + rank_i(d))
//   k_rrf=60 is the standard constant (dampens the influence of top ranks).
//   Higher RRF score = appeared near the top in more search methods.
//
// Extensible: pass any number of indexes that implement the same search interface.
interface SearchIndex {
  search(queryEmbedding: number[], queryText: string, k: number): RequirementChunk[];
}

// Adapter wrappers so VectorIndex and BM25Index share a common interface
class VectorIndexAdapter implements SearchIndex {
  constructor(private index: VectorIndex, private vocabulary: string[]) {}
  search(queryEmbedding: number[], _queryText: string, k: number): RequirementChunk[] {
    return this.index.search(queryEmbedding, k).map(([doc]) => doc);
  }
}

class BM25IndexAdapter implements SearchIndex {
  constructor(private index: BM25Index) {}
  search(_queryEmbedding: number[], queryText: string, k: number): RequirementChunk[] {
    return this.index.search(queryText, k).map(([doc]) => doc);
  }
}

// ── Re-ranker — LLM-based post-processing ────────────────────────────────────
// Lesson: "pass merged results to Claude → get back reordered list by relevance"
// Key optimisation: send only chunk IDs to Claude, not full text.
//   → Claude returns ["id-2", "id-0", ...] — no wasted tokens copying content.
// Tradeoff: extra LLM call adds latency; worth it when retrieval precision matters.

/** Type for the reranker function injected into Retriever */
export type RerankerFn = (
  chunks: RequirementChunk[],
  queryText: string,
  k: number,
) => Promise<RequirementChunk[]>;

/** Build a reranker using a pre-configured Anthropic client.
 *  Returns an async function that Retriever can call after RRF merging.
 */
export function buildReranker(
  anthropic: import("@anthropic-ai/sdk").default,
  model = "claude-haiku-4-5",  // use cheaper/faster model for re-ranking
): RerankerFn {
  return async (chunks, queryText, k) => {
    if (chunks.length <= 1) return chunks;

    // Assign temporary IDs — lesson: "use IDs instead of full text in response"
    const indexed = chunks.map((chunk, i) => ({ id: `doc-${i}`, chunk }));

    const docList = indexed
      .map(({ id, chunk }) =>
        `<doc id="${id}">\n<title>${chunk.feature}</title>\n${chunk.content.slice(0, 400)}\n</doc>`
      )
      .join("\n\n");

    const prompt = `You are a QA assistant. Select the ${k} most relevant requirement sections to answer the user's question.

<question>${queryText}</question>

<documents>
${docList}
</documents>

Respond with ONLY a JSON object in this format (no markdown, no explanation):
{"document_ids": ["doc-0", "doc-1"]}

List exactly ${k} IDs (or fewer if there are fewer documents), sorted by decreasing relevance.`;

    try {
      const response = await anthropic.messages.create({
        model,
        max_tokens: 200,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content.find((b) => b.type === "text")?.text ?? "";
      const parsed = JSON.parse(text) as { document_ids: string[] };

      // Map returned IDs back to chunks; fall back to original order on error
      const idToChunk = new Map(indexed.map(({ id, chunk }) => [id, chunk]));
      const reranked = parsed.document_ids
        .map((id) => idToChunk.get(id))
        .filter((c): c is RequirementChunk => c !== undefined);

      // Append any chunks not returned by Claude (safety net)
      const rerankedKeys = new Set(reranked.map((c) => c.startIndex));
      for (const { chunk } of indexed) {
        if (!rerankedKeys.has(chunk.startIndex)) reranked.push(chunk);
      }

      return reranked.slice(0, k);
    } catch {
      // Re-ranking failed — return original RRF order unchanged
      return chunks.slice(0, k);
    }
  };
}

export class Retriever {
  private indexes: SearchIndex[];
  private rerankerFn?: RerankerFn;

  constructor(
    ...args: Array<VectorIndex | BM25Index | { index: VectorIndex; vocabulary: string[] } | RerankerFn>
  ) {
    const nonFn = args.filter((a): a is VectorIndex | BM25Index | { index: VectorIndex; vocabulary: string[] } =>
      typeof a !== "function"
    );
    this.rerankerFn = args.find((a): a is RerankerFn => typeof a === "function");

    this.indexes = nonFn.map((idx) => {
      if (idx instanceof BM25Index) return new BM25IndexAdapter(idx);
      if ("vocabulary" in idx) return new VectorIndexAdapter(idx.index, idx.vocabulary);
      return new VectorIndexAdapter(idx as VectorIndex, []);
    });
  }

  /** Search all indexes in parallel, merge with RRF, optionally re-rank with LLM.
   *  Lesson: "run hybrid search → merge → send to Claude for reordering"
   */
  async search(queryEmbedding: number[], queryText: string, k = 4, kRRF = 60): Promise<RequirementChunk[]> {
    // Step 1: collect ranked results from every index
    const allRankedLists = this.indexes.map((idx) => idx.search(queryEmbedding, queryText, k * 2));

    // Step 2: RRF — accumulate scores keyed by startIndex (unique chunk id)
    const rrfScores = new Map<number, { chunk: RequirementChunk; score: number }>();

    for (const rankedList of allRankedLists) {
      rankedList.forEach((chunk, rank) => {
        const key   = chunk.startIndex;
        const delta = 1 / (kRRF + rank + 1);
        const existing = rrfScores.get(key);
        if (existing) {
          existing.score += delta;
        } else {
          rrfScores.set(key, { chunk, score: delta });
        }
      });
    }

    const rrfResults = [...rrfScores.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, k * 2)                    // pass more candidates to re-ranker
      .map(({ chunk }) => chunk);

    // Step 3: optional LLM re-ranking — lesson: "post-processing for better accuracy"
    if (this.rerankerFn) {
      return this.rerankerFn(rrfResults, queryText, k);
    }

    return rrfResults.slice(0, k);
  }
}

// ── Citations — Lesson: show users exactly where Claude found information ─────
// Problem: when Claude answers from a spec doc, users can't verify which
//   requirement backs each claim. Citations solve this with source transparency.
// Solution: wrap the plain-text spec as a `document` block with citations enabled.
//   Claude returns structured CitationCharLocation objects (char offsets for plain text).
// Use this alongside the RAG pipeline:
//   - RAG = scalable retrieval for large doc sets (chunks + vector search)
//   - Citations = precise traceability for single-document Q&A

/** A single citation pointing to character offsets inside a plain-text document. */
export interface SpecCitation {
  /** The verbatim text Claude pulled from the document */
  citedText: string;
  /** Title assigned to the document when sending it */
  documentTitle: string;
  /** 0-based character position where the citation starts */
  startCharIndex: number;
  /** 0-based character position where the citation ends */
  endCharIndex: number;
}

/** Return type: Claude's answer text + all cited sources */
export interface CitedAnswer {
  answer: string;
  citations: SpecCitation[];
}

/**
 * Query a requirements document and get back an answer with inline citations.
 *
 * Usage:
 * ```ts
 * const { answer, citations } = await querySpecWithCitations(
 *   anthropic, specMarkdown, "Which requirements cover login security?"
 * );
 * // citations[i].citedText = exact sentence Claude quoted from the spec
 * ```
 *
 * Lesson: `citations: { enabled: true }` on the document block turns Claude's
 * response into structured content blocks — text_block + citation_block pairs.
 * Each citation_block has a `cited_text` and char location so you can highlight
 * the exact source text in the UI, building trust and verifiability.
 */
export async function querySpecWithCitations(
  anthropic: import("@anthropic-ai/sdk").default,
  specText: string,
  query: string,
  documentTitle = "requirements.md",
  model = "claude-haiku-4-5",
): Promise<CitedAnswer> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    // Lesson: send document as a `document` block with citations enabled.
    // For plain text: source.type = "text", returns CitationCharLocation (char offsets).
    // For PDFs: source.type = "base64", media_type = "application/pdf", returns page numbers.
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "text",
              media_type: "text/plain",
              data: specText,
            },
            title: documentTitle,
            citations: { enabled: true },
          } as unknown as import("@anthropic-ai/sdk").ContentBlockParam,
          {
            type: "text",
            text: query,
          },
        ],
      },
    ],
  });

  // Lesson: with citations enabled the response has alternating blocks:
  //   text_block  — Claude's prose answer
  //   citation_block — the exact spec fragment it's referencing
  // We gather all text into `answer` and all citations into `citations[]`.
  let answer = "";
  const citations: SpecCitation[] = [];

  for (const block of response.content) {
    if (block.type === "text") {
      answer += block.text;
    } else if ((block as Record<string, unknown>).type === "citations") {
      // citation_block shape (SDK may expose this as a generic object):
      // { type: "citations", citations: [ { cited_text, document_index, document_title,
      //     start_char_index, end_char_index } ] }
      const raw = block as Record<string, unknown>;
      const list = (raw["citations"] as Record<string, unknown>[]) ?? [];
      for (const c of list) {
        citations.push({
          citedText:       String(c["cited_text"]       ?? ""),
          documentTitle:   String(c["document_title"]   ?? documentTitle),
          startCharIndex:  Number(c["start_char_index"] ?? 0),
          endCharIndex:    Number(c["end_char_index"]   ?? 0),
        });
      }
    }
  }

  return { answer, citations };
}

