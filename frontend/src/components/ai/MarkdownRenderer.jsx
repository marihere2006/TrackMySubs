import { Fragment } from 'react';
import { normalizeAssistantText } from '../../utils/aiAssistantUtils';

const INLINE_TOKEN = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

const renderInline = (text, keyPrefix) => {
  const value = normalizeAssistantText(text);
  const nodes = [];
  let cursor = 0;

  for (const match of value.matchAll(INLINE_TOKEN)) {
    const [token] = match;
    const start = match.index ?? 0;

    if (start > cursor) {
      nodes.push(<Fragment key={`${keyPrefix}-t-${cursor}`}>{value.slice(cursor, start)}</Fragment>);
    }

    if (token.startsWith('`')) {
      nodes.push(<code key={`${keyPrefix}-c-${start}`}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith('**')) {
      nodes.push(<strong key={`${keyPrefix}-b-${start}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      nodes.push(<em key={`${keyPrefix}-i-${start}`}>{token.slice(1, -1)}</em>);
    } else {
      const [, label = '', href = ''] = token.match(/\[([^\]]+)\]\(([^)]+)\)/) || [];
      nodes.push(
        <a key={`${keyPrefix}-l-${start}`} href={href} target="_blank" rel="noreferrer">
          {label}
        </a>,
      );
    }

    cursor = start + token.length;
  }

  if (cursor < value.length) {
    nodes.push(<Fragment key={`${keyPrefix}-t-${cursor}`}>{value.slice(cursor)}</Fragment>);
  }

  return nodes.length ? nodes : value;
};

const MarkdownRenderer = ({ content = '' }) => {
  const lines = normalizeAssistantText(content).split(/\r?\n/);
  const blocks = [];
  let lineIndex = 0;
  let blockIndex = 0;

  const pushParagraph = (buffer) => {
    const text = buffer.join(' ').trim();
    if (!text) return;
    blockIndex += 1;
    blocks.push(<p key={`p-${blockIndex}`}>{renderInline(text, `p-${blockIndex}`)}</p>);
  };

  const isListItem = (line) => /^(\s*[-*•]|\s*\d+\.)\s+/.test(line);

  while (lineIndex < lines.length) {
    const raw = lines[lineIndex];
    const line = raw.trim();

    if (!line) {
      lineIndex += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const language = line.replace(/^```+/, '').trim();
      const codeLines = [];
      lineIndex += 1;
      while (lineIndex < lines.length && !lines[lineIndex].trim().startsWith('```')) {
        codeLines.push(lines[lineIndex]);
        lineIndex += 1;
      }
      lineIndex += 1;
      blockIndex += 1;
      blocks.push(
        <pre key={`code-${blockIndex}`} className="ai-codeBlock">
          {language ? <span className="ai-codeLang">{language}</span> : null}
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      const title = line.replace(/^#{1,3}\s+/, '');
      const Tag = line.startsWith('###') ? 'h4' : line.startsWith('##') ? 'h3' : 'h2';
      blockIndex += 1;
      blocks.push(<Tag key={`h-${blockIndex}`}>{renderInline(title, `h-${blockIndex}`)}</Tag>);
      lineIndex += 1;
      continue;
    }

    if (/^>\s+/.test(line)) {
      blockIndex += 1;
      blocks.push(
        <blockquote key={`q-${blockIndex}`}>
          {renderInline(line.replace(/^>\s+/, ''), `q-${blockIndex}`)}
        </blockquote>,
      );
      lineIndex += 1;
      continue;
    }

    if (isListItem(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      while (lineIndex < lines.length && isListItem(lines[lineIndex].trim())) {
        const item = lines[lineIndex].trim().replace(/^(\s*[-*•]|\s*\d+\.)\s+/, '');
        items.push(item);
        lineIndex += 1;
      }
      const ListTag = ordered ? 'ol' : 'ul';
      blockIndex += 1;
      blocks.push(
        <ListTag key={`list-${blockIndex}`}>
          {items.map((item, itemIndex) => (
            <li key={`list-${blockIndex}-${itemIndex}`}>{renderInline(item, `li-${blockIndex}-${itemIndex}`)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    if (line.includes('|') && lineIndex + 1 < lines.length && /[-:\s|]/.test(lines[lineIndex + 1])) {
      const tableLines = [line];
      lineIndex += 1;
      while (lineIndex < lines.length && lines[lineIndex].includes('|')) {
        tableLines.push(lines[lineIndex].trim());
        lineIndex += 1;
      }
      const rows = tableLines.map((row) => row.split('|').map((cell) => cell.trim()).filter(Boolean));
      const [headers, ...body] = rows;
      blockIndex += 1;
      blocks.push(
        <div key={`table-${blockIndex}`} className="ai-markdownTableWrap">
          <table className="ai-markdownTable">
            <thead>
              <tr>
                {headers.map((header, headerIndex) => (
                  <th key={`th-${blockIndex}-${headerIndex}`}>{renderInline(header, `th-${blockIndex}-${headerIndex}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={`tr-${blockIndex}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`td-${blockIndex}-${rowIndex}-${cellIndex}`}>{renderInline(cell, `td-${blockIndex}-${rowIndex}-${cellIndex}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const buffer = [line];
    lineIndex += 1;
    while (lineIndex < lines.length) {
      const next = lines[lineIndex].trim();
      if (!next || next.startsWith('#') || next.startsWith('>') || next.startsWith('```') || isListItem(next) || next.includes('|')) {
        break;
      }
      buffer.push(next);
      lineIndex += 1;
    }
    pushParagraph(buffer);
  }

  return <div className="ai-markdown">{blocks}</div>;
};

export default MarkdownRenderer;
