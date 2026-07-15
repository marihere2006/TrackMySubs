import { normalizeAssistantText } from '../../utils/aiAssistantUtils';

const EmptyConversation = ({ icon: Icon, title, description, prompts = [], insights = [], onPrompt }) => {
  return (
    <div className="ai-emptyState">
      <div className="ai-emptyIcon">
        {Icon && <Icon size={32} />}
      </div>
      <h3 className="ai-emptyTitle">{normalizeAssistantText(title)}</h3>
      <p className="ai-emptyCopy">{normalizeAssistantText(description)}</p>

      {insights.length > 0 && (
        <div className="ai-emptyInsightGrid">
          {insights.map((insight) => (
            <div key={insight.label} className="ai-emptyInsight">
              <span className="ai-emptyInsightLabel">{normalizeAssistantText(insight.label)}</span>
              <strong className="ai-emptyInsightValue">{normalizeAssistantText(insight.value)}</strong>
            </div>
          ))}
        </div>
      )}

      {prompts.length > 0 && (
        <div className="ai-emptyPromptGrid">
          {prompts.map((prompt) => {
            const label = normalizeAssistantText(prompt);
            return (
              <button
                key={label}
                type="button"
                className="ai-emptyPrompt"
                onClick={() => onPrompt?.(label)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmptyConversation;
