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
  "capgemini-dsa": {
    title: "Capgemini DSA Problems",
    category: "DSA",
    description: "Complete 150-problem Capgemini DSA assessment syllabus spanning Arrays, Strings, Sliding Window, DP, Trees, and Graphs.",
    topics: {
  "Strings": [
    {
      "title": "Move Special Characters ('#') to Front",
      "difficulty": "Easy",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/move-all-occurrence-of-char-to-the-end-of-string/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-1",
        "Two-Pointer / In-place String Traversal"
      ]
    },
    {
      "title": "Run-Length String Compression",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/string-compression/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-1",
        "Two-Pointer In-Place Compression"
      ]
    },
    {
      "title": "Check for K-Anagrams",
      "difficulty": "Easy",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/check-if-two-strings-are-k-anagrams-or-not/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-2",
        "Character Frequency Hashing"
      ]
    },
    {
      "title": "Roman to Integer",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/roman-to-integer/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "hashing",
        "math"
      ]
    },
    {
      "title": "Reverse String",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/reverse-string/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "two-pointers"
      ]
    },
    {
      "title": "First Unique Character in a String",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/first-unique-character-in-a-string/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "hashing",
        "frequency-count"
      ]
    },
    {
      "title": "Valid Palindrome",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/valid-palindrome/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "two-pointers"
      ]
    },
    {
      "title": "Sort Characters By Frequency",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/sort-characters-by-frequency/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "hashing",
        "frequency-count",
        "sorting"
      ]
    },
    {
      "title": "Count Number of Vowels and Consonants in a String",
      "difficulty": "Easy",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/consonants-and-vowels-check-java/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "string",
        "counting"
      ]
    }
  ],
  "Arrays": [
    {
      "title": "Move Zeroes to End",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/move-zeroes/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-1",
        "Two-Pointer Array Shift"
      ]
    },
    {
      "title": "Maximum Subarray Sum (Kadane's Algorithm)",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/maximum-subarray/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-1",
        "Kadane's Algorithm / Prefix Optimization"
      ]
    },
    {
      "title": "Product of Array Except Self",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/product-of-array-except-self/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-2",
        "Prefix & Suffix Product Arrays"
      ]
    },
    {
      "title": "Spirally Traversing a Matrix",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/spiral-matrix/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-2",
        "4-Boundary Matrix Traversal"
      ]
    },
    {
      "title": "Rotate Image (90 Degrees Clockwise)",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/rotate-image/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-2",
        "Matrix Transposition + Row Reversal"
      ]
    },
    {
      "title": "Minimum Jumps to Reach the End (Jump Game II)",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/jump-game-ii/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-3",
        "Greedy Reach Optimization / BFS"
      ]
    },
    {
      "title": "Best Time to Buy and Sell Stock (Single Transaction)",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-3",
        "One-Pass Running Minimum Tracking"
      ]
    },
    {
      "title": "Best Time to Buy and Sell Stock II (Multiple Deals)",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-3",
        "Greedy Valley-to-Peak Accumulation"
      ]
    },
    {
      "title": "Container With Most Water",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/container-with-most-water/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-3",
        "Two-Pointer Inward Contraction"
      ]
    },
    {
      "title": "Two Sum (Target Pair)",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/two-sum/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-3",
        "Hash Map Complement Lookup (O(N))"
      ]
    },
    {
      "title": "Pairs with Difference K (K-diff Pairs in an Array)",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/k-diff-pairs-in-an-array/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-3",
        "Hash Map / Frequency Counting"
      ]
    },
    {
      "title": "Remove Duplicates from Sorted Array",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/remove-duplicates-from-sorted-array/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "two-pointers"
      ]
    },
    {
      "title": "Search Insert Position",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/search-insert-position/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "binary-search"
      ]
    },
    {
      "title": "Plus One",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/plus-one/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "math",
        "array"
      ]
    },
    {
      "title": "Pascal's Triangle",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/pascals-triangle/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "dp",
        "array"
      ]
    },
    {
      "title": "Single Number",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/single-number/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "bit-manipulation",
        "xor"
      ]
    },
    {
      "title": "Contains Duplicate",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/contains-duplicate/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "hashing"
      ]
    },
    {
      "title": "Missing Number",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/missing-number/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "math",
        "xor",
        "hashing"
      ]
    },
    {
      "title": "Kth Smallest Element in an Unsorted Array",
      "difficulty": "Medium",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/kth-smallest-element5635/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "sorting",
        "quickselect",
        "heap"
      ]
    },
    {
      "title": "Subarray with Given Sum",
      "difficulty": "Easy",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/subarray-with-given-sum-1587115621/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "subarray",
        "two-pointers",
        "non-negative"
      ]
    },
    {
      "title": "Longest Sub-Array with Sum K",
      "difficulty": "Medium",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/longest-sub-array-with-sum-k0809/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "subarray",
        "prefix-sum",
        "hashing"
      ]
    },
    {
      "title": "Subarray Sum Equals K",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/subarray-sum-equals-k/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "subarray",
        "prefix-sum",
        "hashing"
      ]
    },
    {
      "title": "Subarray with 0 Sum",
      "difficulty": "Easy",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/subarray-with-0-sum-1587115621/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "subarray",
        "prefix-sum",
        "hashing"
      ]
    },
    {
      "title": "Largest Subarray with 0 Sum",
      "difficulty": "Medium",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/largest-subarray-with-0-sum/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "subarray",
        "prefix-sum",
        "hashing"
      ]
    },
    {
      "title": "Contiguous Array",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/contiguous-array/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "subarray",
        "prefix-sum",
        "hashing"
      ]
    },
    {
      "title": "Subarray Sums Divisible by K",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/subarray-sums-divisible-by-k/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "subarray",
        "prefix-sum",
        "modulo",
        "hashing"
      ]
    },
    {
      "title": "Maximum Ascending Subarray Sum",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/maximum-ascending-subarray-sum/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "subarray",
        "one-pass"
      ]
    },
    {
      "title": "Maximum Sum Circular Subarray",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/maximum-sum-circular-subarray/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "subarray",
        "kadane",
        "circular"
      ]
    }
  ],
  "Sliding Window": [
    {
      "title": "Longest Substring Without Repeating Characters",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-2",
        "Sliding Window + Hash Set / Direct Array Map"
      ]
    },
    {
      "title": "Maximum Average Subarray I",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/maximum-average-subarray-i/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "sliding-window",
        "fixed-window"
      ]
    },
    {
      "title": "Contains Duplicate II",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/contains-duplicate-ii/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "sliding-window",
        "fixed-window",
        "hashing"
      ]
    },
    {
      "title": "Number of Sub-arrays of Size K and Average Greater than or Equal to Threshold",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "sliding-window",
        "fixed-window"
      ]
    },
    {
      "title": "Maximum Points You Can Obtain from Cards",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "sliding-window",
        "fixed-window",
        "prefix-sum"
      ]
    },
    {
      "title": "Find All Anagrams in a String",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/find-all-anagrams-in-a-string/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "sliding-window",
        "fixed-window",
        "hashing"
      ]
    },
    {
      "title": "Grumpy Bookstore Owner",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/grumpy-bookstore-owner/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "sliding-window",
        "fixed-window"
      ]
    },
    {
      "title": "Maximum Sum of Distinct Subarrays With Length K",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/maximum-sum-of-distinct-subarrays-with-length-k/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "sliding-window",
        "fixed-window",
        "hashing"
      ]
    },
    {
      "title": "Fruit Into Baskets",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/fruit-into-baskets/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "sliding-window",
        "variable-window",
        "at-most-k-distinct"
      ]
    },
    {
      "title": "Max Consecutive Ones III",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/max-consecutive-ones-iii/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "sliding-window",
        "variable-window"
      ]
    },
    {
      "title": "Longest Subarray of 1's After Deleting One Element",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/longest-subarray-of-1s-after-deleting-one-element/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "sliding-window",
        "variable-window"
      ]
    },
    {
      "title": "Subarray Product Less Than K",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/subarray-product-less-than-k/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "sliding-window",
        "variable-window",
        "counting"
      ]
    },
    {
      "title": "Get Equal Substrings Within Budget",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/get-equal-substrings-within-budget/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "sliding-window",
        "variable-window"
      ]
    },
    {
      "title": "Minimum Operations to Reduce X to Zero",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/minimum-operations-to-reduce-x-to-zero/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "sliding-window",
        "variable-window",
        "prefix-sum"
      ]
    },
    {
      "title": "Binary Subarrays With Sum",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/binary-subarrays-with-sum/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "sliding-window",
        "at-most-k-trick",
        "prefix-sum"
      ]
    },
    {
      "title": "Count Number of Nice Subarrays",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/count-number-of-nice-subarrays/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "sliding-window",
        "at-most-k-trick"
      ]
    },
    {
      "title": "Subarrays with K Different Integers",
      "difficulty": "Hard",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/subarrays-with-k-different-integers/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "sliding-window",
        "at-most-k-trick",
        "hashing"
      ]
    }
  ],
  "Mathematics": [
    {
      "title": "Modular Exponentiation (Pow(x, n) mod M)",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/powx-n/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-3",
        "Binary Exponentiation (O(log Y))"
      ]
    },
    {
      "title": "Palindrome Number",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/palindrome-number/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "math"
      ]
    },
    {
      "title": "Power of Two",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/power-of-two/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "math",
        "bit-manipulation"
      ]
    },
    {
      "title": "Fizz Buzz",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/fizz-buzz/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "math",
        "simulation"
      ]
    },
    {
      "title": "Armstrong Number",
      "difficulty": "Easy",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/armstrong-numbers2727/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "math"
      ]
    },
    {
      "title": "Prime Number",
      "difficulty": "Easy",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/prime-number2314/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "math",
        "number-theory"
      ]
    },
    {
      "title": "Factorial of a Number",
      "difficulty": "Easy",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/factorial5739/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "math",
        "recursion"
      ]
    },
    {
      "title": "GCD and LCM of Two Numbers",
      "difficulty": "Easy",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/gcd-of-two-numbers3459/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "math",
        "number-theory"
      ]
    },
    {
      "title": "Pyramid Pattern of Numbers",
      "difficulty": "Easy",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/pyramid-patterns/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "pattern-printing",
        "loops"
      ]
    }
  ],
  "Linked List": [
    {
      "title": "Detect and Remove Loop in Linked List",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/linked-list-cycle-ii/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-4",
        "Floyd's Tortoise & Hare Cycle Detection"
      ]
    },
    {
      "title": "Reverse Linked List in Groups of Size K",
      "difficulty": "Hard",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/reverse-nodes-in-k-group/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-4",
        "Pointer Manipulation / Sub-list Reversal"
      ]
    },
    {
      "title": "Middle of the Linked List",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/middle-of-the-linked-list/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-4",
        "Fast & Slow Pointers (1-Pass)"
      ]
    }
  ],
  "Stack & Queue": [
    {
      "title": "Next Greater Element (NGE)",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/next-greater-element-i/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-4",
        "Monotonic Decreasing Stack (O(N))"
      ]
    },
    {
      "title": "Valid / Balanced Parentheses",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/valid-parentheses/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-4",
        "Stack LIFO Bracket Matching"
      ]
    }
  ],
  "Dynamic Programming": [
    {
      "title": "0/1 Knapsack Problem",
      "difficulty": "Medium",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/0-1-knapsack-problem0945/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-5",
        "2D / 1D DP State Table (Weight vs Profit)"
      ]
    },
    {
      "title": "Subset Sum Problem (Partition Equal Subset Sum)",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/partition-equal-subset-sum/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-5",
        "1D Boolean DP (Knapsack Variation)"
      ]
    },
    {
      "title": "Coin Change (Minimum Coins to Make Amount)",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/coin-change/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-5",
        "Unbounded Knapsack / 1D DP Array"
      ]
    },
    {
      "title": "Longest Common Subsequence (LCS)",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/longest-common-subsequence/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-5",
        "2D DP Matching Matrix"
      ]
    },
    {
      "title": "Longest Increasing Subsequence (LIS)",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/longest-increasing-subsequence/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-5",
        "Patience Sorting + Binary Search (O(N log N))"
      ]
    },
    {
      "title": "N-th Tribonacci Number",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/n-th-tribonacci-number/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "linear-dp"
      ]
    },
    {
      "title": "Decode Ways",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/decode-ways/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "linear-dp",
        "string"
      ]
    },
    {
      "title": "Delete and Earn",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/delete-and-earn/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "linear-dp",
        "house-robber-variant"
      ]
    },
    {
      "title": "Jump Game",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/jump-game/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "linear-dp",
        "greedy"
      ]
    },
    {
      "title": "Minimum Cost For Tickets",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/minimum-cost-for-tickets/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "linear-dp"
      ]
    },
    {
      "title": "Best Time to Buy and Sell Stock with Cooldown",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "linear-dp",
        "state-machine"
      ]
    },
    {
      "title": "Number of Longest Increasing Subsequence",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/number-of-longest-increasing-subsequence/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "linear-dp",
        "lis"
      ]
    },
    {
      "title": "Perfect Sum Problem",
      "difficulty": "Medium",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/perfect-sum-problem5633/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "knapsack",
        "0-1",
        "count-subsets"
      ]
    },
    {
      "title": "Minimum Sum Partition",
      "difficulty": "Medium",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/minimum-sum-partition3317/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "knapsack",
        "0-1",
        "subset-sum"
      ]
    },
    {
      "title": "Last Stone Weight II",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/last-stone-weight-ii/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "knapsack",
        "0-1",
        "subset-sum"
      ]
    },
    {
      "title": "Ones and Zeroes",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/ones-and-zeroes/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "knapsack",
        "0-1",
        "2d-dp"
      ]
    },
    {
      "title": "Knapsack with Duplicate Items",
      "difficulty": "Medium",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/knapsack-with-duplicate-items4201/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "knapsack",
        "unbounded"
      ]
    },
    {
      "title": "Rod Cutting",
      "difficulty": "Medium",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/rod-cutting0840/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "knapsack",
        "unbounded"
      ]
    },
    {
      "title": "Coin Change II",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/coin-change-ii/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "knapsack",
        "unbounded",
        "count-ways"
      ]
    },
    {
      "title": "Combination Sum IV",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/combination-sum-iv/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "knapsack",
        "unbounded",
        "count-ways"
      ]
    },
    {
      "title": "Perfect Squares",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/perfect-squares/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "knapsack",
        "unbounded"
      ]
    },
    {
      "title": "Number of Dice Rolls With Target Sum",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/number-of-dice-rolls-with-target-sum/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "knapsack",
        "bounded",
        "count-ways"
      ]
    },
    {
      "title": "Longest Common Substring",
      "difficulty": "Medium",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/longest-common-substring1452/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "string-dp",
        "lcs-variant"
      ]
    },
    {
      "title": "Maximum Length of Repeated Subarray",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/maximum-length-of-repeated-subarray/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "string-dp",
        "lcs-variant"
      ]
    },
    {
      "title": "Longest Palindromic Subsequence",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/longest-palindromic-subsequence/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "string-dp",
        "lcs-variant",
        "palindrome"
      ]
    },
    {
      "title": "Delete Operation for Two Strings",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/delete-operation-for-two-strings/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "string-dp",
        "lcs-variant"
      ]
    },
    {
      "title": "Uncrossed Lines",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/uncrossed-lines/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "string-dp",
        "lcs-variant"
      ]
    },
    {
      "title": "Minimum Insertion Steps to Make a String Palindrome",
      "difficulty": "Hard",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/minimum-insertion-steps-to-make-a-string-palindrome/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "string-dp",
        "palindrome"
      ]
    },
    {
      "title": "Shortest Common Supersequence",
      "difficulty": "Hard",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/shortest-common-supersequence/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "string-dp",
        "lcs-variant"
      ]
    },
    {
      "title": "Edit Distance",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/edit-distance/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "string-dp"
      ]
    },
    {
      "title": "Minimum ASCII Delete Sum for Two Strings",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/minimum-ascii-delete-sum-for-two-strings/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "string-dp",
        "edit-distance-variant"
      ]
    },
    {
      "title": "Distinct Subsequences",
      "difficulty": "Hard",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/distinct-subsequences/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "string-dp",
        "counting"
      ]
    },
    {
      "title": "Interleaving String",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/interleaving-string/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "string-dp",
        "2d-dp"
      ]
    },
    {
      "title": "Wildcard Matching",
      "difficulty": "Hard",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/wildcard-matching/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "string-dp",
        "pattern-matching"
      ]
    },
    {
      "title": "Regular Expression Matching",
      "difficulty": "Hard",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/regular-expression-matching/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "string-dp",
        "pattern-matching"
      ]
    }
  ],
  "BST": [
    {
      "title": "Count BST Nodes in Given Range",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/range-sum-of-bst/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-5",
        "BST Pruning + Recursive Inorder Traversal"
      ]
    }
  ],
  "Trees": [
    {
      "title": "Left View of Binary Tree",
      "difficulty": "Easy",
      "platform": "Other",
      "problemLink": "https://www.geeksforgeeks.org/problems/left-view-of-binary-tree/1",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-5",
        "Level Order Traversal (BFS) / Preorder Depth Tracking"
      ]
    },
    {
      "title": "Binary Tree Spiral / Zigzag Level Order Traversal",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "day-5",
        "Deque / Two Stacks BFS Level Order"
      ]
    },
    {
      "title": "Binary Tree Inorder Traversal",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/binary-tree-inorder-traversal/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "dfs",
        "stack"
      ]
    },
    {
      "title": "Symmetric Tree",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/symmetric-tree/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "capgemini",
        "dfs",
        "bfs"
      ]
    },
    {
      "title": "Binary Tree Preorder Traversal",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/binary-tree-preorder-traversal/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "dfs",
        "traversal",
        "stack"
      ]
    },
    {
      "title": "Binary Tree Postorder Traversal",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/binary-tree-postorder-traversal/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "dfs",
        "traversal",
        "stack"
      ]
    },
    {
      "title": "Binary Tree Level Order Traversal II",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/binary-tree-level-order-traversal-ii/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "bfs",
        "level-order"
      ]
    },
    {
      "title": "Average of Levels in Binary Tree",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/average-of-levels-in-binary-tree/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "bfs",
        "level-order"
      ]
    },
    {
      "title": "Same Tree",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/same-tree/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "dfs",
        "recursion"
      ]
    },
    {
      "title": "Balanced Binary Tree",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/balanced-binary-tree/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "dfs",
        "height"
      ]
    },
    {
      "title": "Subtree of Another Tree",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/subtree-of-another-tree/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "dfs",
        "recursion"
      ]
    },
    {
      "title": "Path Sum",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/path-sum/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "dfs",
        "root-to-leaf"
      ]
    },
    {
      "title": "Binary Tree Paths",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/binary-tree-paths/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "dfs",
        "backtracking"
      ]
    },
    {
      "title": "Path Sum II",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/path-sum-ii/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "dfs",
        "backtracking"
      ]
    },
    {
      "title": "Sum Root to Leaf Numbers",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/sum-root-to-leaf-numbers/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "dfs"
      ]
    },
    {
      "title": "Count Good Nodes in Binary Tree",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/count-good-nodes-in-binary-tree/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "dfs"
      ]
    },
    {
      "title": "Count Complete Tree Nodes",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/count-complete-tree-nodes/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "binary-search",
        "tree"
      ]
    },
    {
      "title": "Populating Next Right Pointers in Each Node",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/populating-next-right-pointers-in-each-node/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "bfs",
        "level-order"
      ]
    },
    {
      "title": "Maximum Width of Binary Tree",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/maximum-width-of-binary-tree/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "bfs",
        "indexing"
      ]
    },
    {
      "title": "Flatten Binary Tree to Linked List",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/flatten-binary-tree-to-linked-list/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "dfs",
        "morris"
      ]
    },
    {
      "title": "Construct Binary Tree from Inorder and Postorder Traversal",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "dfs",
        "hashing",
        "divide-and-conquer"
      ]
    },
    {
      "title": "House Robber III",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/house-robber-iii/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "dfs",
        "tree-dp"
      ]
    },
    {
      "title": "All Nodes Distance K in Binary Tree",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "bfs",
        "parent-map"
      ]
    },
    {
      "title": "Serialize and Deserialize Binary Tree",
      "difficulty": "Hard",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "bfs",
        "dfs",
        "design"
      ]
    }
  ],
  "Graphs": [
    {
      "title": "Island Perimeter",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/island-perimeter/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "grid",
        "matrix",
        "dfs"
      ]
    },
    {
      "title": "Max Area of Island",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/max-area-of-island/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "grid",
        "dfs",
        "bfs"
      ]
    },
    {
      "title": "Number of Closed Islands",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/number-of-closed-islands/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "grid",
        "dfs",
        "boundary"
      ]
    },
    {
      "title": "Number of Enclaves",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/number-of-enclaves/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "grid",
        "dfs",
        "boundary"
      ]
    },
    {
      "title": "Surrounded Regions",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/surrounded-regions/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "grid",
        "dfs",
        "boundary"
      ]
    },
    {
      "title": "Pacific Atlantic Water Flow",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/pacific-atlantic-water-flow/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "grid",
        "dfs",
        "multi-source"
      ]
    },
    {
      "title": "Count Sub Islands",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/count-sub-islands/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "grid",
        "dfs"
      ]
    },
    {
      "title": "Rotting Oranges",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/rotting-oranges/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "grid",
        "bfs",
        "multi-source"
      ]
    },
    {
      "title": "01 Matrix",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/01-matrix/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "grid",
        "bfs",
        "multi-source"
      ]
    },
    {
      "title": "As Far from Land as Possible",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/as-far-from-land-as-possible/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "grid",
        "bfs",
        "multi-source"
      ]
    },
    {
      "title": "Shortest Path in Binary Matrix",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/shortest-path-in-binary-matrix/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "grid",
        "bfs",
        "8-directions"
      ]
    },
    {
      "title": "Nearest Exit from Entrance in Maze",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/nearest-exit-from-entrance-in-maze/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "grid",
        "bfs"
      ]
    },
    {
      "title": "Shortest Bridge",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/shortest-bridge/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "grid",
        "dfs",
        "bfs"
      ]
    },
    {
      "title": "Path With Minimum Effort",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/path-with-minimum-effort/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "grid",
        "dijkstra",
        "binary-search"
      ]
    },
    {
      "title": "Word Search",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/word-search/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "grid",
        "dfs",
        "backtracking"
      ]
    },
    {
      "title": "Making A Large Island",
      "difficulty": "Hard",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/making-a-large-island/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "grid",
        "dfs",
        "union-find"
      ]
    },
    {
      "title": "Find if Path Exists in Graph",
      "difficulty": "Easy",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/find-if-path-exists-in-graph/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "graph",
        "bfs",
        "dfs",
        "union-find"
      ]
    },
    {
      "title": "Keys and Rooms",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/keys-and-rooms/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "graph",
        "dfs",
        "bfs"
      ]
    },
    {
      "title": "Is Graph Bipartite?",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/is-graph-bipartite/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "graph",
        "bfs",
        "coloring"
      ]
    },
    {
      "title": "Course Schedule II",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/course-schedule-ii/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "graph",
        "topological-sort"
      ]
    },
    {
      "title": "Redundant Connection",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/redundant-connection/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "graph",
        "union-find"
      ]
    },
    {
      "title": "Cheapest Flights Within K Stops",
      "difficulty": "Medium",
      "platform": "LeetCode",
      "problemLink": "https://leetcode.com/problems/cheapest-flights-within-k-stops/",
      "articleLink": "",
      "youtubeLink": "",
      "tags": [
        "graph",
        "bellman-ford",
        "bfs"
      ]
    }
  ]
}
  }
}
