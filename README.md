# 🔨 Auction Platform

A real-time auction platform with support for regular auctions, Dutch auctions, and automatic bidding. Users can create auctions, place bids, set up autobids, and receive live updates via WebSockets.

## 🚀 Live Demo

**[View Live Site →](https://auction-eight-eta.vercel.app)**

**Deployment Stack:**
- Frontend: Vercel
- Backend: Render
- Database: Supabase (PostgreSQL)
- Images: Cloudinary

## 🛠️ Tech Stack

**Frontend:**
- React 19.2.0
- Vite 7.2.4
- Socket.IO Client 4.8.1
- Axios 1.7.9
- React Toastify 11.0.2

**Backend:**
- Node.js
- Express 5.2.1
- Socket.IO 4.8.1
- PostgreSQL (via node-postgres)
- JWT (jsonwebtoken 9.0.2)
- Bcrypt 5.1.1
- Cloudinary 2.5.1

## ✨ Features

### Core Features
- ✅ User authentication (signup/login with JWT)
- ✅ Create auctions with title, description, image, and time range
- ✅ Real-time bidding with Socket.IO
- ✅ Winner announcement modal when auction ends
- ✅ Image upload to Cloudinary

### Advanced Features

#### 🤖 AutoBid System
- **Automatic Bidding**: Set a maximum bid and increment amount
- **Chain Processing**: System automatically places bids when outbid, up to your maximum
- **Real-time Updates**: See autobid activity in real-time

#### 📉 Dutch Auction
- **Reverse Pricing**: Price starts high and decreases over time
- **Configurable Drop Rate**: Set starting price, price drop amount, and drop interval
- **Real-time Price Updates**: Watch the price drop live via WebSockets
- **Instant Purchase**: No bidding wars—just buy at the current price

## 🏃 Running Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL database
- Cloudinary account
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/JissJanex/Auction.git
cd Auction
```

### 2. Backend Setup

```bash
cd Auction_backend
npm install
```

Create a `.env` file in `Auction_backend/` with:
```env
PORT=3000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Cloudinary
CLOUD_NAME=your_cloud_name
CLOUD_API_KEY=your_api_key
CLOUD_API_SECRET=your_api_secret
```

Start the backend server:
```bash
npm start
# or with nodemon for development:
nodemon server.js
```

Backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd ../Auction_frontend
npm install
```

Create a `.env` file in `Auction_frontend/` with:
```env
VITE_BACKEND_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

Start the frontend dev server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Database Setup

Create the required PostgreSQL tables:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Auctions table (supports both regular and Dutch auctions)
CREATE TABLE auctions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  current_bid DECIMAL(10, 2) DEFAULT 0.00,
  owner_id INTEGER REFERENCES users(id),
  auction_type VARCHAR(50) DEFAULT 'normal', -- 'normal' or 'dutch'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bids table (for regular auctions)
CREATE TABLE bids (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  user_name VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AutoBids table
CREATE TABLE auto_bids (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  max_bid DECIMAL(10, 2) NOT NULL,
  bid_increment DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(auction_id, user_id)
);

-- Dutch Auctions table
CREATE TABLE dutch_auctions (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE UNIQUE,
  start_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  price_drop DECIMAL(10, 2) NOT NULL,
  drop_interval_minutes INTEGER NOT NULL,
  winner_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🌐 Environment Variables

### Backend (`.env`)
| Variable | Description | Example |
|----------|-------------|---------||
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `BACKEND_URL` | Backend URL (optional) | `http://localhost:3000` |
| `CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `CLOUD_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUD_API_SECRET` | Cloudinary API secret | `your-secret` |

### Frontend (`.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend API URL | `http://localhost:3000` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:3000` |

## 📝 API Endpoints

### Authentication
- `POST /auth/signup` - Create new user account
- `POST /auth/login` - Login and receive JWT token

### Auctions
- `GET /auctions` - Get all active/upcoming auctions (excludes sold Dutch auctions)
- `GET /auctions/ended` - Get all ended auctions (includes sold Dutch auctions)
- `GET /auctions/:id` - Get single auction details
- `POST /auctions` - Create new regular auction (requires auth)

### Dutch Auctions
- `GET /dutchauctions/:id` - Get Dutch auction-specific details
- `POST /dutchauctions` - Create new Dutch auction (requires auth)
  - Body: `title`, `description`, `image`, `start_time`, `end_time`, `start_price`, `price_drop`, `drop_interval_minutes`

### Bids (Regular Auctions)
- `GET /bids?auction_id=:id` - Get all bids for an auction
- WebSocket event `placeBid` - Place a new bid (real-time)

### Dutch Bids
- `POST /dutchbids/buy/:id` - Purchase Dutch auction at current price (requires auth)

### AutoBids
- `GET /autobids/check/:auction_id` - Check if user has an autobid on auction (requires auth)
- `POST /autobids` - Create/update autobid (requires auth)
  - Body: `auction_id`, `max_bid`, `bid_increment`
- `DELETE /autobids/:auction_id` - Remove autobid (requires auth)

## 🔌 WebSocket Events

### Client → Server
- `placeBid` - Place a bid on an auction
  ```javascript
  socket.emit('placeBid', { auction_id, user_id, amount })
  ```

### Server → Client
- `bidUpdate` - New bid placed successfully (manual or autobid)
  ```javascript
  socket.on('bidUpdate', (bid) => {
    // bid.isAutobid indicates if it was an automatic bid
    // bid.previousHighestBidder contains the outbid user's ID
  })
  ```
- `bidError` - Bid placement error
  ```javascript
  socket.on('bidError', (error) => { /* show error */ })
  ```
- `dutchAuctionPriceUpdate` - Dutch auction price dropped
  ```javascript
  socket.on('dutchAuctionPriceUpdate', ({ auction_id, new_price }) => {
    // Update UI with new price
  })
  ```
- `dutchAuctionSold` - Dutch auction was purchased
  ```javascript
  socket.on('dutchAuctionSold', ({ auction_id, winner_id, final_price }) => {
    // Show winner modal
  })
  ```

## 🎯 How It Works

### Regular Auctions
1. **Create**: Set title, description, image, start/end times
2. **Bid**: Users place manual bids or set up autobids
3. **AutoBid Chain**: When outbid, autobidders automatically counter-bid up to their max
4. **Winner**: Highest bidder when time expires wins

### Dutch Auctions
1. **Create**: Set starting price, price drop amount, and drop interval
2. **Price Drops**: Price automatically decreases at specified intervals
3. **Purchase**: First user to buy at current price wins immediately
4. **Real-time**: All viewers see price drops in real-time

### AutoBid System
1. **Setup**: User sets maximum bid and increment amount
2. **Trigger**: Autobid activates when user is outbid
3. **Chain**: Multiple autobidders compete until one reaches their max
4. **Notification**: Users notified when outbid by manual vs automatic bids

## 🤝 Contributing

Contributions are welcome! Feel free to:
- 🐛 Report bugs
- 💡 Suggest new features
- 🔧 Submit pull requests
- 📖 Improve documentation

Please open an issue first to discuss major changes.

## 📄 License

This project is licensed under the ISC License.

## 👤 Author

**Jiss Janex**
- GitHub: [@JissJanex](https://github.com/JissJanex)

---

Made with ❤️ using React, Node.js, and PostgreSQL
