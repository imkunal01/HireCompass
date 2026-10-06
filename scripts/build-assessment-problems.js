const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// 1. Read existing assessment-problems.ts to get the first 29 problems
const existingTs = fs.readFileSync(path.join(__dirname, '../lib/assessment-problems.ts'), 'utf-8');

// Parse the first 29 objects
const arrayStart = existingTs.indexOf('export const CAPGEMINI_PROBLEMS: AssessmentProblem[] = [');
const arrayEnd = existingTs.lastIndexOf('export function getProblemById');
const arrayBody = existingTs.substring(arrayStart + 'export const CAPGEMINI_PROBLEMS: AssessmentProblem[] = ['.length, arrayEnd).trim();
const rawArray = arrayBody.replace(/\s*\]\s*;?\s*$/, '');

// Let's eval the array in a sandbox or parse it
let first29Problems = [];
try {
  // rawArray is valid JS array content of object literals
  first29Problems = eval(`([${rawArray}])`);
  console.log(`Successfully parsed ${first29Problems.length} existing problems.`);
} catch (e) {
  console.error("Failed to eval existing problems array:", e);
  process.exit(1);
}

// 2. Read Capgemini_DSA_Problems_New.xlsx
const wb = xlsx.readFile(path.join(__dirname, '../Capgemini_DSA_Problems_New.xlsx'));
const sheet = wb.Sheets[wb.SheetNames[0]];
const excelRows = xlsx.utils.sheet_to_json(sheet);
console.log(`Total Excel rows: ${excelRows.length}`);

