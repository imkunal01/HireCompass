import { CandidateRole, ExperienceLevel, InterviewerPersona } from "@/types/prep"

export interface FresherStarterProject {
  id: string
  title: string
  category: string
  techStack: string[]
  description: string
  responsibilities: string
  challenges: string
  metrics: string
  roleRelevance: CandidateRole[]
}

export interface CandidateRoleMeta {
  id: CandidateRole
  title: string
  shortTitle: string
  emoji: string
  badge: string
  tagline: string
  fresherProbingFocus: string[]
  sampleQuestion: string
}

export interface ExperienceLevelMeta {
  id: ExperienceLevel
  title: string
  badge: string
  years: string
  description: string
  probingStyle: string
}

export const CANDIDATE_ROLES: CandidateRoleMeta[] = [
  {
    id: "fullstack",
    title: "Full Stack Developer",
    shortTitle: "Full Stack",
    emoji: "🌐",
    badge: "Most Popular",
    tagline: "End-to-end integration, client-server contract, REST APIs & DB persistence.",
    fresherProbingFocus: [
      "Client-server request lifecycle & network tab inspection",
      "Authentication flow (JWT tokens, cookies, localStorage)",
      "Database schema relationships & query performance",
      "State management between frontend and backend",
      "CORS, error handling, and HTTP status codes",
    ],
    sampleQuestion:
      "When a user clicks 'Submit' on your frontend form, trace the exact flow of data through your API routes, middleware, and database. How do you handle network failure midway?",
  },
  {
    id: "frontend",
    title: "Frontend / UI Developer",
    shortTitle: "Frontend",
    emoji: "🎨",
    badge: "UI / UX Focus",
    tagline: "Component architecture, React hooks, rendering optimization & responsive design.",
    fresherProbingFocus: [
      "Component lifecycle, useEffect dependencies & re-render triggers",
      "State management (Local state vs Context vs Redux/Zustand)",
      "Responsive CSS (Flexbox, Grid, Mobile-first breakpoints)",
      "Async data fetching (loading states, error states, race conditions)",
      "Web performance (bundle size, lazy loading, image optimization)",
    ],
    sampleQuestion:
      "In your project, how did you manage state across components? What prevents infinite loops in your useEffect hooks, and how did you verify the UI works on mobile?",
  },
  {
    id: "backend",
    title: "Backend / API Developer",
    shortTitle: "Backend",
    emoji: "⚙️",
    badge: "Core Systems",
    tagline: "REST/GraphQL APIs, database indexing, authentication, middleware & validation.",
    fresherProbingFocus: [
      "RESTful API conventions & status code choices (400 vs 401 vs 403 vs 404)",
      "Database schema design, primary/foreign keys & indexing",
      "Secure authentication (password hashing with bcrypt, JWT verification)",
      "API request validation & global error handling middleware",
      "Database connection pooling & preventing SQL/NoSQL injection",
    ],
    sampleQuestion:
      "Walk me through your database schema. Why did you choose this database? What fields did you index, and how do you prevent unauthorized users from editing other people's data?",
  },
  {
    id: "data_ml",
    title: "Data / AI / ML Engineer",
    shortTitle: "Data / ML",
    emoji: "🧠",
    badge: "Data Science",
    tagline: "Data pipelines, model training/inference, data cleaning & feature engineering.",
    fresherProbingFocus: [
      "Data preprocessing, handling missing values & feature normalization",
      "Model evaluation metrics (Accuracy vs Precision/Recall vs F1-score vs ROC-AUC)",
      "Overfitting vs Underfitting detection & regularization techniques",
      "Deploying model endpoints (FastAPI/Flask) & inference latency",
      "Data storage choices (relational DB vs CSV vs Vector store)",
    ],
    sampleQuestion:
      "How did you clean and prepare the dataset for your model? Why did you pick this specific algorithm over a simpler baseline, and how did you prevent data leakage?",
  },
  {
    id: "devops",
    title: "DevOps / Cloud Engineer",
    shortTitle: "DevOps",
    emoji: "🚀",
    badge: "Infrastructure",
    tagline: "Docker containerization, CI/CD pipelines, environment secrets & deployment hosting.",
    fresherProbingFocus: [
      "Dockerfile creation, multi-stage builds & image layer caching",
      "CI/CD automation workflows (GitHub Actions, testing gates)",
      "Secure management of environment variables and production secrets",
      "Cloud hosting deployment (Vercel, Render, AWS EC2/S3)",
      "Application logging, health check endpoints & basic monitoring",
    ],
    sampleQuestion:
      "How did you containerize your project? Walk me through your Dockerfile. How do you ensure environment secrets never get committed to GitHub?",
  },
  {
    id: "mobile",
    title: "Mobile App Developer",
    shortTitle: "Mobile",
    emoji: "📱",
    badge: "React Native / Flutter / Android",
    tagline: "Mobile UI performance, offline data persistence, navigation & platform APIs.",
    fresherProbingFocus: [
      "Mobile component lifecycle & screen navigation stacks",
      "Offline caching & local data storage (AsyncStorage, SQLite)",
      "Handling asynchronous network connectivity changes",
      "Memory management, smooth scroll performance & list virtualization",
      "Push notification handling & camera/device permissions",
    ],
    sampleQuestion:
      "How does your mobile app behave when the user loses internet connection? How do you prevent screen stuttering when rendering large lists of data?",
  },
  {
    id: "general_sde",
    title: "General Software Engineer (SDE)",
    shortTitle: "General SDE",
    emoji: "💻",
    badge: "Foundations",
    tagline: "OOP principles, core data structures in code, clean architecture & debugging.",
    fresherProbingFocus: [
      "Object-Oriented Programming (Polymorphism, Inheritance, Encapsulation, Abstraction)",
      "Data structures used in the project (HashMaps, Arrays, Queues, Sets)",
      "Time and space complexity of custom project logic/algorithms",
      "Unit testing & boundary condition handling",
      "Explaining technical decisions clearly without memorized jargon",
    ],
    sampleQuestion:
      "What data structures did you utilize inside your application logic, and why were they appropriate? Walk me through the hardest bug you encountered and how you debugged it.",
  },
]

