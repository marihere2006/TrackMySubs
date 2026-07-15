import Button from '../ui/Button';
import { normalizeAssistantText } from '../../utils/aiAssistantUtils';

const SuggestionChips = ({ prompts = [], onPrompt }) => {
  if (!prompts.length) return null;

  return (
    <div className="ai-chipRail" aria-label="Suggested prompts">
      {prompts.map((prompt) => {
        const label = normalizeAssistantText(prompt);
        return (
          <Button
            key={label}
            size="sm"
            variant="secondary"
            className="ai-chip"
            onClick={() => onPrompt?.(label)}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
};

export default SuggestionChips;
