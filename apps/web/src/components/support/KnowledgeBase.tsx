import type { KnowledgeBaseArticle } from "@nebula/shared";

interface KnowledgeBaseProps {
  articles: KnowledgeBaseArticle[];
}

export const KnowledgeBase = ({ articles }: KnowledgeBaseProps) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Knowledge Base</p>
          <h3 className="text-xl font-semibold text-text">Sofort Antworten</h3>
        </div>
        <button className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted transition hover:border-accent/40 hover:text-accent">
          Manage Docs
        </button>
      </div>
      <ul className="mt-4 space-y-3 text-sm text-muted">
        {articles.map((article) => (
          <li key={article.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-text">{article.title}</p>
              <span className="text-xs text-muted">Last update {new Date(article.lastUpdated).toLocaleDateString()}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{article.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
              {article.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 px-2 py-0.5">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted/80">
              <span>Confidence {Math.round(article.confidence * 100)}%</span>
              <span>{article.views} views</span>
              <span>{article.helpfulVotes} helpful</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
