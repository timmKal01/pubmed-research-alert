# PubMed Research Alert — New Papers by Keyword & Author

Search newly indexed biomedical and life-science papers by keyword,
author, or journal. Get title, authors, journal, publication date, DOI,
and PubMed link — most recent first.

Built for pharma/biotech competitive intelligence tracking research in a
therapeutic area or from a specific lab, and researchers doing literature
monitoring without checking PubMed by hand.

## Input

```json
{
  "keyword": "CRISPR",
  "author": "Smith J",
  "journal": "Nature",
  "daysBack": 14,
  "maxResults": 25
}
```

| Field | Type | Description |
|---|---|---|
| `keyword` | string | Free-text search across titles, abstracts, and MeSH terms. Leave blank to skip. |
| `author` | string | Author name, PubMed format (e.g. "Smith J"). Leave blank for all authors. |
| `journal` | string | Journal name (e.g. "Nature", "The Lancet"). Leave blank for all journals. |
| `daysBack` | number | How many days back from today to search, by publication date. Default `14`, max `365`. |
| `maxResults` | number | Max papers to return, most recent first. Default `25`, max `100`. |

## Output

One record per paper:

```json
{
  "pmid": "42581041",
  "title": "UNCOVERseq enables sensitive and controlled gene editing off-target nomination across CRISPR-Cas modalities and systems.",
  "authors": ["Kinney KJ", "Jia K", "Zhang H"],
  "journal": "Nature communications",
  "pubDate": "2026 Aug 11",
  "epubDate": "2026 Aug 11",
  "doi": "10.1038/s41467-026-74623-7",
  "doiUrl": "https://doi.org/10.1038/s41467-026-74623-7",
  "pmcId": null,
  "pubmedUrl": "https://pubmed.ncbi.nlm.nih.gov/42581041/"
}
```

## How it works

Direct calls to the official [NCBI E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25501/)
API (`eutils.ncbi.nlm.nih.gov`) — the same public interface behind
PubMed's own search. No API key, no proxy, no login, no scraping.

## Pricing note

Billed per **search**, not per paper returned — one charge whether the
search returns 1 paper or 100.

## Related products

Looking for other biotech/pharma signals?

- [Clinical Trial Tracker](https://github.com/timmKal01/clinical-trial-tracker) — new/terminated clinical trials by sponsor and condition
- [Product Recall Alert](https://github.com/timmKal01/product-recall-alert) — FDA drug/food/device recalls
