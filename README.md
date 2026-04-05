# ClickPay | Enterprise-Grade Digital Wallet Architecture

ClickPay is a highly scalable, full-stack digital wallet and financial technology platform. Designed to process high-throughput, latency-sensitive transactions, it bridges the gap between conventional mobile-financial services (MFS) and modern web architectures. 

The system leverages a strictly typed, React-driven frontend combined with a highly robust Node.js backend to facilitate complex money flows between Consumers, Agents, and Merchants. At its core, ClickPay prioritizes uncompromised data integrity, implementing advanced concurrency controls and active fraud-heuristic daemons natively within the persistence layer.

## 👥 Engineering Team
- **Wahidul Hoque**  - CSE,BUET
- **Abu Bakar Siddique**  - CSE,BUET

---

## 🛠️ Technology Stack & Infrastructure

### Frontend Client Architecture
- **Framework**: Modern React framework integrating server-side rendering and static generation for optimized initial payload delivery.
- **Languages**: TypeScript, JavaScript (ES6+).
- **Styling UI/UX**: Utility-first CSS fused with bespoke styling for dynamic, responsive presentation.
- **Analytics Visualization**: Interactive charting libraries for rendering comprehensive graphical user and merchant telemetry.

### Backend Microservices & API
- **Runtime**: Node.js ecosystem routing natively via Express.js.
- **Pattern**: Strict n-tier Service-Oriented Architecture (Controllers → Domain Services → Persistence Layer).
- **Security & Auth**: Stateless JWT authentication, role-based access control (RBAC), and cryptographic hashing algorithms securing user credentials and financial pins.

### Database & Concurrency
ClickPay offloads critical validation directly to the relational database layer to achieve absolute Atomicity, Consistency, Isolation, and Durability (ACID).
- **Row-Level Locking**: Pessimistic concurrency control mechanisms are aggressively utilized during transfers, entirely eliminating race conditions and "double-spend" vulnerabilities under heavy loads.
- **Stored Procedures & Triggers**: Utilizing deep procedural SQL routines for rigid transaction validation, blocking improper flows mathematically before they affect structural data.
- **Dynamic Configuration Engine**: Global fees and algorithmic boundaries are driven by a centralized, hot-reloadable configuration store.

---

## 🚀 Key Functional Domains

ClickPay manages multiple discrete financial routing instruments and user hierarchies:
- **Topology Vectors**: Bi-directional routing logic custom-tailored for User-to-User (P2P), Agent-to-User (Cash-in), User-to-Agent (Cash-out), and User-to-Merchant (B2B) payments.
- **Utility Integrations**: Bill payment architectures handling generic network recharges via category-specific identifiers natively.
- **Advanced Yield Vectors**: Standalone credit and savings workflows offering automated algorithmic evaluations and administrative oversight matrices.
- **P2P Requests**: Complete bidirectional money request pooling (initiating, approving, and dynamically declining pending allocations).

---

## 🌟 Core Features & Modules

### 👤 For Users (Consumer App)
- 💸 **Send Money**: Send funds instantly to any user using just their phone number.
- ⭐ **Favourite Contacts**: Save frequently used numbers as "Favourites" for fast and free transfer.
- 📞 **Contact Integration**: Easily find and select recipients from your saved contact list.
- 🏧 **Easy Cash Out**: Withdraw physical cash at any authorized ClickPay Agent point.
- 🧾 **Bill Payments**: Pay your utility bills (Water, Electricity, Gas, Mobile Recharge) and Internet services directly.
- 💰 **Savings & Quick Loans**: Earn interest on savings or apply for instant micro-loans with automated approval.
- 🤝 **Request Money**: Send a polite digital request for funds from friends or family.
- 📅 **Subscriptions**: Set up and manage automatic payments for recurring services.
- 💳 **Linked Banking**: Connect your bank accounts or cards for quick wallet top-ups.
- 🔑 **PIN Reset**: Securely reset your transaction PIN anytime.

### 🏪 For Merchants (Business App)
- 🛒 **Receive Payments**: Collect customer payments quickly via direct phone number entry without any limit.
- 💳 **Wallet Top-up**: Merchants can add money instantly from their linked bank accounts or cards.
- 🏧 **Cash-Out**: Easily withdraw your merchant balance and earnings whenever needed.
- 🔄 **Business Routing**: Send and receive funds across your business network (B2B).
- 💎 **Sales Analytics**: Track your business performance and see where you rank in your region.
- 🗓️ **Subscription Billing**: Manage automated billing cycles for your recurring customers.

### 🕵️ For Agents (Service Points)
- 💵 **Cash-In Services**: Help users deposit money into their digital wallets instantly.
- 🏦 **Cash-Out Fulfillment**: Safely provide physical cash to users and earn automated commissions.
- 📱 **Mobile Recharge**: Provide instant talk-time and data top-ups for any mobile operator.
- 📈 **Performance Leaderboard**: Track your performance against other agents for extra rewards.
- 🛡️ **Assisted Support**: Help users with local verification and secure withdrawal processes.

