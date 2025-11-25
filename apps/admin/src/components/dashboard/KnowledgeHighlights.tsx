import { Card } from '../ui/Card';
import { knowledgeBaseArticles } from '@nebula/shared';

export function KnowledgeHighlights() {
  const recentKnowledge = knowledgeBaseArticles.slice(0, 3);

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Knowledge Highlights</h2>
      <div className="space-y-3">
        {recentKnowledge.map((article) => (
          <div key={article.id} className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
            <p className="text-text font-medium">{article.title}</p>
            <p className="mt-1 text-xs text-muted">
              {Math.round(article.confidence * 100)}% confidence | {article.helpfulVotes} helpful votes
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