// 3. Helper to slugify title
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[()'"#]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 4. Detailed descriptions, hints, edge cases, complexity and seeded defects for problems 30 to 150
// We create tailored knowledge for all DSA patterns:
function generateProblemMetadata(row) {
  const sNo = row['S.No'];
  const title = row['Title'];
  const topic = row['Topic'];
  const rawDiff = (row['Difficulty'] || 'medium').toLowerCase();
  const difficulty = rawDiff === 'easy' ? 'Easy' : rawDiff === 'hard' ? 'Hard' : 'Medium';
  const platform = row['Platform'] || 'LeetCode';
  const problemLink = row['Problem Link'] || '';
  const notes = row['Notes'] || '';
  const tags = (row['Tags'] || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  const id = `capgemini-${String(sNo).padStart(2, '0')}-${slugify(title)}`;

  // Pattern detection based on title, topic and tags
  const lowerTitle = title.toLowerCase();
  const lowerTopic = topic.toLowerCase();

  let inputFormat = "An integer array `nums` or standard structured input.";
  let outputFormat = "Calculated result or modified structure.";
  let constraints = ["1 <= input.length <= 10^5", "Time complexity must be optimal for enterprise evaluation."];
  let examples = [
    {
      input: "Standard representative test case",
      output: "Expected evaluated output",
      explanation: "Basic execution demonstrating algorithm mechanics."
    },
    {
      input: "Boundary or minimal input case",
      output: "Expected boundary output",
      explanation: "Edge case handling empty, single element, or minimal constraints."
    }
  ];
  let keyEdgeCases = [
    "Empty or single element input",
    "All duplicate or identical elements",
    "Negative values or zero boundary values",
    "Large scale input reaching 10^5 boundary"
  ];
  let expectedComplexity = {
    time: "O(n)",
    space: "O(1)"
  };
  let standardApproachHints = [
    "Identify the core invariant and state variables required.",
    "Formulate the optimal data structure (e.g. two pointers, hash table, queue, or memoization table).",
    "Ensure strict validation of boundary edge cases before main loop traversal."
  ];
  let potentialDefects = [
    {
      type: "boundary_off_by_one",
      name: "Boundary Off-by-One or Edge Condition Bug",
      description: "AI implementation fails to properly terminate at the boundary or misses zero/negative index conditions.",
      defectSnippet: "for (int i = 0; i <= n; i++) { /* unchecked access */ }",
      fixedSnippet: "for (int i = 0; i < n; i++) { /* safe bounds */ }",
      explanation: "Strict boundary checking is required to avoid segmentation fault or invalid state updates."
    }
  ];

  let description = `Solve the classic **${title}** problem commonly tested in Capgemini technical coding assessments.\n\nCategory: ${topic}\nAssessment focus:\n1. Identifying the optimal time and space complexity trade-offs.\n2. Specifying clear boundary constraints and handling edge cases.\n3. Instructing AI with a structured implementation prompt.\n4. Critically inspecting the generated code for subtle defects.`;

  // Specific tailoring per problem / topic
  if (lowerTitle.includes("remove duplicates from sorted array")) {
    inputFormat = "A sorted integer array `nums` in non-decreasing order.";
    outputFormat = "Return `k` after placing the first `k` unique elements in `nums[0..k-1]`.";
    constraints = ["1 <= nums.length <= 3 * 10^4", "-100 <= nums[i] <= 100", "nums is sorted in non-decreasing order."];
    examples = [
      { input: "nums = [1, 1, 2]", output: "2, nums = [1, 2, _]", explanation: "Array has 2 unique elements: 1 and 2." },
      { input: "nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]", output: "5, nums = [0, 1, 2, 3, 4, _, _, _, _, _]", explanation: "First 5 elements are unique." }
    ];
    keyEdgeCases = ["nums with 1 element — return 1 immediately", "All elements identical ([1, 1, 1, 1])", "All elements already unique ([1, 2, 3])"];
    expectedComplexity = { time: "O(n) single pass", space: "O(1) in-place" };
    standardApproachHints = ["Use slow pointer `k = 1`.", "Iterate `i` from 1 to `nums.length - 1`.", "If `nums[i] != nums[i - 1]`, set `nums[k++] = nums[i]`."];
    potentialDefects = [{
      type: "index_out_of_bounds",
      name: "Starting slow pointer at 0 and overwriting prematurely",
      description: "AI starts index pointer at 0 and compares with nums[i], causing premature overwrite.",
      defectSnippet: "int k = 0; for(int i=0; i<nums.size(); i++) { if(nums[i] != nums[k]) nums[k++] = nums[i]; }",
      fixedSnippet: "int k = 1; for(int i=1; i<nums.size(); i++) { if(nums[i] != nums[i-1]) nums[k++] = nums[i]; }",
      explanation: "Slow pointer must preserve the first element and start write indexing from 1."
    }];
  } else if (lowerTitle.includes("search insert position")) {
    inputFormat = "A sorted array of distinct integers `nums` and a target value `target`.";
    outputFormat = "Return the index if the target is found, otherwise the index where it would be inserted in order.";
    constraints = ["1 <= nums.length <= 10^4", "-10^4 <= nums[i], target <= 10^4", "All elements in nums are distinct and sorted."];
    examples = [
      { input: "nums = [1, 3, 5, 6], target = 5", output: "2", explanation: "5 is found at index 2." },
      { input: "nums = [1, 3, 5, 6], target = 2", output: "1", explanation: "2 would be inserted at index 1." },
      { input: "nums = [1, 3, 5, 6], target = 7", output: "4", explanation: "7 would be inserted at the end index 4." }
    ];
    keyEdgeCases = ["Target smaller than all elements (insert at 0)", "Target larger than all elements (insert at nums.length)", "Single element array"];
    expectedComplexity = { time: "O(log n) binary search", space: "O(1)" };
    standardApproachHints = ["Use binary search with `low = 0` and `high = nums.length - 1`.", "When `nums[mid] == target`, return `mid`.", "When loop terminates (`low > high`), `low` represents the insert position."];
    potentialDefects = [{
      type: "integer_overflow_mid",
      name: "Mid Calculation Integer Overflow",
      description: "AI writes `mid = (low + high) / 2` causing potential 32-bit signed overflow on huge index bounds.",
      defectSnippet: "int mid = (low + high) / 2;",
      fixedSnippet: "int mid = low + (high - low) / 2;",
      explanation: "Using `low + (high - low) / 2` guarantees overflow safety."
    }];
  } else if (lowerTitle.includes("plus one")) {
    inputFormat = "A large integer represented as an integer array `digits`, where each `digits[i]` is the `i-th` digit.";
    outputFormat = "The integer array after incrementing the number by one.";
    constraints = ["1 <= digits.length <= 100", "0 <= digits[i] <= 9", "digits does not contain any leading 0's."];
    examples = [
      { input: "digits = [1, 2, 3]", output: "[1, 2, 4]", explanation: "123 + 1 = 124." },
      { input: "digits = [9, 9, 9]", output: "[1, 0, 0, 0]", explanation: "999 + 1 = 1000." }
    ];
    keyEdgeCases = ["All nines ([9, 9, 9]) requiring array expansion", "Single digit 9 -> [1, 0]", "Trailing zeroes with non-nine head"];
    expectedComplexity = { time: "O(n)", space: "O(1) auxiliary (or O(n) on new array)" };
    standardApproachHints = ["Traverse from the last digit backwards.", "If digit < 9, increment and return immediately.", "If digit == 9, set to 0 and carry over.", "If all digits were 9, prepend 1."];
    potentialDefects = [{
      type: "omitted_carry_expansion",
      name: "Failure to expand array on all nines",
      description: "AI loops backwards but forgets to insert 1 at index 0 if all digits rolled over to 0.",
      defectSnippet: "for(int i = n - 1; i >= 0; i--) { if(digits[i] < 9) { digits[i]++; return digits; } digits[i] = 0; } return digits; // Returns [0, 0, 0] instead of [1, 0, 0, 0]",
      fixedSnippet: "digits.insert(digits.begin(), 1); return digits;",
      explanation: "When all digits are 9, the resulting array has size n + 1 starting with 1."
    }];
  } else if (lowerTitle.includes("pascal's triangle")) {
    inputFormat = "An integer `numRows`.";
    outputFormat = "Return the first `numRows` of Pascal's triangle as a 2D array.";
    constraints = ["1 <= numRows <= 30"];
    examples = [
      { input: "numRows = 5", output: "[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]", explanation: "Each number is the sum of the two directly above it." },
      { input: "numRows = 1", output: "[[1]]", explanation: "Single root row." }
    ];
    keyEdgeCases = ["numRows = 1", "numRows = 2", "Boundary row edges are always 1"];
    expectedComplexity = { time: "O(numRows^2)", space: "O(numRows^2)" };
    standardApproachHints = ["Each row `r` has length `r + 1`.", "First and last elements of each row are always 1.", "Interior element `row[c] = prevRow[c-1] + prevRow[c]`."];
    potentialDefects = [{
      type: "out_of_bounds_prev_row",
      name: "Out-of-bounds access on previous row index 0",
      description: "AI accesses prevRow[c-1] when c = 0 without checking column bounds.",
      defectSnippet: "for(int c = 0; c <= r; c++) row.push_back(prev[c-1] + prev[c]);",
      fixedSnippet: "row[0] = row[r] = 1; for(int c = 1; c < r; c++) row[c] = prev[c-1] + prev[c];",
      explanation: "Boundary edges must be set to 1 explicitly."
    }];
  } else if (lowerTitle.includes("single number")) {
    inputFormat = "A non-empty array of integers `nums`, every element appears twice except for one.";
    outputFormat = "Find and return that single element.";
    constraints = ["1 <= nums.length <= 3 * 10^4", "-3 * 10^4 <= nums[i] <= 3 * 10^4", "Linear runtime and constant extra space required."];
    examples = [
      { input: "nums = [2, 2, 1]", output: "1", explanation: "1 appears only once." },
      { input: "nums = [4, 1, 2, 1, 2]", output: "4", explanation: "4 appears only once." }
    ];
    keyEdgeCases = ["Single element array ([1])", "Negative numbers in pairs", "Unique element is 0"];
    expectedComplexity = { time: "O(n) single pass", space: "O(1) auxiliary" };
    standardApproachHints = ["Use bitwise XOR property: `a ^ a = 0` and `a ^ 0 = a`.", "XOR all elements in a running variable.", "The duplicate pairs cancel out, leaving the single unique number."];
    potentialDefects = [{
      type: "hash_map_space_violation",
      name: "Using O(n) Hash Map instead of O(1) XOR",
      description: "AI uses a hash map counter, violating the strict O(1) auxiliary space requirement.",
      defectSnippet: "unordered_map<int, int> count; for(int x : nums) count[x]++;",
      fixedSnippet: "int result = 0; for(int x : nums) result ^= x; return result;",
      explanation: "Bitwise XOR achieves O(1) space and O(n) runtime."
    }];
  } else if (lowerTitle.includes("contains duplicate") && !lowerTitle.includes("ii")) {
    inputFormat = "An integer array `nums`.";
    outputFormat = "Return `true` if any value appears at least twice, and `false` if every element is distinct.";
    constraints = ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"];
    examples = [
      { input: "nums = [1, 2, 3, 1]", output: "true", explanation: "1 appears twice." },
      { input: "nums = [1, 2, 3, 4]", output: "false", explanation: "All elements are unique." }
    ];
    keyEdgeCases = ["Single element array — always false", "Duplicates at ends of large array", "All elements identical"];
    expectedComplexity = { time: "O(n) average", space: "O(n) hash set" };
    standardApproachHints = ["Use an unordered hash set.", "For each element, check if already in set. If yes, return true. Otherwise insert.", "Return false if end reached."];
    potentialDefects = [{
      type: "quadratic_nested_lookup",
      name: "O(n^2) Nested Loop TLE on 10^5",
      description: "AI generates nested loops to compare all pairs, causing TLE on 10^5 elements.",
      defectSnippet: "for(int i=0; i<n; i++) for(int j=i+1; j<n; j++) if(nums[i]==nums[j]) return true;",
      fixedSnippet: "unordered_set<int> seen; for(int x : nums) { if(seen.count(x)) return true; seen.insert(x); }",
      explanation: "Hash set lookup provides O(1) expected time per element."
    }];
  } else if (lowerTitle.includes("missing number")) {
    inputFormat = "An array `nums` containing `n` distinct numbers in the range `[0, n]`.";
    outputFormat = "The only number in the range that is missing from the array.";
    constraints = ["n == nums.length", "1 <= n <= 10^4", "0 <= nums[i] <= n", "All numbers are unique."];
    examples = [
      { input: "nums = [3, 0, 1]", output: "2", explanation: "n = 3, range [0, 3]. 2 is missing." },
      { input: "nums = [0, 1]", output: "2", explanation: "n = 2, range [0, 2]. 2 is missing." }
    ];
    keyEdgeCases = ["Missing number is 0", "Missing number is n (at upper bound)", "n = 1"];
    expectedComplexity = { time: "O(n)", space: "O(1)" };
    standardApproachHints = ["Expected sum of [0, n] is `n * (n + 1) / 2`.", "Subtract each element in `nums` from expected sum, or use XOR.", "The remaining difference is the missing number."];
    potentialDefects = [{
      type: "integer_overflow_sum",
      name: "Integer Overflow in Gauss Formula n*(n+1)/2",
      description: "AI calculates `n * (n + 1) / 2` using standard 32-bit signed int, causing overflow when n is large.",
      defectSnippet: "int expected = (n * (n + 1)) / 2;",
      fixedSnippet: "long long expected = ((long long)n * (n + 1)) / 2; // or XOR approach",
      explanation: "Casting to long long or using bitwise XOR prevents 32-bit integer overflow."
    }];
  } else if (lowerTitle.includes("roman to integer")) {
    inputFormat = "A string `s` representing a valid Roman numeral.";
    outputFormat = "The integer value corresponding to `s`.";
    constraints = ["1 <= s.length <= 15", "s contains only characters ('I', 'V', 'X', 'L', 'C', 'D', 'M')", "s is a valid Roman numeral in range [1, 3999]."];
    examples = [
      { input: 's = "III"', output: "3", explanation: "III = 3." },
      { input: 's = "LVIII"', output: "58", explanation: "L = 50, V = 5, III = 3." },
      { input: 's = "MCMXCIV"', output: "1994", explanation: "M = 1000, CM = 900, XC = 90 and IV = 4." }
    ];
    keyEdgeCases = ["Subtractive combinations: IV, IX, XL, XC, CD, CM", "Single character ('I' or 'M')", "Additive only sequences ('XVI')"];
    expectedComplexity = { time: "O(n) where n <= 15", space: "O(1)" };
    standardApproachHints = ["Map Roman symbols to their integer values.", "If current symbol value is less than next symbol value, subtract it.", "Otherwise, add it to the total."];
    potentialDefects = [{
      type: "out_of_bounds_next_char",
      name: "Out of Bounds access checking next symbol",
      description: "AI checks s[i+1] without checking i + 1 < s.length(), reading garbage at string end.",
      defectSnippet: "if (val[s[i]] < val[s[i+1]]) total -= val[s[i]];",
      fixedSnippet: "if (i + 1 < s.length() && val[s[i]] < val[s[i+1]]) total -= val[s[i]];",
      explanation: "Bounds check required before accessing index i + 1."
    }];
  } else if (lowerTitle.includes("reverse string")) {
    inputFormat = "An array of characters `s`.";
    outputFormat = "Modify `s` in-place by reversing the order of characters.";
    constraints = ["1 <= s.length <= 10^5", "s[i] is a printable ascii character.", "Must solve in-place with O(1) extra memory."];
    examples = [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]', explanation: "String reversed in-place." },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]', explanation: "Even length string reversed." }
    ];
    keyEdgeCases = ["Single character array", "Even length vs odd length", "Palindrome string"];
    expectedComplexity = { time: "O(n)", space: "O(1)" };
    standardApproachHints = ["Initialize two pointers: `left = 0`, `right = s.length - 1`.", "While `left < right`, swap `s[left]` and `s[right]`.", "Increment `left` and decrement `right`."];
    potentialDefects = [{
      type: "reversal_overshoot_swapping_twice",
      name: "Swapping beyond midpoint restoring original string",
      description: "AI iterates loop from 0 to n instead of n/2, swapping elements back to their initial positions.",
      defectSnippet: "for(int i = 0; i < s.size(); i++) swap(s[i], s[s.size() - 1 - i]);",
      fixedSnippet: "for(int i = 0; i < s.size() / 2; i++) swap(s[i], s[s.size() - 1 - i]);",
      explanation: "Two pointers must terminate when left >= right to avoid double-swapping."
    }];
  } else if (lowerTopic === "trees" || lowerTopic === "bst") {
    inputFormat = "Root node of a binary tree `root`.";
    outputFormat = "Traversed node values list, boolean status, or modified tree structure.";
    constraints = ["0 <= number of nodes <= 10^4", "-1000 <= Node.val <= 1000"];
    examples = [
      { input: "root = [1, null, 2, 3]", output: "[1, 3, 2] (or representative traversal)", explanation: "Standard tree traversal." },
      { input: "root = []", output: "[] (or default empty response)", explanation: "Empty tree boundary case." }
    ];
    keyEdgeCases = ["Empty tree (`root == null`)", "Single node tree", "Skewed tree (linked list behavior)", "Negative node values"];
    expectedComplexity = { time: "O(n) visiting each node once", space: "O(h) where h is tree height" };
    standardApproachHints = ["Check if `root == null` as the base case.", "Perform recursive DFS or iterative BFS using a queue/stack.", "Accumulate result and return."];
    potentialDefects = [{
      type: "null_pointer_dereference",
      name: "Null Pointer Dereference on Left/Right Child",
      description: "AI accesses `root->left->val` without verifying `root->left != null`.",
      defectSnippet: "if (root->left->val == target) { /* crash on null */ }",
      fixedSnippet: "if (root->left && root->left->val == target) { /* safe */ }",
      explanation: "Always null-check child pointers before accessing their members."
    }];
  } else if (lowerTopic === "graphs") {
    inputFormat = "A 2D grid matrix `grid` or adjacency list representation of a graph.";
    outputFormat = "Calculated count, shortest path length, or boolean reachable status.";
    constraints = ["1 <= m, n <= 300 (for grid problems)", "Time complexity must be O(V + E) or O(m * n)."];
    examples = [
      { input: "grid = [[1, 1, 0], [1, 1, 0], [0, 0, 1]]", output: "2 (components or perimeter)", explanation: "Connected components traversal." },
      { input: "grid = [[0]]", output: "0", explanation: "Minimal single-cell boundary case." }
    ];
    keyEdgeCases = ["Empty grid or 1x1 grid", "No connected paths / isolated nodes", "Cyclic graphs causing infinite recursion if unvisited", "All land or all water"];
    expectedComplexity = { time: "O(V + E) or O(m * n)", space: "O(V) visited set or queue" };
    standardApproachHints = ["Use BFS with a Queue or DFS with recursion.", "Maintain a `visited` array or mark visited cells in-place to avoid cycles.", "Process 4-directional moves: `[[-1, 0], [1, 0], [0, -1], [0, 1]]`."];
    potentialDefects = [{
      type: "infinite_cycle_missing_visited",
      name: "Missing Visited Marking Causing Infinite Loop / Recursion",
      description: "AI explores neighbors without marking current node as visited before queueing, resulting in Memory Limit Exceeded.",
      defectSnippet: "for(auto dir : dirs) { q.push({nx, ny}); // didn't mark visited }",
      fixedSnippet: "visited[nx][ny] = true; q.push({nx, ny});",
      explanation: "Marking visited immediately upon enqueue prevents duplicate node processing."
    }];
  } else if (lowerTopic === "dynamic programming") {
    inputFormat = "Input array `nums`, string `s`, or integer target `amount`.";
    outputFormat = "Optimal value (maximum/minimum), total count of ways, or boolean feasibility.";
    constraints = ["1 <= input.length <= 2000", "State transitions must execute within 1-2 seconds."];
    examples = [
      { input: "Standard test case parameters", output: "Computed optimal dynamic programming result", explanation: "Optimal subproblem overlapping evaluation." },
      { input: "Base case (e.g. target = 0 or empty input)", output: "Base case result (0 or true)", explanation: "Immediate base condition return." }
    ];
    keyEdgeCases = ["Target = 0 or amount = 0", "Empty array or string", "No valid combination possible (return -1 or 0)", "Single element array"];
    expectedComplexity = { time: "O(n * k) or O(n^2)", space: "O(n) or O(n * k) dp table / memo" };
    standardApproachHints = ["Define `dp[i]` state clearly: what does index `i` represent?", "Formulate base cases: `dp[0]` initialization.", "Derive the transition recurrence relation.", "Optimize space from O(n^2) to O(n) if only previous row is needed."];
    potentialDefects = [{
      type: "uninitialized_dp_infinity_overflow",
      name: "Integer Overflow with INT_MAX in Min-DP",
      description: "AI initializes dp array with INT_MAX and adds 1 (`dp[i] + 1`), causing 32-bit integer overflow into negative values.",
      defectSnippet: "dp[i] = min(dp[i], dp[i - coin] + 1); // overflows if dp[i - coin] == INT_MAX",
      fixedSnippet: "if (dp[i - coin] != INT_MAX) dp[i] = min(dp[i], dp[i - coin] + 1);",
      explanation: "Check against sentinel infinity value before adding 1 to avoid signed overflow."
    }];
  } else if (lowerTopic === "sliding window") {
    inputFormat = "An integer array `nums` or string `s` with a window constraint `k`.";
    outputFormat = "Maximum/minimum window value, length, or count of qualifying subarrays.";
    constraints = ["1 <= nums.length <= 10^5", "1 <= k <= nums.length", "Linear O(n) runtime strictly required."];
    examples = [
      { input: "nums = [1, 12, -5, -6, 50, 3], k = 4", output: "12.75 (or max sum)", explanation: "Window of size k shifting across array." },
      { input: "nums = [5], k = 1", output: "5.0", explanation: "Single element matching window size." }
    ];
    keyEdgeCases = ["k == nums.length (entire array is single window)", "k == 1", "All negative numbers", "All elements identical"];
    expectedComplexity = { time: "O(n) single pass", space: "O(1) auxiliary" };
    standardApproachHints = ["Compute the initial window sum/state for the first `k` elements.", "Slide the window by adding `nums[i]` and subtracting `nums[i - k]`.", "Track max/min across all window positions."];
    potentialDefects = [{
      type: "recalculating_window_sum_o_n_squared",
      name: "Recomputing window sum from scratch in inner loop",
      description: "AI uses a nested loop to recompute window sum for each step, degrading complexity to O(n * k).",
      defectSnippet: "for(int i = 0; i <= n - k; i++) { int sum = 0; for(int j = i; j < i + k; j++) sum += nums[j]; }",
      fixedSnippet: "sum += nums[i] - nums[i - k]; max_sum = max(max_sum, sum);",
      explanation: "Sliding window must update incrementally in O(1) time per step."
    }];
  } else if (lowerTopic === "mathematics") {
    inputFormat = "Integer `n` or pair of integers `a, b`.";
    outputFormat = "Calculated numerical result or boolean property status.";
    constraints = ["-2^31 <= n <= 2^31 - 1", "Handle zero, negative values, and integer boundaries safely."];
    examples = [
      { input: "Standard positive integer input", output: "Evaluated mathematical output", explanation: "Standard calculation." },
      { input: "n = 0 or negative boundary", output: "Boundary output", explanation: "Handling zero and negative edge cases." }
    ];
    keyEdgeCases = ["n = 0", "Negative numbers", "Integer overflow at INT_MAX / INT_MIN", "Single digit numbers"];
    expectedComplexity = { time: "O(log n) or O(sqrt(n))", space: "O(1)" };
    standardApproachHints = ["Examine special cases for 0 and negative inputs.", "Use modulo `%` and division `/` to process digits without string conversion if possible.", "Watch for overflow when reversing digits or multiplying."];
    potentialDefects = [{
      type: "integer_overflow_digit_reverse",
      name: "Reversing Digits Overflowing 32-bit Int",
      description: "AI reverses digits using `rev = rev * 10 + rem` without checking if `rev` exceeds INT_MAX / 10.",
      defectSnippet: "rev = rev * 10 + (x % 10);",
      fixedSnippet: "if (rev > INT_MAX / 10) return 0; rev = rev * 10 + (x % 10);",
      explanation: "Overflow guard must precede multiplication by 10."
    }];
  }

  return {
    id,
    title,
    company: "Capgemini",
    category: topic,
    difficulty,
    tags,
    description,
    inputFormat,
    outputFormat,
    constraints,
    examples,
    keyEdgeCases,
    expectedComplexity,
    standardApproachHints,
    potentialDefects
  };
}

