import { Difficulty, Platform, SheetCategory } from "@/types/sheet"

export interface TemplateItemDefinition {
  title: string
  difficulty: Difficulty
  platform: Platform
  problemLink?: string
  articleLink?: string
  youtubeLink?: string
  tags?: string[]
}

export interface TemplateDefinition {
  title: string
  category: SheetCategory
  description: string
  topics: Record<string, TemplateItemDefinition[]>
}

export const BUILTIN_TEMPLATES: Record<string, TemplateDefinition> = {
  dsa: {
    title: "DSA Essentials & Blind 75",
    category: "DSA",
    description: "Curated collection of core algorithmic patterns: Two Pointers, Sliding Window, Trees, Graphs, and DP.",
    topics: {
      "Arrays & Hashing": [
        {
          title: "Two Sum",
          difficulty: "Easy",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/two-sum/",
          tags: ["array", "hash-table"],
        },
        {
          title: "Valid Anagram",
          difficulty: "Easy",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/valid-anagram/",
          tags: ["string", "hash-table"],
        },
        {
          title: "Group Anagrams",
          difficulty: "Medium",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/group-anagrams/",
          tags: ["string", "hash-table", "sorting"],
        },
        {
          title: "Top K Frequent Elements",
          difficulty: "Medium",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/top-k-frequent-elements/",
          tags: ["heap", "bucket-sort"],
        },
      ],
      "Two Pointers & Sliding Window": [
        {
          title: "Valid Palindrome",
          difficulty: "Easy",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/valid-palindrome/",
          tags: ["two-pointers", "string"],
        },
        {
          title: "3Sum",
          difficulty: "Medium",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/3sum/",
          tags: ["two-pointers", "array", "sorting"],
        },
        {
          title: "Container With Most Water",
          difficulty: "Medium",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/container-with-most-water/",
          tags: ["two-pointers", "greedy"],
        },
        {
          title: "Longest Substring Without Repeating Characters",
          difficulty: "Medium",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
          tags: ["sliding-window", "hash-table"],
        },
      ],
      "Binary Search": [
        {
          title: "Binary Search",
          difficulty: "Easy",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/binary-search/",
          tags: ["binary-search"],
        },
        {
          title: "Search in Rotated Sorted Array",
          difficulty: "Medium",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
          tags: ["binary-search", "array"],
        },
        {
          title: "Find Minimum in Rotated Sorted Array",
          difficulty: "Medium",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
          tags: ["binary-search"],
        },
      ],
      "Linked Lists": [
        {
          title: "Reverse Linked List",
          difficulty: "Easy",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/reverse-linked-list/",
          tags: ["linked-list"],
        },
        {
          title: "Merge Two Sorted Lists",
          difficulty: "Easy",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/merge-two-sorted-lists/",
          tags: ["linked-list"],
        },
        {
          title: "Reorder List",
          difficulty: "Medium",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/reorder-list/",
          tags: ["linked-list", "two-pointers"],
        },
        {
          title: "Linked List Cycle",
          difficulty: "Easy",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/linked-list-cycle/",
          tags: ["linked-list", "fast-slow-pointers"],
        },
      ],
      "Trees & Graphs": [
        {
          title: "Invert Binary Tree",
          difficulty: "Easy",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/invert-binary-tree/",
          tags: ["tree", "dfs"],
        },
        {
          title: "Maximum Depth of Binary Tree",
          difficulty: "Easy",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
          tags: ["tree", "dfs", "bfs"],
        },
        {
          title: "Lowest Common Ancestor of a BST",
          difficulty: "Medium",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/",
          tags: ["tree", "bst"],
        },
        {
          title: "Number of Islands",
          difficulty: "Medium",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/number-of-islands/",
          tags: ["graph", "dfs", "bfs", "matrix"],
        },
        {
          title: "Course Schedule",
          difficulty: "Medium",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/course-schedule/",
          tags: ["graph", "topological-sort"],
        },
      ],
      "Dynamic Programming": [
        {
          title: "Climbing Stairs",
          difficulty: "Easy",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/climbing-stairs/",
          tags: ["dp", "memoization"],
        },
        {
          title: "Coin Change",
          difficulty: "Medium",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/coin-change/",
          tags: ["dp", "knapsack"],
        },
        {
          title: "Longest Increasing Subsequence",
          difficulty: "Medium",
          platform: "LeetCode",
          problemLink: "https://leetcode.com/problems/longest-increasing-subsequence/",
          tags: ["dp", "binary-search"],
        },
      ],
    },
  },

  os: {
    title: "Operating Systems Checklist",
    category: "OS",
    description: "Core OS theory commonly tested in technical rounds and system architecture interviews.",
    topics: {
      "Process Management": [
        {
          title: "Process vs. Thread (Address space, context switching, PCB)",
          difficulty: "Easy",
          platform: "Other",
          tags: ["processes", "threads", "context-switch"],
        },
        {
          title: "CPU Scheduling Algorithms (Round Robin, CFS, Priority, SJF)",
          difficulty: "Medium",
          platform: "Other",
          tags: ["scheduling", "latency"],
        },
        {
          title: "Fork, Exec, and Zombie/Orphan Process states",
          difficulty: "Medium",
          platform: "Other",
          tags: ["unix", "processes"],
        },
      ],
      "Concurrency & Synchronization": [
        {
          title: "Race Conditions & Critical Section Problem",
          difficulty: "Easy",
          platform: "Other",
          tags: ["synchronization"],
        },
        {
          title: "Mutex vs. Semaphore (Binary & Counting) vs. Spinlock",
          difficulty: "Medium",
          platform: "Other",
          tags: ["mutex", "semaphore"],
        },
        {
          title: "The 4 Deadlock Conditions (Coffman) & Prevention/Banker's Algorithm",
          difficulty: "Hard",
          platform: "Other",
          tags: ["deadlock", "resource-allocation"],
        },
      ],
      "Memory Management": [
        {
          title: "Paging vs. Segmentation & TLB (Translation Lookaside Buffer)",
          difficulty: "Medium",
          platform: "Other",
          tags: ["paging", "tlb", "mmu"],
        },
        {
          title: "Virtual Memory & Page Faults",
          difficulty: "Medium",
          platform: "Other",
          tags: ["virtual-memory"],
        },
        {
          title: "Page Replacement Algorithms (LRU, FIFO, Clock)",
          difficulty: "Medium",
          platform: "Other",
          tags: ["cache-replacement", "lru"],
        },
      ],
    },
  },

  cn: {
    title: "Computer Networks Fundamentals",
    category: "CN",
    description: "Networking protocols, transport layers, security handshakes, and web architecture.",
    topics: {
      "OSI & Transport Layer": [
        {
          title: "TCP 3-Way Handshake & 4-Way Termination (TIME_WAIT state)",
          difficulty: "Medium",
          platform: "Other",
          tags: ["tcp", "networking"],
        },
        {
          title: "TCP vs. UDP: Flow Control, Congestion Control & Reliability",
          difficulty: "Easy",
          platform: "Other",
          tags: ["tcp", "udp"],
        },
      ],
      "Application Layer Protocols": [
        {
          title: "What happens when you type google.com in browser? (DNS -> Socket -> HTTP)",
          difficulty: "Medium",
          platform: "Other",
          tags: ["dns", "http", "browser"],
        },
        {
          title: "HTTP/1.1 vs HTTP/2 (Multiplexing) vs HTTP/3 (QUIC/UDP)",
          difficulty: "Medium",
          platform: "Other",
          tags: ["http", "quic"],
        },
        {
          title: "WebSockets vs Server-Sent Events (SSE) vs Long Polling",
          difficulty: "Medium",
          platform: "Other",
          tags: ["websockets", "realtime"],
        },
      ],
      "Network Security": [
        {
          title: "TLS/SSL Handshake (Symmetric vs Asymmetric encryption, CAs)",
          difficulty: "Hard",
          platform: "Other",
          tags: ["tls", "cryptography"],
        },
        {
          title: "CORS, CSP, and Same-Origin Policy mechanisms",
          difficulty: "Easy",
          platform: "Other",
          tags: ["security", "cors"],
        },
      ],
    },
  },

  dbms: {
    title: "DBMS & SQL Architecture",
    category: "DBMS",
    description: "Relational vs NoSQL trade-offs, indexing data structures, and distributed storage.",
    topics: {
      "Core Database Concepts": [
        {
          title: "ACID Properties & Transaction Isolation Levels (Dirty, Non-repeatable, Phantom)",
          difficulty: "Medium",
          platform: "Other",
          tags: ["acid", "transactions"],
        },
        {
          title: "Database Normalization (1NF to BCNF) vs. Denormalization for read speed",
          difficulty: "Easy",
          platform: "Other",
          tags: ["normalization", "sql"],
        },
      ],
      "Indexing & Query Optimization": [
        {
          title: "B-Trees vs. B+ Trees vs. LSM-Trees (Read-heavy vs Write-heavy)",
          difficulty: "Hard",
          platform: "Other",
          tags: ["b-tree", "indexing", "storage-engine"],
        },
        {
          title: "Clustered vs. Non-Clustered Indexes & Composite Index ordering",
          difficulty: "Medium",
          platform: "Other",
          tags: ["indexes", "performance"],
        },
      ],
      "Distributed Data": [
        {
          title: "Sharding vs Partitioning vs Read Replicas",
          difficulty: "Medium",
          platform: "Other",
          tags: ["sharding", "scalability"],
        },
        {
          title: "Optimistic vs. Pessimistic Concurrency Locking",
          difficulty: "Medium",
          platform: "Other",
          tags: ["locking", "concurrency"],
        },
      ],
    },
  },

  "system-design": {
    title: "System Design Core Concepts",
    category: "Development",
    description: "Fundamental distributed building blocks tested in Mid to Senior system design interviews.",
    topics: {
      "Architectural Trade-offs": [
        {
          title: "CAP Theorem (Consistency vs Availability under Partition)",
          difficulty: "Medium",
          platform: "Other",
          tags: ["cap-theorem", "distributed-systems"],
        },
        {
          title: "Consistent Hashing & Virtual Nodes for cluster balance",
          difficulty: "Hard",
          platform: "Other",
          tags: ["hashing", "distributed-caching"],
        },
      ],
      "Components & Patterns": [
        {
          title: "Rate Limiting Algorithms (Token Bucket, Leaky Bucket, Sliding Window Log)",
          difficulty: "Medium",
          platform: "Other",
          tags: ["rate-limiting", "api-gateway"],
        },
        {
          title: "Caching Strategies (Cache-Aside, Write-Through, Write-Behind, Eviction)",
          difficulty: "Easy",
          platform: "Other",
          tags: ["caching", "redis"],
        },
        {
          title: "Message Queues (Kafka vs RabbitMQ vs SQS: Pull vs Push, Partitioning)",
          difficulty: "Medium",
          platform: "Other",
          tags: ["message-queues", "kafka", "event-driven"],
        },
      ],
    },
  },
}
