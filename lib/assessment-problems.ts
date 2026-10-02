import { AssessmentProblem } from "@/types/assessment"

export const CAPGEMINI_PROBLEMS: AssessmentProblem[] = [
  {
    id: "capgemini-01-non-repeating",
    title: "First Non-Repeating Element in an Array",
    company: "Capgemini",
    category: "Arrays & Hash Maps",
    difficulty: "Easy",
    tags: ["Hash Table", "Frequency Counter", "Two Pass", "Warm-Up"],
    description: `Given an array of integers \`nums\`, find and return the first element that appears exactly once in the array. 

If no non-repeating element exists in the array, return \`-1\` (or \`null\` in dynamic languages).

The assessment evaluates your ability to direct the AI through:
1. Identifying boundary conditions (empty array, all elements repeated)
2. Choosing the optimal O(n) frequency map over an O(n^2) nested loop
3. Formulating an implementation prompt specifying language and edge-case handling
4. Inspecting the AI-generated code for boundary checks and potential map lookup flaws`,
    inputFormat: "An integer array `nums` of length `n`.",
    outputFormat: "A single integer representing the first non-repeating element, or `-1` if none exists.",
    constraints: [
      "0 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9",
      "Time complexity must be O(n)",
      "Auxiliary space must be O(n)",
    ],
    examples: [
      {
        input: "nums = [9, 4, 9, 6, 7, 4]",
        output: "6",
        explanation: "9 and 4 repeat. 6 is the first element with frequency 1.",
      },
      {
        input: "nums = [1, 2, 3, 1, 2, 3]",
        output: "-1",
        explanation: "Every element appears more than once. Return -1.",
      },
      {
        input: "nums = []",
        output: "-1",
        explanation: "The array is empty, so no non-repeating element exists.",
      },
    ],
    keyEdgeCases: [
      "Empty array (`nums.length == 0`) — must safely return -1 without out-of-bounds error",
      "Single element array (`nums.length == 1`) — trivially non-repeating, return nums[0]",
      "All duplicate elements (`[5, 5, 5, 5]`) — return -1",
      "Unique element is at index 0 or the very last index",
      "Large numbers up to 10^9 — requires hash map rather than a direct-indexed array",
    ],
    expectedComplexity: {
      time: "O(n) average time (two linear passes)",
      space: "O(n) space for frequency hash table",
    },
    standardApproachHints: [
      "First pass: Build a hash map / unordered_map counting occurrences of each integer.",
      "Second pass: Iterate through the original array order and return the first key with count == 1.",
      "If the loop finishes without finding any count == 1, return -1.",
    ],
    potentialDefects: [
      {
        type: "missing_empty_check",
        name: "Missing Empty Array Boundary Guard",
        description: "The AI implementation directly accesses nums[0] or skips checking nums.empty(), leading to undefined behavior or out-of-bounds exceptions on empty input.",
        defectSnippet: "// Assumes array has at least one element\nif (nums.empty()) return -1; // OMITTED in defect",
        fixedSnippet: "if (nums.empty()) return -1;",
        explanation: "Empty array access must be guarded before any element retrieval.",
      },
      {
        type: "iterating_map_instead_of_array",
        name: "Iterating Hash Map Instead of Array Order",
        description: "The AI iterates over the hash map keys to find frequency 1 instead of iterating through the original array, losing the original insertion order.",
        defectSnippet: "for (const auto& [val, count] : freqMap) { if (count == 1) return val; }",
        fixedSnippet: "for (int x : nums) { if (freqMap[x] == 1) return x; }",
        explanation: "A standard unordered_map does not preserve the original array order. Second pass must iterate nums.",
      },
    ],
  },
  {
    id: "capgemini-02-max-subarray-sum-k",
    title: "Maximum Length Subarray With Sum at Most K",
    company: "Capgemini",
    category: "Sliding Window & Two Pointers",
    difficulty: "Medium",
    tags: ["Sliding Window", "Two Pointers", "Prefix Sum", "Capgemini Core"],
    description: `Given an array of positive integers \`nums\` and a positive integer \`k\`, find the maximum length of a contiguous subarray whose sum is less than or equal to \`k\`.

If no such valid subarray exists, return \`0\`.

Assessment focus:
- Demonstrating understanding of why positive integers guarantee the monotonic sliding window invariant
- Articulating O(n) two-pointer approach vs O(n^2) brute force
- Specifying strict constraints in the prompt (array length up to 10^5)
- Reviewing the AI code for window size calculation and boundary conditions`,
    inputFormat: "An array of positive integers `nums` and a positive integer `k`.",
    outputFormat: "A single integer denoting the maximum length of a contiguous subarray whose sum is <= k.",
    constraints: [
      "1 <= nums.length <= 10^5",
      "1 <= nums[i] <= 10^4",
      "1 <= k <= 10^9",
      "All elements in nums are strictly positive",
      "Time complexity must be O(n)",
      "Space complexity must be O(1)",
    ],
    examples: [
      {
        input: "nums = [1, 2, 1, 0, 1, 1, 0], k = 4",
        output: "5",
        explanation: "Subarray [1, 0, 1, 1, 0] has sum 3 <= 4 with length 5.",
      },
      {
        input: "nums = [3, 1, 2, 1, 4, 5], k = 4",
        output: "3",
        explanation: "Subarray [1, 2, 1] has sum 4 <= 4 with length 3.",
      },
      {
        input: "nums = [5, 6, 7], k = 4",
        output: "0",
        explanation: "Every single element exceeds k = 4, so no valid subarray exists.",
      },
    ],
    keyEdgeCases: [
      "Empty array (`nums.length == 0`) — return 0",
      "All single elements are greater than k — return 0",
      "Entire array sum is <= k — return nums.length",
      "Single element equals k — return 1",
      "Sum accumulation overflow if 32-bit integer limits are exceeded",
    ],
    expectedComplexity: {
      time: "O(n) — each element is added and removed from the window at most once",
      space: "O(1) auxiliary space",
    },
    standardApproachHints: [
      "Maintain a running sum of the sliding window `[left, right]`.",
      "Expand `right` from 0 to n - 1, adding `nums[right]` to `currentSum`.",
      "While `currentSum > k`, shrink the window by subtracting `nums[left]` and incrementing `left`.",
      "At each valid step, update `maxLen = max(maxLen, right - left + 1)`.",
    ],
    potentialDefects: [
      {
        type: "off_by_one_window_calc",
        name: "Off-by-One Window Length Calculation",
        description: "The AI calculates window length as `right - left` instead of `right - left + 1`.",
        defectSnippet: "maxLen = max(maxLen, right - left);",
        fixedSnippet: "maxLen = max(maxLen, right - left + 1);",
        explanation: "A window spanning inclusive indices [left, right] has length (right - left + 1).",
      },
      {
        type: "wrong_shrink_condition",
        name: "Incorrect Window Shrink Condition",
        description: "The AI shrinks the window when `currentSum >= k` instead of strictly `currentSum > k`, prematurely throwing away valid subarrays with sum == k.",
        defectSnippet: "while (currentSum >= k && left <= right) { currentSum -= nums[left++]; }",
        fixedSnippet: "while (currentSum > k && left <= right) { currentSum -= nums[left++]; }",
        explanation: "The condition specifies sum at most k, meaning sum == k is valid.",
      },
    ],
  },
  {
    id: "capgemini-03-merge-intervals",
    title: "Merge Overlapping Work Intervals with Execution Caps",
    company: "Capgemini",
    category: "Intervals & Sorting",
    difficulty: "Medium",
    tags: ["Intervals", "Greedy", "Sorting", "Production Scheduling"],
    description: `Given an array of work interval pairs \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping or abutting intervals, and return an array of the non-overlapping intervals that cover all intervals in the input.

Two intervals \`[a, b]\` and \`[c, d]\` are considered overlapping or abutting if \`b >= c\` (they touch or overlap).

Assessment focus:
- Pre-sorting requirement: Candidate must recognize input is not guaranteed to be sorted
- Complexity analysis: Explaining why sorting dominates at O(n log n)
- Prompting AI to handle empty arrays and single-interval inputs
- Code review: Checking if the AI remembered to include adjacent/abutting boundaries and append the final interval`,
    inputFormat: "A 2D array of integers `intervals` where each element is `[start, end]`.",
    outputFormat: "A 2D array of merged non-overlapping intervals.",
    constraints: [
      "0 <= intervals.length <= 10^5",
      "intervals[i].length == 2",
      "0 <= start_i <= end_i <= 10^9",
      "Input is NOT guaranteed to be sorted",
      "Time complexity must be O(n log n)",
      "Space complexity must be O(n) to store results",
    ],
    examples: [
      {
        input: "intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]",
        output: "[[1, 6], [8, 10], [15, 18]]",
        explanation: "Intervals [1, 3] and [2, 6] overlap, merging into [1, 6].",
      },
      {
        input: "intervals = [[1, 4], [4, 5]]",
        output: "[[1, 5]]",
        explanation: "Intervals [1, 4] and [4, 5] touch at boundary 4 and must be merged.",
      },
      {
        input: "intervals = [[5, 8], [1, 3]]",
        output: "[[1, 3], [5, 8]]",
        explanation: "Input is unsorted. After sorting and checking overlap, both remain separate.",
      },
    ],
    keyEdgeCases: [
      "Empty intervals array (`[]`) — must return `[]`",
      "Single interval (`[[2, 5]]`) — must return `[[2, 5]]`",
      "Abutting intervals touching at boundary (`[1, 3]` and `[3, 7]`) — must merge to `[1, 7]`",
      "Completely nested intervals (`[1, 10]` and `[2, 5]`) — merged to `[1, 10]`",
      "All intervals completely identical (`[[1, 2], [1, 2], [1, 2]]`) — merged to `[[1, 2]]`",
    ],
    expectedComplexity: {
      time: "O(n log n) due to initial sorting by start time",
      space: "O(n) auxiliary space for merged result",
    },
    standardApproachHints: [
      "Sort intervals in ascending order by start time: `a[0] < b[0]`.",
      "Initialize `merged` list with the first interval.",
      "Iterate through subsequent intervals: if current start <= previous end, merge: `previous.end = max(previous.end, current.end)`.",
      "Otherwise, push current interval to `merged`.",
    ],
    potentialDefects: [
      {
        type: "omitted_sort_step",
        name: "Omission of Input Sorting",
        description: "The AI linear merge assumes intervals are already pre-sorted and omits the sorting pass, causing incorrect results on unsorted inputs.",
        defectSnippet: "// Assumes input is already sorted\nfor (const auto& interval : intervals) { ... }",
        fixedSnippet: "std::sort(intervals.begin(), intervals.end(), [](const auto& a, const auto& b) { return a[0] < b[0]; });",
        explanation: "Unsorted intervals must always be sorted by start time first.",
      },
      {
        type: "strictly_less_than_boundary",
        name: "Strictly Less-Than Boundary Defect",
        description: "The AI checks `current[0] < last[1]` instead of `current[0] <= last[1]`, failing to merge abutting intervals like [1, 4] and [4, 5].",
        defectSnippet: "if (interval[0] < last[1]) { last[1] = max(last[1], interval[1]); }",
        fixedSnippet: "if (interval[0] <= last[1]) { last[1] = max(last[1], interval[1]); }",
        explanation: "Abutting intervals touch at the boundary point and must be merged with <=.",
      },
    ],
  },
  {
    id: "capgemini-04-lru-cache",
    title: "LRU Cache Invalidation Engine",
    company: "Capgemini",
    category: "System Data Structures & Design",
    difficulty: "Hard",
    tags: ["Hash Map", "Doubly Linked List", "O(1) Design", "Cache Eviction"],
    description: `Design a data structure that follows the constraints of a Least Recently Used (LRU) Cache.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\`: Initialize LRU cache with positive size capacity.
- \`int get(int key)\`: Return value of the key if it exists, otherwise return -1.
- \`void put(int key, int value)\`: Update value if key exists; otherwise add key-value pair. If number of keys exceeds capacity, evict least recently used key.

Both \`get\` and \`put\` operations must run in \`O(1)\` average time complexity.`,
    inputFormat: "Commands: `[\"LRUCache\", \"put\", \"put\", \"get\", \"put\", \"get\"]` with corresponding arguments.",
    outputFormat: "Array of outputs matching standard design problem format.",
    constraints: [
      "1 <= capacity <= 3000",
      "0 <= key <= 10^4",
      "0 <= value <= 10^5",
      "At most 2 * 10^5 calls to get and put",
      "get and put MUST run in O(1) average time",
    ],
    examples: [
      {
        input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
        output: "[null, null, null, 1, null, -1, null, -1, 3, 4]",
        explanation: "put(1,1), put(2,2), get(1) -> 1, put(3,3) evicts key 2, get(2) -> -1.",
      },
    ],
    keyEdgeCases: [
      "Capacity = 1: every new put immediately evicts the previous item",
      "Updating an existing key: value updates, node becomes most recently used, capacity count does NOT increase",
      "get() on non-existent key: returns -1 and must NOT mutate the cache order",
      "Double dummy head/tail pointers: avoids edge cases with null head/tail updates",
    ],
    expectedComplexity: {
      time: "O(1) average time for both get and put operations",
      space: "O(capacity) space to store nodes and hash map lookups",
    },
    standardApproachHints: [
      "Use a Doubly Linked List to maintain recency order (Head = MRU, Tail = LRU).",
      "Use a Hash Map mapping `key -> Node*` for O(1) node lookup.",
      "Use dummy Head and Tail nodes to eliminate null boundary checks during node detachment and insertion.",
    ],
    potentialDefects: [
      {
        type: "forget_hashmap_erase",
        name: "Failure to Delete Evicted Key From Hash Map",
        description: "When evicting the least recently used node from the doubly linked list, the AI removes the node but forgets to erase its key from the hash map, resulting in phantom keys.",
        defectSnippet: "Node* lru = tail->prev;\nremoveNode(lru);\ndelete lru;\n// map.erase(lru->key) OMITTED",
        fixedSnippet: "Node* lru = tail->prev;\nmap.erase(lru->key);\nremoveNode(lru);\ndelete lru;",
        explanation: "Both the linked list and hash map must stay synchronized upon eviction.",
      },
    ],
  },
  {
    id: "capgemini-05-longest-palindrome",
    title: "Longest Palindromic Substring via Expand Around Center",
    company: "Capgemini",
    category: "Strings & Two Pointers",
    difficulty: "Medium",
    tags: ["Strings", "Two Pointers", "Expand Around Center", "Capgemini Classic"],
    description: `Given a string \`s\`, return the longest palindromic substring in \`s\`.

A substring is a contiguous sequence of characters within the string.

Assessment requirements:
- Explain why expand-around-center achieves O(1) auxiliary space compared to DP table O(n^2) space.
- Address both odd-length (single center \`i\`) and even-length (dual center \`i, i+1\`) palindromes.
- Review AI implementation for off-by-one substring index boundaries.`,
    inputFormat: "A single string `s`.",
    outputFormat: "The longest palindromic substring.",
    constraints: [
      "1 <= s.length <= 1000",
      "`s` consists of only digits and English letters",
      "Auxiliary space must be O(1)",
      "Time complexity must be O(n^2)",
    ],
    examples: [
      {
        input: 's = "babad"',
        output: '"bab"',
        explanation: '"aba" is also a valid answer.',
      },
      {
        input: 's = "cbbd"',
        output: '"bb"',
        explanation: 'Even-length palindrome "bb" is the longest.',
      },
      {
        input: 's = "a"',
        output: '"a"',
        explanation: "Single character is a trivial palindrome of length 1.",
      },
    ],
    keyEdgeCases: [
      "Single character string (`s = \"a\"`) — returns itself",
      "All characters identical (`s = \"aaaaa\"`) — returns entire string",
      "No palindromes longer than 1 (`s = \"abcdef\"`) — returns any single character (usually s[0])",
      "Even-length palindrome at string boundary (`s = \"abba\"`)",
    ],
    expectedComplexity: {
      time: "O(n^2) time — 2n - 1 centers, expanding up to n steps each",
      space: "O(1) auxiliary space",
    },
    standardApproachHints: [
      "There are 2n - 1 possible centers: n odd centers (i, i) and n - 1 even centers (i, i + 1).",
      "Helper function `expand(left, right)` moves outward while characters match and bounds are valid.",
      "Track `startIndex` and `maxLen`.",
    ],
    potentialDefects: [
      {
        type: "omitted_even_centers",
        name: "Omission of Even-Length Palindrome Centers",
        description: "The AI only checks odd centers (i, i) and completely skips even centers (i, i + 1), failing on cases like 'cbbd' or 'abba'.",
        defectSnippet: "for (int i = 0; i < n; i++) { auto [start, len] = expand(i, i); ... }",
        fixedSnippet: "for (int i = 0; i < n; i++) {\n  auto [s1, l1] = expand(i, i);\n  auto [s2, l2] = expand(i, i + 1);\n}",
        explanation: "Palindromes can be odd or even in length; both centers must be checked.",
      },
    ],
  },
]

export function getProblemById(id: string): AssessmentProblem | undefined {
  return CAPGEMINI_PROBLEMS.find((p) => p.id === id)
}
