function WinnerModal({ isOpen, onClose, winner }) {
  if (!isOpen) return null;
  const { role, winnerName, winningBid } = winner || {};

  const title =
    role === "owner"
      ? "Auction Ended"
      : role === "winner"
      ? "You Won!"
      : "Auction Result";

  // Pick exactly one message to render
  let message;
  if (winnerName == null && (!winningBid || Number(winningBid) === 0)) {
    message = <>Auction has ended. No bids were placed.😥</>;
  } else if (role === "owner") {
    message = (
      <>
        Your auction has ended. Winning bid: <strong>${winningBid}</strong> by{" "}
        <strong>{winnerName || "—"}</strong>.
      </>
    );
  } else if (role === "winner") {
    message = (
      <>
        Congratulations — you won! Your bid of <strong>${winningBid}</strong>{" "}
        was the highest.
      </>
    );
  } else if (role === "loser") {
    message = (
      <>
        Auction has ended. Winning bid: <strong>${winningBid}</strong> by{" "}
        <strong>{winnerName || "—"}</strong>. Better luck next time.
      </>
    );
  } else {
    message = (
      <>
        Auction has ended. Winning bid: <strong>${winningBid}</strong> by{" "}
        <strong>{winnerName || "—"}</strong>.
      </>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 6L9.5 13 4 9l7-1z" />
          </svg>
        </div>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button
            onClick={onClose}
            className="btn btn-accent modal-btn-confirm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default WinnerModal;