### 👑 Admin Control Center (System Management)
- 📊 **Multi-Level Analytics**: High-level dashboard with filters for **City**, **Date Ranges**, and **Transaction Types** to monitor regional performance.
- 🛡️ **Fraud Shield & Auto-Freeze**: Real-time fraud detection engine that alerts admins and can automatically freeze high-risk wallets.
- ⚠️ **Loan Default Recovery**: Automated oversight for defaulted loans with options for manual intervention or balance recovery.
- ⏪ **Transaction Reversals**: A powerful tool to safely undo incorrect or disputed transfers, returning money directly to the sender.
- 👥 **User Management**: Full search and control over Users, Agents, and Merchants (KYC approval, account freezing, and status management).
- 💰 **Financial Reconciliation**: Monitor total system liquidity, including incoming/outgoing flows, platform profits, and interest margins.
- ⚙️ **Protocol Hot-Config**: Change service fees, interest rates, and transaction limits instantly across the entire platform.
- 📢 **Broadcast Engine**: Send critical alerts or promotional notifications to the entire user base or specific segments.

### 🔐 Security & Identity
- **Multi-Role Login**: Secure, separate access gateways for Users, Agents, Merchants, and Admins.
- **Brute-Force Protection**: The system automatically locks an account if a transaction PIN is entered incorrectly 5 times in a row.
- **Role-Based Privacy**: Strict rules ensure that sensitive data is only visible to the right people.
---

## 🛡️ Edge Cases & System-Level Resilience Handled

Building a financial platform requires anticipating point-of-failures. ClickPay algorithms handle multiple notoriously complex edge-cases automatically:

1. **Transaction Lifecycle Immutability & Safe Connectivity**
   - ClickPay does not rely merely on primitive state flags. An append-only ledger autonomously tracks every distinct phase of a transaction natively within the database structure. If a transaction hangs or limits are breached, failing notifications operate entirely outside of the atomic lock-chain using independent database connection pools to immediately avoid deadly database deadlocks.
2. **Cyclic Fraud Daemons**
   - A non-blocking asynchronous scanner analyzes real-time heuristic patterns. For instance, successfully executing highly-repetitive transfers of matching values within a tightly bound time window instantly triggers an automated account freeze at the structural level and dispatches immediate administrative security alerts.
3. **Dynamic Topology Limit Parsing**
   - Hardcoded limits collapse under real-world business updates. ClickPay dynamically aggregates all inbound and outbound liquidity streams, actively scoring user constraints against rolling generic continuous time-windows rather than static values.
4. **Systematic Routing Bypasses**
   - Standard peer-to-peer limits are computationally bypassed out of the loop for verified corporate or agency cash-flows. This is handled transparently so the engine dynamically evaluates the origin and destination operational roles natively *before* enforcing liquidity ceilings.
5. **Deduplication Safeguards**
   - Designed to counteract accidental duplicated client requests due to UI stuttering or poor mobile network retries. Internal procedural routines algorithmically reject identically formulated transaction payloads arriving concurrently within a rigorous sliding cache window.


## 📂 Repository Architecture

```
clickpay-project/
├── frontend/                 # Client UI Architecture
│   ├── src/
│   │   ├── app/              # Page Routing & Server Components
│   │   ├── components/       # Stateless & Stateful UI Fragments
│   │   └── lib/              # Client-side validation & Network interceptors
│
├── backend/                  # Application Logic Engine
│   ├── src/
│   │   ├── controllers/      # Network interception & Payload schema validation
│   │   ├── services/         # Isolated Business Logic Providers
│   │   ├── routes/           # RESTful Endpoint definitions
│   │   ├── middleware/       # Identity Resolvers & Context Injection
│   │   └── utils/            # Connection pool handlers & shared utilities
│
└── sql_queries/              # Raw Database Schemas & Infrastructure Logic
    └── schema_postgresql.sql    # Relational schemas, procedural algorithms, and constraint setups
```

---

## ⚙️ Deployment & Initialization Environments

### 1. Database Configuration
1. Instantiate a standard PostgreSQL relational environment natively or via cloud providers.
2. Execute the comprehensive setup routines sequentially into the environment to organically build all relations, triggers, constraints, and mathematical operational functions.
3. Seed the initial configuration store to bring the constraints engine online.

### 2. Backend Initialization
```bash
cd backend
npm install
cp .env.example .env
# Expected config variables: Database Connection URI, Cryptographic Secret, Port Binding
npm run dev
```

### 3. Frontend Initialization
```bash
cd frontend
npm install
cp .env.example .env.local
# Map primary API socket to the backend origin
npm run dev
```

---

## 📜 Legal & Licensing
Provided exclusively for academic and educational evaluation. 
*Designed as a highly-available representation of standard enterprise DBMS configurations and fault-tolerant financial routing.*
