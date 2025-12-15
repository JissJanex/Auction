# 🔨 Auction Platform

A real-time auction platform where users can create auctions, place bids, and receive live updates via WebSockets.

## 🚀 Live Demo

**[View Live Site →](https://auction-eight-eta.vercel.app)**

**Deployment Stack:**
- Frontend: Vercel
- Backend: Render
- Database: Supabase (PostgreSQL)
- Images: Cloudinary

## 🛠️ Tech Stack

**Frontend:**
- React
- Vite
- React Router
- Socket.IO Client
- Axios
- React Toastify

**Backend:**
- Node.js
- Express
- Socket.IO
- PostgreSQL
- JWT
- Bcrypt
- Multer
- Cloudinary

## ✨ Features

- ✅ User authentication (signup/login with JWT)
- ✅ Create auctions with title, description, image, and time range
- ✅ Real-time bidding with Socket.IO
- ✅ Live bid updates across all connected clients
- ✅ Auction status tracking (upcoming, active, ended)
- ✅ Winner announcement when auction ends
- ✅ View ended auctions
- ✅ Image upload to Cloudinary
- ✅ Responsive design

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

-- Auctions table
CREATE TABLE auctions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  current_bid DECIMAL(10, 2) DEFAULT 0.00,
  owner_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bids table
CREATE TABLE bids (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  user_name VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
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
- `GET /auctions` - Get all active/upcoming auctions
- `GET /auctions/ended` - Get all ended auctions
- `GET /auctions/:id` - Get single auction details
- `POST /auctions` - Create new auction (requires auth)

### Bids
- `GET /bids?auction_id=:id` - Get all bids for an auction
- WebSocket event `placeBid` - Place a new bid (real-time)

## 🔌 WebSocket Events

### Client → Server
- `placeBid` - Place a bid on an auction
  ```javascript
  socket.emit('placeBid', { auction_id, user_id, amount })
  ```

### Server → Client
- `bidUpdate` - New bid placed successfully
  ```javascript
  socket.on('bidUpdate', (bid) => { /* update UI */ })
  ```
- `bidError` - Bid placement error
  ```javascript
  socket.on('bidError', (error) => { /* show error */ })
  ```

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