export const EXPERIENCE_LEVELS: ExperienceLevelMeta[] = [
  {
    id: "fresher",
    title: "Fresher / College Grad",
    badge: "Fresher Mode (0-1 yrs)",
    years: "0 - 1 Years",
    description:
      "Probes core fundamentals, implementation details, why technologies were chosen, database basics, and real hands-on debugging stories.",
    probingStyle:
      "Supportive, foundational, and implementation-focused. Tests whether you genuinely understood and wrote the code vs copied a tutorial.",
  },
  {
    id: "mid",
    title: "Mid-Level Engineer",
    badge: "Production Mode (1-3 yrs)",
    years: "1 - 3 Years",
    description:
      "Probes API contracts, database indexing, caching strategies, integration testing, CI/CD, and production maintainability.",
    probingStyle:
      "Pragmatic and production-focused. Evaluates technical depth, error recovery, maintainability, and clean architecture.",
  },
  {
    id: "senior",
    title: "Senior / Lead Engineer",
    badge: "Hardcore Scale (3+ yrs)",
    years: "3+ Years",
    description:
      "Probes distributed systems failure modes, 50k+ QPS high contention, database replication lag, consensus, and P99 SLAs.",
    probingStyle:
      "Relentless and uncompromising. Challenges architectural boundaries, distributed race conditions, and strategic compromises.",
  },
]

