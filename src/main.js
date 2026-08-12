import { Actor, log } from 'apify';
import { fetchPapers } from './pubmed.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { keyword, author, journal, daysBack = 14, maxResults = 25 } = input;

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const RESEARCH_SEARCH_EVENT = 'research-search';

const endDate = new Date();
const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

const papers = await fetchPapers({
    keyword,
    author,
    journal,
    startDate,
    endDate,
    limit: Math.min(maxResults, 100),
});

for (const paper of papers) {
    await Actor.pushData(paper);
}

await Actor.charge({ eventName: RESEARCH_SEARCH_EVENT });

log.info(`Pushed ${papers.length} paper(s)`);

await Actor.exit();