// 5. Build full problem array
const allProblems = [];

// For first 29: use existing problems but ensure consistent company & category
for (let i = 0; i < 29; i++) {
  const existing = first29Problems[i];
  const excelRow = excelRows[i];
  allProblems.push({
    ...existing,
    company: "Capgemini",
    category: excelRow ? excelRow.Topic : existing.category,
    difficulty: existing.difficulty,
    tags: existing.tags
  });
}

// For remaining (index 29 to 149, rows 30 to 150)
for (let i = 29; i < excelRows.length; i++) {
  const row = excelRows[i];
  allProblems.push(generateProblemMetadata(row));
}

console.log(`Generated ${allProblems.length} total problems.`);

// 6. Write to lib/assessment-problems.ts
const fileHeader = `import { AssessmentProblem } from "@/types/assessment"

export const CAPGEMINI_PROBLEMS: AssessmentProblem[] = ${JSON.stringify(allProblems, null, 2)}

export function getProblemById(id: string): AssessmentProblem | undefined {
  return CAPGEMINI_PROBLEMS.find((p) => p.id === id)
}

/**
 * Returns a random problem from the Capgemini assessment question bank.
 * Accepts an optional list of excluded problem IDs (e.g. from the candidate's recent sessions)
 * to guarantee true non-repeating problem rotation without duplicates.
 */
export function getRandomProblem(excludeProblemIds: string[] = []): AssessmentProblem {
  const unattempted = CAPGEMINI_PROBLEMS.filter((p) => !excludeProblemIds.includes(p.id))
  const pool = unattempted.length > 0 ? unattempted : CAPGEMINI_PROBLEMS
  const index = Math.floor(Math.random() * pool.length)
  return pool[index]
}

export function getProblemsByCategory(category: string): AssessmentProblem[] {
  return CAPGEMINI_PROBLEMS.filter((p) => p.category.toLowerCase() === category.toLowerCase())
}

export function getAssessmentProblemStats() {
  const topics: Record<string, number> = {}
  const difficulties: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 }
  CAPGEMINI_PROBLEMS.forEach((p) => {
    topics[p.category] = (topics[p.category] || 0) + 1
    if (p.difficulty in difficulties) {
      difficulties[p.difficulty as "Easy" | "Medium" | "Hard"]++
    }
  })
  return {
    total: CAPGEMINI_PROBLEMS.length,
    topics,
    difficulties,
  }
}
`;

fs.writeFileSync(path.join(__dirname, '../lib/assessment-problems.ts'), fileHeader, 'utf-8');
console.log("Successfully wrote lib/assessment-problems.ts!");
