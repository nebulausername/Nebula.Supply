import { Star, Users, Sparkles } from "lucide-react";
import type { ProductRating, ProductReviewPreview, ProductSocialProof } from "@nebula/shared";

interface SocialProofPanelProps {
  rating?: ProductRating;
  reviews?: ProductReviewPreview[];
  socialProof?: ProductSocialProof;
  interestCount: number;
  isInterested: boolean;
  onToggleInterest: () => void;
  dense?: boolean;
}

const RatingBadge = ({ rating }: { rating: ProductRating }) => (
  <div className="flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-sm text-accent">
    <Star className="h-3.5 w-3.5 fill-current" />
    <span>{rating.average.toFixed(1)}</span>
    <span className="text-xs text-muted">({rating.count})</span>
  </div>
);

const ReviewSnippet = ({ review }: { review: ProductReviewPreview }) => (
  <figure className="space-y-2 rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-muted">
    <figcaption className="flex items-center justify-between text-text">
      <span className="font-medium">{review.author}</span>
      <span className="flex items-center gap-1 text-accent">
        <Star className="h-3 w-3 fill-current" />
        {review.rating.toFixed(1)}
      </span>
    </figcaption>
    <p className="text-sm font-medium text-text">{review.headline}</p>
    <p>{review.body}</p>
  </figure>
);

export const SocialProofPanel = ({
  rating,
  reviews,
  socialProof,
  interestCount,
  isInterested,
  onToggleInterest,
  dense
}: SocialProofPanelProps) => {
  const featuredReview = rating?.featuredReviewId
    ? reviews?.find((review) => review.id === rating.featuredReviewId)
    : reviews?.[0];

  const containerClasses = dense
    ? "space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4"
    : "space-y-4 rounded-2xl border border-white/10 bg-black/30 p-5";
  const interestTextClass = dense ? "text-base" : "text-lg";

  return (
    <section className={containerClasses} aria-labelledby="product-social-proof">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted" id="product-social-proof">
            Social Proof
          </p>
          <p className={`${interestTextClass} font-semibold text-text`}>{interestCount} Interessenten</p>
          {socialProof?.purchases24h ? (
            <p className="text-[11px] text-muted">
              {socialProof.purchases24h} Käufe in den letzten 24h
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggleInterest}
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            isInterested
              ? "border border-accent/40 bg-accent/15 text-accent"
              : "border border-white/15 text-muted hover:border-accent hover:text-accent"
          }`}
          aria-pressed={isInterested}
        >
          <Users className={`h-3.5 w-3.5 ${isInterested ? "text-accent" : ""}`} />
          {isInterested ? " Beobachtet" : " Beobachten"}
        </button>
      </header>

      <div className="flex flex-col gap-3">
        {rating ? <RatingBadge rating={rating} /> : <p className="text-xs text-muted">Sei der Erste, der bewertet.</p>}

        {featuredReview ? <ReviewSnippet review={featuredReview} /> : null}
      </div>

      {socialProof?.badges?.length ? (
        <ul className="flex flex-wrap gap-2 text-[11px] text-muted">
          {socialProof.badges.map((badge) => (
            <li
              key={badge}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted"
            >
              <Sparkles className="h-3 w-3 text-accent" />
              {badge}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};
