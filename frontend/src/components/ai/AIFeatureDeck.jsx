import { ArrowRight, BadgeDollarSign, BrainCircuit, Clock3, Gauge, History, Layers3, ShieldCheck, Sparkles, Target, Repeat } from 'lucide-react';
import { useAI } from '../../hooks/useAI';
import { AI_FEATURES, AI_TOOL_GROUPS } from '../../data/aiAssistantData';

const FEATURE_ICONS = {
  budget_planner: Target,
  cost_optimizer: BadgeDollarSign,
  what_if: Repeat,
  renewal_advisor: Clock3,
  health_score: ShieldCheck,
  monthly_review: History,
  forecast: Gauge,
  duplicates: Layers3,
  coach: BrainCircuit,
};

const AIFeatureDeck = ({ onLaunch }) => {
  const {
    startWorkflow,
  } = useAI();

  const featureMap = new Map(AI_FEATURES.map((feature) => [feature.id, feature]));

  const handleLaunch = (feature) => {
    if (!feature) return;
    onLaunch?.();
    startWorkflow?.(feature.intent);
  };

  return (
    <div className="ai-toolDeck">
      <div className="ai-toolHero">
        <div>
          <div className="ai-toolKicker">Assistant workspace</div>
          <h3 className="ai-toolHeroTitle">Everything TrackMySubs AI can do</h3>
        </div>
        <p className="ai-toolHeroCopy">
          Launch budget planning, optimization, what-if analysis, renewals, and duplicate detection from one focused copilot.
        </p>
      </div>

      {AI_TOOL_GROUPS.map((group) => (
        <section key={group.title} className="ai-toolGroup">
          <div className="ai-toolGroupHeader">
            <div>
              <h4 className="ai-toolGroupTitle">{group.title}</h4>
              <p className="ai-toolGroupCopy">{group.description}</p>
            </div>
          </div>

          <div className="ai-toolGrid">
            {group.featureIds.map((featureId) => {
              const feature = featureMap.get(featureId);
              if (!feature) return null;
              const Icon = FEATURE_ICONS[feature.intent] || Sparkles;

              return (
                <button
                  key={feature.id}
                  type="button"
                  className={`ai-toolCard ai-toolCard-${feature.tone || 'neutral'}`}
                  onClick={() => handleLaunch(feature)}
                >
                  <div className="ai-toolCardHeader">
                    <span className="ai-toolCardIcon" aria-hidden="true">
                      <Icon size={16} />
                    </span>
                    <div className="ai-toolCardText">
                      <div className="ai-toolCardTitle">{feature.title}</div>
                      <div className="ai-toolCardDesc">{feature.description}</div>
                    </div>
                  </div>

                  <div className="ai-toolCardMeta">
                    <span>{feature.intent.replaceAll('_', ' ')}</span>
                    <ArrowRight size={14} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}

  </div>
);
};

export default AIFeatureDeck;
