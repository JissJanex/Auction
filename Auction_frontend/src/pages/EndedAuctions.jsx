import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import AuctionCard from "../components/AuctionCard";
import { Link } from "react-router-dom";

function EndedAuctions() {
    const [endedAuctions, setEndedAuctions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAuctions = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/auctions/ended`);
            setEndedAuctions(response.data);
        } catch (error) {
            console.error("Error fetching auctions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuctions();
    }, []);

    if (loading) {
        return null;
    }

    if (endedAuctions.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">No Ended Auctions</div>
                <h3 className="empty-state-title">Nothing has ended yet</h3>
                <p>Check back later or explore live auctions.</p>
                <div className="action-buttons" style={{ marginTop: "var(--space-4)" }}>
                    <Link to="/">
                        <button className="btn btn-outline">View Live Auctions</button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Ended Auctions</h1>
                <p className="page-subtitle">Browse auctions that have concluded</p>
            </div>

            <div className="auctions-grid">
                {endedAuctions.map((auction) => (
                    <AuctionCard key={auction.id} auction={auction} />
                ))}
            </div>

            <div className="action-buttons" style={{ marginTop: "var(--space-6)" }}>
                <Link to="/">
                    <button className="btn btn-primary">Back to Live Auctions</button>
                </Link>
            </div>
        </div>
    );
}
export default EndedAuctions;