import Button from '../ui/Button';
import { normalizeAssistantText } from '../../utils/aiAssistantUtils';

const toneClass = (tone = 'neutral') => `ai-metric ai-metric-${tone}`;
const text = (value) => normalizeAssistantText(value ?? '');

const AIResponseCards = ({ cards = [], onAction }) => {
  if (!cards.length) return null;

  return (
    <div className="ai-responseStack">
      {cards.map((card, cardIndex) => (
        <article key={`${card.type || 'card'}-${text(card.title)}-${cardIndex}`} className="ai-responseCard">
          <div className="ai-responseHeader">
            <div>
              <div className="ai-responseEyebrow">{text(card.badge || 'Insight')}</div>
              <h3 className="ai-responseTitle">{text(card.title || 'Insight')}</h3>
            </div>
            {card.summary && <p className="ai-responseSummary">{text(card.summary)}</p>}
          </div>

          {Array.isArray(card.metrics) && card.metrics.length > 0 && (
            <div className="ai-metricGrid">
              {card.metrics.map((metric, metricIndex) => (
                <div key={`${cardIndex}-${text(metric.label)}-${metricIndex}`} className={toneClass(metric.tone)}>
                  <span className="ai-metricLabel">{text(metric.label)}</span>
                  <span className="ai-metricValue">{text(metric.value)}</span>
                </div>
              ))}
            </div>
          )}

          {Array.isArray(card.items) && card.items.length > 0 && (
            <div className="ai-responseItems">
              {card.items.map((item, itemIndex) => (
                <div key={`${cardIndex}-${text(item.title)}-${itemIndex}`} className="ai-responseItem">
                  <div className="ai-responseItemTitle">{text(item.title)}</div>
                  {item.subtitle && <div className="ai-responseItemSub">{text(item.subtitle)}</div>}
                  {item.reason && <div className="ai-responseItemReason">{text(item.reason)}</div>}
                </div>
              ))}
            </div>
          )}

          {card.table && Array.isArray(card.table.rows) && card.table.rows.length > 0 && (
            <div className="ai-responseTableWrap">
              {card.table.caption && <div className="ai-responseTableCaption">{text(card.table.caption)}</div>}
              <table className="ai-responseTable">
                <thead>
                  <tr>
                    {card.table.headers?.map((header, headerIndex) => (
                      <th key={`${cardIndex}-header-${headerIndex}`}>{text(header)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {card.table.rows.map((row, rowIndex) => (
                    <tr key={`${cardIndex}-row-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${cardIndex}-row-${rowIndex}-cell-${cellIndex}`}>{text(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {card.progress && (
            <div className="ai-progressBlock">
              <div className="ai-progressHead">
                <span>{text(card.progress.label)}</span>
                <strong>{Number(card.progress.value || 0)}%</strong>
              </div>
              <div className="ai-progressTrack" aria-hidden="true">
                <div
                  className="ai-progressFill"
                  style={{ width: `${Math.max(0, Math.min(100, Number(card.progress.value || 0)))}%` }}
                />
              </div>
              {card.progress.description && <div className="ai-progressNote">{text(card.progress.description)}</div>}
            </div>
          )}

          {Array.isArray(card.details) && card.details.length > 0 && (
            <div className="ai-detailsList">
              {card.details.map((detail, detailIndex) => (
                <details key={`${cardIndex}-${text(detail.title)}-${detailIndex}`} className="ai-detailItem">
                  <summary className="ai-detailSummary">{text(detail.title)}</summary>
                  <div className="ai-detailContent">{text(detail.content)}</div>
                </details>
              ))}
            </div>
          )}

          {card.note && <div className="ai-responseNote">{text(card.note)}</div>}

          {Array.isArray(card.actions) && card.actions.length > 0 && (
            <div className="ai-responseActions">
              {card.actions.map((action, actionIndex) => (
                <Button
                  key={`${cardIndex}-${text(action.label)}-${actionIndex}`}
                  size="sm"
                  variant="ghost"
                  onClick={() => onAction?.(action)}
                >
                  {text(action.label)}
                </Button>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
};

export default AIResponseCards;