export const FRESHER_STARTER_PROJECTS: FresherStarterProject[] = [
  {
    id: "starter-ecommerce",
    title: "E-Commerce Web Application & Storefront",
    category: "Full Stack Web",
    techStack: ["React", "Node.js", "Express", "MongoDB", "Redux", "JWT Auth", "Stripe API"],
    description:
      "A complete online retail store featuring product catalog with filters, shopping cart persistence, user authentication, and checkout simulation.",
    responsibilities:
      "Implemented responsive UI components with React and Redux; built RESTful API endpoints for catalog search and order placement; designed MongoDB schemas for users, products, and orders; integrated JWT authentication middleware.",
    challenges:
      "Synchronizing guest shopping cart items into persistent database storage upon user login without duplicate items; handling inventory stock checks to prevent overselling.",
    metrics:
      "Handles 500+ product catalog queries with sub-100ms response time; zero client-side checkout state discrepancies.",
    roleRelevance: ["fullstack", "frontend", "backend", "general_sde"],
  },
  {
    id: "starter-chat",
    title: "Real-Time Collaboration & Messaging App",
    category: "Real-Time & Full Stack",
    techStack: ["Next.js", "TypeScript", "Socket.io", "Node.js", "PostgreSQL", "Tailwind CSS"],
    description:
      "A real-time workspace chat application with 1-on-1 messaging, group channels, online presence indicators, and instant message notifications.",
    responsibilities:
      "Built bi-directional WebSocket event pipeline with Socket.io; designed relational database schema in PostgreSQL for channels, members, and messages; implemented optimistic UI updates for instant perceived message delivery.",
    challenges:
      "Handling unexpected WebSocket disconnects and automatic client reconnection with missed message backfilling; preventing duplicate message rendering under flaky network conditions.",
    metrics:
      "Sub-50ms real-time message delivery latency over WebSockets; supports concurrent multi-user channel chats.",
    roleRelevance: ["fullstack", "frontend", "backend", "general_sde"],
  },
  {
    id: "starter-ml-churn",
    title: "Customer Churn Prediction & ML Inference API",
    category: "Machine Learning & Data",
    techStack: ["Python", "FastAPI", "Scikit-Learn", "Pandas", "NumPy", "Docker", "PostgreSQL"],
    description:
      "An end-to-end machine learning service that trains predictive churn models on customer behavior datasets and serves real-time risk scores via a REST API.",
    responsibilities:
      "Preprocessed raw behavioral data including outlier imputation and one-hot encoding; trained Random Forest and Gradient Boosting classifiers; tuned hyperparameters using cross-validation; deployed inference pipeline inside a lightweight FastAPI microservice.",
    challenges:
      "Mitigating severe class imbalance in churn labels without synthetic data overfitting; keeping inference latency sub-25ms per prediction request.",
    metrics:
      "Achieved 0.88 ROC-AUC and 82% precision on validation holdout; sub-20ms P95 API inference latency.",
    roleRelevance: ["data_ml", "backend", "general_sde"],
  },
  {
    id: "starter-devops-pipeline",
    title: "Containerized Microservices CI/CD & Cloud Deployment",
    category: "DevOps & Cloud",
    techStack: ["Docker", "GitHub Actions", "AWS EC2", "Nginx", "Node.js", "Prometheus", "Bash"],
    description:
      "An automated infrastructure pipeline providing zero-downtime deployment for a multi-service web platform with reverse proxy routing and container monitoring.",
    responsibilities:
      "Authored multi-stage Dockerfiles cutting image size by 65%; constructed GitHub Actions workflows for automated testing and container registry publishing; configured Nginx reverse proxy with SSL termination; set up Prometheus health metrics.",
    challenges:
      "Ensuring zero secrets leakage in build layers; orchestrating blue-green container cutover without dropping in-flight HTTP connections.",
    metrics:
      "Deployment cycle reduced from 35 mins manual to 4 mins automated; 99.9% pipeline reliability rate.",
    roleRelevance: ["devops", "backend", "general_sde"],
  },
  {
    id: "starter-mobile-tracker",
    title: "Offline-First Habit & Expense Mobile App",
    category: "Mobile Application",
    techStack: ["React Native", "Expo", "TypeScript", "SQLite", "Redux Toolkit", "AsyncStorage"],
    description:
      "A cross-platform mobile productivity application that allows users to log expenses and daily habits completely offline, with background cloud synchronization when connected.",
    responsibilities:
      "Built responsive mobile UI components with native gestures; implemented local persistence with SQLite; designed background sync queue reconciling offline writes with remote server; optimized FlatList rendering with windowing.",
    challenges:
      "Resolving multi-device timestamp conflicts during sync without overwriting user data; avoiding UI thread jank during SQLite bulk inserts.",
    metrics:
      "Maintained silky 60fps scrolling across 1,000+ logged items; 100% data preservation during offline flight mode.",
    roleRelevance: ["mobile", "frontend", "fullstack"],
  },
  {
    id: "starter-hirecompass",
    title: "Job Application & Interview Prep Tracker",
    category: "Productivity & Dashboard",
    techStack: ["React", "TypeScript", "Express", "MongoDB", "Tailwind CSS", "Chart.js"],
    description:
      "An interactive job search management dashboard allowing candidates to track application stages (Applied, Interviewing, Offered), set follow-up reminders, and visualize pipeline metrics.",
    responsibilities:
      "Architected interactive Kanban board with drag-and-drop state transitions; created RESTful CRUD endpoints with validation; built data visualization charts aggregating weekly application conversion rates.",
    challenges:
      "Maintaining atomic status transitions in the database when items are dragged rapidly across Kanban columns; optimistic UI rollback on network error.",
    metrics:
      "100% reliable state synchronization; clean modular component structure with reusable dashboard widgets.",
    roleRelevance: ["fullstack", "frontend", "backend", "general_sde"],
  },
  {
    id: "starter-rest-api",
    title: "Scalable Task Management REST API Service",
    category: "Backend & Systems",
    techStack: ["Node.js", "Express", "PostgreSQL", "Docker", "Redis", "Jest"],
    description:
      "A robust backend micro-service offering secure user authentication, role-based access control (Admin vs User), task scheduling, and Redis response caching.",
    responsibilities:
      "Engineered RESTful API specification with input validation; implemented Redis caching for frequently accessed task lists; wrote automated unit and integration tests using Jest; containerized service with Docker.",
    challenges:
      "Invalidating Redis cache keys accurately upon task creation, update, or deletion; ensuring password security using salt hashing.",
    metrics:
      "90% automated test coverage; 70% latency reduction on read endpoints via Redis cache hits.",
    roleRelevance: ["backend", "devops", "fullstack", "general_sde"],
  },
]

