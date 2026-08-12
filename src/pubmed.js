const UA = 'PubMedResearchAlert/0.1 (+contact: pubmed-research-alert-admin@example.com)';
const EUTILS_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

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
    const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': UA } });
    if (!searchRes.ok) throw new Error(`PubMed esearch failed: ${searchRes.status}`);
    const searchData = await searchRes.json();

    const ids = searchData.esearchresult?.idlist ?? [];
    if (ids.length === 0) return [];

    const summaryUrl = `${EUTILS_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    const summaryRes = await fetch(summaryUrl, { headers: { 'User-Agent': UA } });
    if (!summaryRes.ok) throw new Error(`PubMed esummary failed: ${summaryRes.status}`);
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
