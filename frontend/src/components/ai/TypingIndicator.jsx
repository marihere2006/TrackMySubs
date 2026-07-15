const TypingIndicator = () => {
  return (
    <div className="ai-message ai-message-assistant">
      <div className="ai-messageAvatar">AI</div>
      <div className="ai-messageBubble ai-messageBubble-assistant ai-typingBubble">
        <div className="ai-typing">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
