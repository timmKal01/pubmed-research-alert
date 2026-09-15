const UA = 'PubMedResearchAlert/0.1 (+contact: pubmed-research-alert-admin@example.com)';
const EUTILS_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 15_000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options) {
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let res;
        try {
            res = await fetch(url, { ...options, signal: controller.signal });
        } catch (err) {
            lastError = err.name === 'AbortError' ? new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms: ${url}`) : err;
            if (attempt < MAX_ATTEMPTS) {
                await sleep(1000 * 2 ** (attempt - 1));
                continue;
            }
            throw lastError;
        } finally {
            clearTimeout(timeoutId);
        }
        if (res.ok) return res;
        if (!TRANSIENT_STATUSES.has(res.status)) {
            throw new Error(`PubMed request failed: ${res.status} ${res.statusText}`);
        }
        lastError = new Error(`PubMed request failed: ${res.status} ${res.statusText}`);
        if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1));
    }
    throw lastError;
}

function isoDate(d) {
    return d.toISOString().slice(0, 10).replace(/-/g, '/');
}

function buildTerm({ keyword, author, journal, startDate, endDate }) {
    const clauses = [`("${isoDate(startDate)}"[pdat] : "${isoDate(endDate)}"[pdat])`];
    if (keyword) clauses.push(keyword);
    if (author) clauses.push(`${author}[Author]`);
    if (journal) clauses.push(`${journal}[Journal]`);
    return clauses.join(' AND ');
}

function findId(articleIds, type) {
    return articleIds?.find((a) => a.idtype === type)?.value ?? null;
}

export async function fetchPapers({ keyword, author, journal, startDate, endDate, limit }) {
    const term = buildTerm({ keyword, author, journal, startDate, endDate });

    const searchUrl = `${EUTILS_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmax=${limit}&sort=most+recent&retmode=json`;
    const searchRes = await fetchWithRetry(searchUrl, { headers: { 'User-Agent': UA } });
    const searchData = await searchRes.json();

    const ids = searchData.esearchresult?.idlist ?? [];
    if (ids.length === 0) return [];

    const summaryUrl = `${EUTILS_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    const summaryRes = await fetchWithRetry(summaryUrl, { headers: { 'User-Agent': UA } });
    const summaryData = await summaryRes.json();

    return ids
        .map((id) => summaryData.result?.[id])
        .filter(Boolean)
        .map((article) => {
            const doi = findId(article.articleids, 'doi');
            return {
                pmid: article.uid,
                title: article.title,
                authors: (article.authors ?? []).map((a) => a.name),
                journal: article.fulljournalname,
                pubDate: article.pubdate,
                epubDate: article.epubdate || null,
                doi,
                doiUrl: doi ? `https://doi.org/${doi}` : null,
                pmcId: findId(article.articleids, 'pmc'),
                pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${article.uid}/`,
            };
        });
}
