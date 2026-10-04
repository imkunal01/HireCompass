import { AssessmentProblem } from "@/types/assessment"

export const CAPGEMINI_PROBLEMS: AssessmentProblem[] = [
  {
    "id": "capgemini-01-move-special-chars",
    "title": "Move Special Characters ('#') to Front",
    "company": "Capgemini",
    "category": "Arrays & Strings",
    "difficulty": "Easy",
    "tags": [
      "Two-Pointer",
      "In-Place Traversal",
      "String Manipulation",
      "Q1 Analyst"
    ],
    "description": "Given a string `s`, move all occurrences of the special character `'#'` to the front of the string while maintaining the relative order of all other characters.\n\nThe algorithm must run in linear time and operate in-place with O(1) auxiliary space (or O(n) space in languages where strings are immutable).\n\nAssessment focus:\n1. Two-pointer traversal from the end of the string moving backward\n2. Preserving the exact relative ordering of non-hash characters\n3. Edge conditions: string with no '#', string with all '#', or empty string\n4. Reviewing AI code for overwrite bugs or off-by-one index placement",
    "inputFormat": "A single string `s` consisting of letters, digits, and `'#'`.",
    "outputFormat": "A string with all `'#'` characters shifted to the beginning.",
    "constraints": [
      "0 <= s.length <= 10^5",
      "s contains ASCII alphanumeric characters and '#'",
      "Time complexity must be O(n)",
      "Auxiliary space must be O(1) (excluding returned string)"
    ],
    "examples": [
      {
        "input": "s = \"Move#Hash#to#Front\"",
        "output": "\"###MoveHashtoFront\"",
        "explanation": "All 3 '#' characters are moved to the front while preserving the sequence 'MoveHashtoFront'."
      },
      {
        "input": "s = \"NoSpecialChars\"",
        "output": "\"NoSpecialChars\"",
        "explanation": "No '#' characters exist, original string returned unchanged."
      },
      {
        "input": "s = \"###\"",
        "output": "\"###\"",
        "explanation": "All characters are '#'."
      }
    ],
    "keyEdgeCases": [
      "Empty string (`s = \"\"`) — must return \"\" without index bounds error",
      "No '#' present in string — must return original string unmodified",
      "All characters are '#' — must return original string",
      "String already has all '#' at front (`\"##abc\"`)",
      "Single character '#' or non-'#'"
    ],
    "expectedComplexity": {
      "time": "O(n) single or double pass",
      "space": "O(1) auxiliary space"
    },
    "standardApproachHints": [
      "Traverse from the end of the string towards the beginning.",
      "Maintain a write pointer starting at the last index.",
      "Copy non-'#' characters to the write pointer index and decrement write pointer.",
      "Fill the remaining positions from 0 to write pointer with '#'."
    ],
    "potentialDefects": [
      {
        "type": "forward_overwrite_order_loss",
        "name": "Forward Traversal Overwrites Relative Order",
        "description": "The AI iterates from index 0 forward and swaps '#' forward, which inverts or disrupts the relative order of non-special characters.",
        "defectSnippet": "for (int i = 0; i < s.length(); i++) { if (s[i] == '#') swap(s[i], s[hashIdx++]); }",
        "fixedSnippet": "int writeIdx = s.length() - 1;\nfor (int i = s.length() - 1; i >= 0; i--) {\n  if (s[i] != '#') s[writeIdx--] = s[i];\n}\nwhile (writeIdx >= 0) s[writeIdx--] = '#';",
        "explanation": "To preserve relative order in-place, the write pointer must start from the end."
      }
    ]
  },
  {
    "id": "capgemini-02-move-zeroes",
    "title": "Move Zeroes to End",
    "company": "Capgemini",
    "category": "Arrays & Strings",
    "difficulty": "Easy",
    "tags": [
      "Two Pointers",
      "Array In-Place Shift",
      "LeetCode #283",
      "Q1 Analyst"
    ],
    "description": "Given an integer array `nums`, move all `0`s to the end of it while maintaining the relative order of the non-zero elements.\n\nYou must do this in-place without making a copy of the array and minimize the total number of operations.\n\nAssessment focus:\n- Explaining the two-pointer compaction technique\n- Establishing why O(n) time and O(1) space are strictly required\n- Prompting AI to handle all-zero or zero-free arrays\n- Reviewing AI code to ensure trailing zeroes are properly written",
    "inputFormat": "An integer array `nums` of length `n`.",
    "outputFormat": "Modify `nums` in-place (or return modified array).",
    "constraints": [
      "1 <= nums.length <= 10^5",
      "-2^31 <= nums[i] <= 2^31 - 1",
      "Time complexity must be O(n)",
      "Space complexity must be O(1)"
    ],
    "examples": [
      {
        "input": "nums = [0, 1, 0, 3, 12]",
        "output": "[1, 3, 12, 0, 0]",
        "explanation": "Non-zero elements [1, 3, 12] retain their order, zeroes placed at the end."
      },
      {
        "input": "nums = [0]",
        "output": "[0]",
        "explanation": "Single zero element remains [0]."
      },
      {
        "input": "nums = [4, 5, 6]",
        "output": "[4, 5, 6]",
        "explanation": "No zeroes present, array remains untouched."
      }
    ],
    "keyEdgeCases": [
      "Array with no zeroes (`[1, 2, 3]`) — no changes should occur",
      "Array with all zeroes (`[0, 0, 0]`) — must remain all zeroes",
      "Zeroes already at the end (`[1, 2, 0, 0]`)",
      "Alternating zeroes and non-zeroes (`[0, 1, 0, 2, 0, 3]`)"
    ],
    "expectedComplexity": {
      "time": "O(n) single pass",
      "space": "O(1) auxiliary space"
    },
    "standardApproachHints": [
      "Use pointer `insertPos = 0`.",
      "Iterate `i` through `nums`: when `nums[i] != 0`, assign `nums[insertPos++] = nums[i]`.",
      "After the loop, fill remaining indices from `insertPos` to `n - 1` with `0`."
    ],
    "potentialDefects": [
      {
        "type": "omitted_zero_fill",
        "name": "Omission of Trailing Zero Fill",
        "description": "The AI compacts non-zero elements to the front but forgets the second loop to fill indices from insertPos to end with 0.",
        "defectSnippet": "int insertPos = 0;\nfor (int x : nums) if (x != 0) nums[insertPos++] = x;\n// Missed loop filling remaining with 0",
        "fixedSnippet": "int insertPos = 0;\nfor (int x : nums) if (x != 0) nums[insertPos++] = x;\nwhile (insertPos < nums.size()) nums[insertPos++] = 0;",
        "explanation": "Failing to overwrite trailing elements leaves stale duplicated values."
      }
    ]
  },
  {
    "id": "capgemini-03-run-length-compression",
    "title": "Run-Length String Compression",
    "company": "Capgemini",
    "category": "Arrays & Strings",
    "difficulty": "Medium",
    "tags": [
      "Two Pointers",
      "In-Place Compression",
      "LeetCode #443",
      "Q1 Analyst"
    ],
    "description": "Given an array of characters `chars`, compress it using the following algorithm:\n\nBegin with an empty string `s`. For each group of consecutive repeating characters in `chars`:\n- If the group's length is `1`, append the character to `s`.\n- Otherwise, append the character followed by the group's length.\n\nThe compressed string `s` must be stored in the input character array `chars` in-place. Note that group lengths that are 10 or longer will be split into multiple characters in `chars`. Return the new length of the array.",
    "inputFormat": "An array of characters `chars`.",
    "outputFormat": "Return the new length of the array after in-place compression.",
    "constraints": [
      "1 <= chars.length <= 10^5",
      "chars[i] is a lowercase English letter, uppercase letter, digit, or symbol",
      "Auxiliary space must be O(1)"
    ],
    "examples": [
      {
        "input": "chars = [\"a\",\"a\",\"b\",\"b\",\"c\",\"c\",\"c\"]",
        "output": "6, chars = [\"a\",\"2\",\"b\",\"2\",\"c\",\"3\"]",
        "explanation": "Groups are \"aa\", \"bb\", and \"ccc\". Compressed to \"a2b2c3\"."
      },
      {
        "input": "chars = [\"a\"]",
        "output": "1, chars = [\"a\"]",
        "explanation": "Group length is 1, so character is not followed by count."
      },
      {
        "input": "chars = [\"a\",\"b\",\"b\",\"b\",\"b\",\"b\",\"b\",\"b\",\"b\",\"b\",\"b\",\"b\",\"b\"]",
        "output": "4, chars = [\"a\",\"b\",\"1\",\"2\"]",
        "explanation": "Group \"bbbbbbbbbbbb\" has length 12, split into digits \"1\" and \"2\"."
      }
    ],
    "keyEdgeCases": [
      "Single character array — length 1, no digits appended",
      "All identical characters with count >= 10 — count must be split into multiple digit characters",
      "No repeating characters (`[\"a\", \"b\", \"c\"]`) — returns original length, no numbers appended",
      "Long sequences up to 10^4 repeating items"
    ],
    "expectedComplexity": {
      "time": "O(n) linear scan",
      "space": "O(1) auxiliary space"
    },
    "standardApproachHints": [
      "Maintain a `write` index and a `read` index.",
      "Find length of identical characters `count = readEnd - readStart`.",
      "Write `chars[write++] = chars[readStart]`.",
      "If `count > 1`, convert `count` to string/digits and write each character to `chars[write++]`."
    ],
    "potentialDefects": [
      {
        "type": "multi_digit_char_overflow",
        "name": "Treating Multi-Digit Counts as Single Character",
        "description": "The AI attempts to cast count > 9 directly to char `(char)('0' + count)` instead of breaking it into separate digit characters '1', '2'.",
        "defectSnippet": "chars[write++] = (char)('0' + count); // Fails for count >= 10",
        "fixedSnippet": "string s = to_string(count);\nfor (char c : s) chars[write++] = c;",
        "explanation": "Counts >= 10 must be written as individual decimal digit characters."
      }
    ]
  },
  {
    "id": "capgemini-04-kadanes-algorithm",
    "title": "Maximum Subarray Sum (Kadane's Algorithm)",
    "company": "Capgemini",
    "category": "Arrays & Strings",
    "difficulty": "Medium",
    "tags": [
      "Dynamic Programming",
      "Prefix Sum",
      "Kadane",
      "LeetCode #53",
      "Q1 Analyst"
    ],
    "description": "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.\n\nAssessment focus:\n- Formulating the invariant: deciding whether to extend current subarray or start fresh from current element\n- Explaining why O(n) Kadane's algorithm is superior to O(n^2) nested loops\n- Handling negative numbers properly (when all numbers are negative)",
    "inputFormat": "An integer array `nums`.",
    "outputFormat": "A single integer denoting the maximum contiguous subarray sum.",
    "constraints": [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
      "Time complexity must be O(n)",
      "Space complexity must be O(1)"
    ],
    "examples": [
      {
        "input": "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        "output": "6",
        "explanation": "Subarray [4, -1, 2, 1] has the largest sum = 6."
      },
      {
        "input": "nums = [1]",
        "output": "1",
        "explanation": "Single element has max sum 1."
      },
      {
        "input": "nums = [-5, -2, -8, -1]",
        "output": "-1",
        "explanation": "All elements are negative. The maximum single element is -1."
      }
    ],
    "keyEdgeCases": [
      "All negative numbers (`[-3, -2, -5]`) — result must be the maximum single element (`-2`), NOT 0",
      "Single element array (`[5]` or `[-5]`)",
      "All positive numbers — sum of entire array",
      "Alternating positive and negative numbers with large spikes"
    ],
    "expectedComplexity": {
      "time": "O(n) single pass",
      "space": "O(1) space"
    },
    "standardApproachHints": [
      "Initialize `maxSoFar = nums[0]` and `currentMax = nums[0]`.",
      "Iterate `i` from 1 to n - 1: `currentMax = max(nums[i], currentMax + nums[i])`.",
      "Update `maxSoFar = max(maxSoFar, currentMax)`."
    ],
    "potentialDefects": [
      {
        "type": "zero_initialized_max",
        "name": "Max Sum Initialized to Zero",
        "description": "The AI initializes maxSoFar = 0. When all elements in nums are negative, it incorrectly returns 0 instead of the maximum negative element.",
        "defectSnippet": "int maxSoFar = 0, currentMax = 0;",
        "fixedSnippet": "int maxSoFar = nums[0], currentMax = nums[0];",
        "explanation": "For arrays containing all negative numbers, max subarray sum must be negative, not 0."
      }
    ]
  },
  {
    "id": "capgemini-05-product-except-self",
    "title": "Product of Array Except Self",
    "company": "Capgemini",
    "category": "Arrays & Strings",
    "difficulty": "Medium",
    "tags": [
      "Prefix Suffix",
      "Array",
      "LeetCode #238",
      "Analyst Star 5.75 LPA"
    ],
    "description": "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].\n\nYou must write an algorithm that runs in O(n) time and without using the division operation.\n\nAssessment focus:\n- Candidate must recognize why the division operator / is forbidden\n- Prefix and suffix cumulative product strategy\n- O(1) auxiliary space optimization (using output array for prefix and a running scalar for suffix)\n- Zero handling: arrays with zero, one zero, or multiple zeroes.",
    "inputFormat": "An integer array `nums`.",
    "outputFormat": "An integer array `answer` where `answer[i]` is product of all elements except `nums[i]`.",
    "constraints": [
      "2 <= nums.length <= 10^5",
      "-30 <= nums[i] <= 30",
      "Product of any prefix or suffix fits in a 32-bit integer",
      "Division operation is strictly forbidden"
    ],
    "examples": [
      {
        "input": "nums = [1, 2, 3, 4]",
        "output": "[24, 12, 8, 6]",
        "explanation": "Product except 1 is 24, except 2 is 12, except 3 is 8, except 4 is 6."
      },
      {
        "input": "nums = [-1, 1, 0, -3, 3]",
        "output": "[0, 0, 9, 0, 0]",
        "explanation": "Only the index with 0 receives a non-zero product."
      }
    ],
    "keyEdgeCases": [
      "Single zero in array — all positions become 0 except the zero position itself",
      "Two or more zeroes in array — all output elements must be 0",
      "Negative numbers with odd/even parity affecting sign",
      "Array of length 2"
    ],
    "expectedComplexity": {
      "time": "O(n) two passes",
      "space": "O(1) auxiliary space (output array does not count as extra space)"
    },
    "standardApproachHints": [
      "Pass 1: Build prefix products into `result[i] = result[i-1] * nums[i-1]`.",
      "Pass 2: Traverse backwards with running `suffixProduct = 1`, multiplying `result[i] *= suffixProduct`."
    ],
    "potentialDefects": [
      {
        "type": "illegal_division_used",
        "name": "Using Division Operation",
        "description": "The AI calculates total array product and divides by nums[i], violating the problem constraint and crashing with divide-by-zero when nums contains 0.",
        "defectSnippet": "int totalProd = 1;\nfor (int x : nums) totalProd *= x;\nfor (int i = 0; i < n; i++) ans[i] = totalProd / nums[i];",
        "fixedSnippet": "vector<int> ans(n, 1);\nfor (int i = 1; i < n; i++) ans[i] = ans[i-1] * nums[i-1];\nint suffix = 1;\nfor (int i = n - 1; i >= 0; i--) { ans[i] *= suffix; suffix *= nums[i]; }",
        "explanation": "Division is strictly prohibited and causes runtime crashes on zeroes."
      }
    ]
  },
  {
    "id": "capgemini-06-spiral-matrix",
    "title": "Spirally Traversing a Matrix",
    "company": "Capgemini",
    "category": "Arrays & Strings",
    "difficulty": "Medium",
    "tags": [
      "Matrix",
      "Simulation",
      "LeetCode #54",
      "Analyst Star 5.75 LPA"
    ],
    "description": "Given an `m x n` matrix, return all elements of the matrix in spiral order (clockwise order starting from top-left).\n\nAssessment requirements:\n- Formulating 4-boundary pointers: `top`, `bottom`, `left`, `right`\n- Guarding bottom and left traversal sweeps against boundary crossing in non-square matrices\n- Clean loop invariants without duplicate cell traversal",
    "inputFormat": "A 2D array of integers `matrix` with `m` rows and `n` columns.",
    "outputFormat": "A 1D array of integers in clockwise spiral traversal order.",
    "constraints": [
      "m == matrix.length",
      "n == matrix[i].length",
      "1 <= m, n <= 100",
      "-100 <= matrix[i][j] <= 100"
    ],
    "examples": [
      {
        "input": "matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]",
        "output": "[1, 2, 3, 6, 9, 8, 7, 4, 5]",
        "explanation": "Clockwise traversal from 1 -> 2 -> 3 -> 6 -> 9 -> 8 -> 7 -> 4 -> 5."
      },
      {
        "input": "matrix = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]",
        "output": "[1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]",
        "explanation": "3x4 rectangular matrix traversed spirally."
      }
    ],
    "keyEdgeCases": [
      "Single row matrix (`1 x n`) — must only traverse left to right once",
      "Single column matrix (`m x 1`) — must only traverse top to bottom once",
      "Single cell matrix (`1 x 1`)",
      "Rectangular non-square matrices where m != n"
    ],
    "expectedComplexity": {
      "time": "O(m * n) visiting each cell exactly once",
      "space": "O(1) auxiliary space"
    },
    "standardApproachHints": [
      "Define `top = 0, bottom = m - 1, left = 0, right = n - 1`.",
      "Traverse right along `top`, then increment `top`.",
      "Traverse down along `right`, then decrement `right`.",
      "If `top <= bottom`, traverse left along `bottom`, then decrement `bottom`.",
      "If `left <= right`, traverse up along `left`, then increment `left`."
    ],
    "potentialDefects": [
      {
        "type": "missing_boundary_check_bottom_sweep",
        "name": "Missing Boundary Guard in Return Sweeps",
        "description": "The AI fails to check if (top <= bottom) before traversing the bottom row, causing duplicate element traversal for single-row matrices.",
        "defectSnippet": "// Omitted check: if (top <= bottom)\nfor (int j = right; j >= left; j--) result.push_back(matrix[bottom][j]);\nbottom--;",
        "fixedSnippet": "if (top <= bottom) {\n  for (int j = right; j >= left; j--) result.push_back(matrix[bottom][j]);\n  bottom--;\n}",
        "explanation": "When top exceeds bottom, traversing bottom causes duplicate row visits."
      }
    ]
  },
  {
    "id": "capgemini-07-rotate-image",
    "title": "Rotate Image (90 Degrees Clockwise)",
    "company": "Capgemini",
    "category": "Arrays & Strings",
    "difficulty": "Medium",
    "tags": [
      "Matrix",
      "Math",
      "In-Place",
      "LeetCode #48",
      "Analyst Star 5.75 LPA"
    ],
    "description": "You are given an `n x n` 2D matrix representing an image. Rotate the image by 90 degrees (clockwise).\n\nYou have to rotate the image in-place, which means you have to modify the 2D input matrix directly. DO NOT allocate another 2D matrix.\n\nAssessment focus:\n- Explaining the composition: Transpose matrix + Reverse each row = 90-degree clockwise rotation\n- Maintaining in-place O(1) extra memory constraint\n- Matrix swap index bounds: ensuring upper triangle is swapped with lower triangle without double-swapping",
    "inputFormat": "An `n x n` 2D integer matrix.",
    "outputFormat": "Modify the matrix in-place.",
    "constraints": [
      "n == matrix.length == matrix[i].length",
      "1 <= n <= 200",
      "-1000 <= matrix[i][j] <= 1000",
      "Space complexity must be strictly O(1)"
    ],
    "examples": [
      {
        "input": "matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]",
        "output": "[[7, 4, 1], [8, 5, 2], [9, 6, 3]]",
        "explanation": "Rotated 90 degrees clockwise in-place."
      }
    ],
    "keyEdgeCases": [
      "1x1 matrix — remains identical",
      "2x2 matrix — minimal non-trivial rotation",
      "Matrix with negative numbers and zeroes"
    ],
    "expectedComplexity": {
      "time": "O(n^2) operations",
      "space": "O(1) auxiliary space"
    },
    "standardApproachHints": [
      "Step 1: Transpose matrix: swap `matrix[i][j]` with `matrix[j][i]` for `j > i`.",
      "Step 2: Reverse each row: reverse `matrix[i]` from column 0 to n - 1."
    ],
    "potentialDefects": [
      {
        "type": "transpose_double_swap",
        "name": "Double Swap In Transpose Loop",
        "description": "The AI runs inner loop `j` from 0 to n - 1 instead of starting from `i + 1`, swapping elements twice and reverting the matrix back to its original state.",
        "defectSnippet": "for (int i = 0; i < n; i++) {\n  for (int j = 0; j < n; j++) swap(matrix[i][j], matrix[j][i]);\n}",
        "fixedSnippet": "for (int i = 0; i < n; i++) {\n  for (int j = i + 1; j < n; j++) swap(matrix[i][j], matrix[j][i]);\n}",
        "explanation": "Looping j from 0 to n swaps elements twice, cancelling the transpose."
      }
    ]
  },
  {
    "id": "capgemini-08-longest-substring-no-repeat",
    "title": "Longest Substring Without Repeating Characters",
    "company": "Capgemini",
    "category": "Arrays & Strings",
    "difficulty": "Medium",
    "tags": [
      "Sliding Window",
      "Hash Map",
      "LeetCode #3",
      "Analyst Star 5.75 LPA"
    ],
    "description": "Given a string `s`, find the length of the longest substring without repeating characters.\n\nA substring is a contiguous sequence of characters within a string.\n\nAssessment focus:\n- Sliding window invariant with dynamic left pointer contraction\n- Selecting optimal lookup table (frequency map vs last seen index array)\n- Ensuring left pointer only moves forward and never jumps backward when encountering old seen characters",
    "inputFormat": "A single string `s`.",
    "outputFormat": "An integer representing the length of the longest unique substring.",
    "constraints": [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces",
      "Time complexity must be O(n)",
      "Space complexity must be O(min(m, n))"
    ],
    "examples": [
      {
        "input": "s = \"abcabcbb\"",
        "output": "3",
        "explanation": "The answer is \"abc\", with length 3."
      },
      {
        "input": "s = \"bbbbb\"",
        "output": "1",
        "explanation": "The answer is \"b\", with length 1."
      },
      {
        "input": "s = \"pwwkew\"",
        "output": "3",
        "explanation": "The answer is \"wke\", with length 3."
      }
    ],
    "keyEdgeCases": [
      "Empty string (`s = \"\"`) — must return 0",
      "String of all identical characters (`\"aaaa\"`) — returns 1",
      "String with all unique characters — returns s.length",
      "String with space and special characters (`\"a b c a\"`)"
    ],
    "expectedComplexity": {
      "time": "O(n) single pass with hash table / direct map",
      "space": "O(min(n, alphabet size)) space"
    },
    "standardApproachHints": [
      "Use `lastSeen` map to store the most recent index of each character.",
      "Iterate `right` from 0 to n - 1.",
      "If character was seen at or after `left`, update `left = lastSeen[c] + 1`.",
      "Update `maxLen = max(maxLen, right - left + 1)` and `lastSeen[c] = right`."
    ],
    "potentialDefects": [
      {
        "type": "left_pointer_backward_jump",
        "name": "Left Pointer Backward Jump on Old Duplicate",
        "description": "The AI sets left = lastSeen[c] + 1 unconditionally without checking max(left, lastSeen[c] + 1), causing the window to expand backward when a character outside the active window is encountered.",
        "defectSnippet": "if (lastSeen.count(c)) left = lastSeen[c] + 1;",
        "fixedSnippet": "if (lastSeen.count(c)) left = max(left, lastSeen[c] + 1);",
        "explanation": "Window left boundary must be monotonic and never move backwards."
      }
    ]
  },
  {
    "id": "capgemini-09-k-anagrams",
    "title": "Check for K-Anagrams",
    "company": "Capgemini",
    "category": "Arrays & Strings",
    "difficulty": "Easy",
    "tags": [
      "Hash Map",
      "Strings",
      "Character Frequency",
      "GeeksforGeeks",
      "Q1 Analyst"
    ],
    "description": "Two strings are called k-anagrams if both strings have the same number of characters and they can be made anagrams of each other by changing at most `k` characters in a string.\n\nGiven two strings `s1` and `s2` of lowercase letters and an integer `k`, return `true` if they are k-anagrams, or `false` otherwise.",
    "inputFormat": "Two strings `s1`, `s2` and an integer `k`.",
    "outputFormat": "Boolean `true` or `false`.",
    "constraints": [
      "1 <= s1.length, s2.length <= 10^5",
      "0 <= k <= 10^5",
      "s1 and s2 consist of lowercase English letters"
    ],
    "examples": [
      {
        "input": "s1 = \"fodr\", s2 = \"gork\", k = 2",
        "output": "true",
        "explanation": "Can change 'o' and 'd' in s1 to 'o' and 'k' to form anagram."
      },
      {
        "input": "s1 = \"geeks\", s2 = \"eggkf\", k = 1",
        "output": "false",
        "explanation": "Requires changing at least 2 characters."
      }
    ],
    "keyEdgeCases": [
      "s1 and s2 of unequal lengths — must immediately return false",
      "k = 0 — requires exact anagram (count == 0)",
      "Identical strings — always true for any k >= 0",
      "k larger than string length"
    ],
    "expectedComplexity": {
      "time": "O(n) time",
      "space": "O(1) space (26 lowercase English letters)"
    },
    "standardApproachHints": [
      "If `s1.length != s2.length`, return false.",
      "Count character frequencies of `s1` in an array of size 26.",
      "Subtract character frequencies seen in `s2`.",
      "Count total positive differences; if positive diffs <= k, return true."
    ],
    "potentialDefects": [
      {
        "type": "missing_length_check",
        "name": "Missing Length Equality Guard",
        "description": "The AI forgets to check if s1.length() == s2.length(), allowing strings of unequal sizes to falsely pass as k-anagrams.",
        "defectSnippet": "// Missing check: if (s1.length() != s2.length()) return false;",
        "fixedSnippet": "if (s1.length() != s2.length()) return false;",
        "explanation": "Strings of unequal lengths can never be k-anagrams."
      }
    ]
  },
  {
    "id": "capgemini-10-jump-game-ii",
    "title": "Minimum Jumps to Reach the End (Jump Game II)",
    "company": "Capgemini",
    "category": "Mathematics & Greedy",
    "difficulty": "Medium",
    "tags": [
      "Greedy",
      "BFS",
      "LeetCode #45",
      "Senior Analyst 7.5 - 11 LPA"
    ],
    "description": "You are given a 0-indexed array of integers `nums` of length `n`. You are initially positioned at `nums[0]`.\n\nEach element `nums[i]` represents the maximum length of a forward jump from index `i`. Return the minimum number of jumps to reach `nums[n - 1]`. You can assume that you can always reach the last index.\n\nAssessment focus:\n- BFS level-order interval greedy model\n- Tracking `farthest` reach and `currentEnd` interval boundaries\n- Ensuring jump count increments only upon hitting `currentEnd`, not on every index",
    "inputFormat": "An integer array `nums`.",
    "outputFormat": "Minimum integer number of jumps to reach index `n - 1`.",
    "constraints": [
      "1 <= nums.length <= 10^4",
      "0 <= nums[i] <= 1000",
      "It is guaranteed you can reach nums[n - 1]"
    ],
    "examples": [
      {
        "input": "nums = [2, 3, 1, 1, 4]",
        "output": "2",
        "explanation": "Jump 1 step from index 0 to 1, then 3 steps to the last index."
      },
      {
        "input": "nums = [2, 3, 0, 1, 4]",
        "output": "2",
        "explanation": "Minimum 2 jumps required."
      }
    ],
    "keyEdgeCases": [
      "Array of length 1 (`[0]`) — already at destination, 0 jumps needed",
      "First element covers entire array in 1 jump",
      "Zeroes in array that must be jumped over"
    ],
    "expectedComplexity": {
      "time": "O(n) greedy single pass",
      "space": "O(1) auxiliary space"
    },
    "standardApproachHints": [
      "Maintain `jumps = 0`, `currentEnd = 0`, `farthest = 0`.",
      "Iterate `i` from 0 to n - 2.",
      "Update `farthest = max(farthest, i + nums[i])`.",
      "When `i == currentEnd`, increment `jumps++` and update `currentEnd = farthest`."
    ],
    "potentialDefects": [
      {
        "type": "loop_includes_last_index",
        "name": "Loop Includes Last Index Triggering Superfluous Jump",
        "description": "The AI iterates up to i < n instead of i < n - 1, causing an extra unnecessary jump to be added when already at the final index.",
        "defectSnippet": "for (int i = 0; i < n; i++) { ... if (i == currentEnd) jumps++; }",
        "fixedSnippet": "for (int i = 0; i < n - 1; i++) { ... if (i == currentEnd) jumps++; }",
        "explanation": "Reaching the last element should not trigger another jump."
      }
    ]
  },
  {
    "id": "capgemini-11-stock-buy-sell",
    "title": "Best Time to Buy and Sell Stock (Single Transaction)",
    "company": "Capgemini",
    "category": "Mathematics & Greedy",
    "difficulty": "Easy",
    "tags": [
      "Array",
      "Greedy",
      "One-Pass",
      "LeetCode #121",
      "Q1 Analyst"
    ],
    "description": "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return `0`.",
    "inputFormat": "An array of positive integers `prices`.",
    "outputFormat": "A single integer denoting max profit.",
    "constraints": [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^4",
      "Time complexity must be O(n)",
      "Space complexity must be O(1)"
    ],
    "examples": [
      {
        "input": "prices = [7, 1, 5, 3, 6, 4]",
        "output": "5",
        "explanation": "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5."
      },
      {
        "input": "prices = [7, 6, 4, 3, 1]",
        "output": "0",
        "explanation": "Prices continuously decrease, no profitable transaction possible. Return 0."
      }
    ],
    "keyEdgeCases": [
      "Prices continuously decreasing — return 0",
      "Prices identical every day — return 0",
      "Single day price array — return 0",
      "Peak price appears before lowest price"
    ],
    "expectedComplexity": {
      "time": "O(n) single pass",
      "space": "O(1) space"
    },
    "standardApproachHints": [
      "Track `minPrice = prices[0]` and `maxProfit = 0`.",
      "For each price, update `minPrice = min(minPrice, price)`.",
      "Update `maxProfit = max(maxProfit, price - minPrice)`."
    ],
    "potentialDefects": [
      {
        "type": "allow_negative_profit",
        "name": "Max Profit Initialized to INT_MIN Allowing Losses",
        "description": "The AI initializes maxProfit to INT_MIN instead of 0, returning a negative number on continuously dropping stock prices instead of 0.",
        "defectSnippet": "int maxProfit = INT_MIN;",
        "fixedSnippet": "int maxProfit = 0;",
        "explanation": "If no profit can be made, the candidate can choose not to buy, yielding 0 profit."
      }
    ]
  },
  {
    "id": "capgemini-12-stock-buy-sell-ii",
    "title": "Best Time to Buy and Sell Stock II (Multiple Deals)",
    "company": "Capgemini",
    "category": "Mathematics & Greedy",
    "difficulty": "Medium",
    "tags": [
      "Greedy",
      "Valley-Peak",
      "LeetCode #122",
      "Analyst Star 5.75 LPA"
    ],
    "description": "You are given an integer array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\nOn each day, you may decide to buy and/or sell the stock. You can only hold at most one share of the stock at any time. However, you can buy it then immediately sell it on the same day.\n\nFind and return the maximum profit you can achieve.",
    "inputFormat": "An array of integers `prices`.",
    "outputFormat": "A single integer denoting total cumulative profit.",
    "constraints": [
      "1 <= prices.length <= 3 * 10^4",
      "0 <= prices[i] <= 10^4"
    ],
    "examples": [
      {
        "input": "prices = [7, 1, 5, 3, 6, 4]",
        "output": "7",
        "explanation": "Buy on day 2 (1) and sell on day 3 (5), profit = 4. Buy on day 4 (3) and sell on day 5 (6), profit = 3. Total = 7."
      },
      {
        "input": "prices = [1, 2, 3, 4, 5]",
        "output": "4",
        "explanation": "Buy on day 1 (1) and sell on day 5 (5), profit = 4."
      }
    ],
    "keyEdgeCases": [
      "Monotonically decreasing prices — profit 0",
      "Monotonically increasing prices — profit is last price minus first price",
      "Single day — profit 0"
    ],
    "expectedComplexity": {
      "time": "O(n) single pass",
      "space": "O(1) space"
    },
    "standardApproachHints": [
      "Whenever `prices[i] > prices[i - 1]`, greedily add `prices[i] - prices[i - 1]` to total profit."
    ],
    "potentialDefects": [
      {
        "type": "complex_state_overkill",
        "name": "DP Table Space Overhead",
        "description": "The AI allocates an unnecessary O(n) DP matrix when a single greedy loop accumulating positive adjacent differences achieves O(1) space.",
        "defectSnippet": "vector<vector<int>> dp(n, vector<int>(2, 0));",
        "fixedSnippet": "int profit = 0;\nfor (int i = 1; i < n; i++) if (prices[i] > prices[i-1]) profit += prices[i] - prices[i-1];",
        "explanation": "Greedy adjacent difference accumulation is mathematically optimal and uses O(1) space."
      }
    ]
  },
  {
    "id": "capgemini-13-container-most-water",
    "title": "Container With Most Water",
    "company": "Capgemini",
    "category": "Mathematics & Greedy",
    "difficulty": "Medium",
    "tags": [
      "Two Pointers",
      "Greedy",
      "LeetCode #11",
      "Analyst Star 5.75 LPA"
    ],
    "description": "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.\n\nNotice that you may not slant the container.",
    "inputFormat": "An integer array `height`.",
    "outputFormat": "A single integer denoting maximum water volume.",
    "constraints": [
      "n == height.length",
      "2 <= n <= 10^5",
      "0 <= height[i] <= 10^4",
      "Time complexity must be O(n)",
      "Space complexity must be O(1)"
    ],
    "examples": [
      {
        "input": "height = [1, 8, 6, 2, 5, 4, 8, 3, 7]",
        "output": "49",
        "explanation": "Lines at index 1 (height 8) and index 8 (height 7) span width 7, min height 7 -> 7 * 7 = 49."
      },
      {
        "input": "height = [1, 1]",
        "output": "1",
        "explanation": "Width 1, height 1 -> 1."
      }
    ],
    "keyEdgeCases": [
      "All heights identical (`[5, 5, 5, 5]`) — max area is outermost lines",
      "Two elements array",
      "Array with zeroes",
      "Tall lines very close together vs shorter lines far apart"
    ],
    "expectedComplexity": {
      "time": "O(n) two-pointer contraction",
      "space": "O(1) space"
    },
    "standardApproachHints": [
      "Start with `left = 0` and `right = n - 1`.",
      "Area is `(right - left) * min(height[left], height[right])`.",
      "Move the pointer pointing to the shorter vertical line inward."
    ],
    "potentialDefects": [
      {
        "type": "move_taller_pointer",
        "name": "Moving Taller Pointer Inward",
        "description": "The AI moves the pointer with greater height instead of the shorter height, eliminating the possibility of finding a wider container with greater bottleneck height.",
        "defectSnippet": "if (height[left] > height[right]) left++; else right--;",
        "fixedSnippet": "if (height[left] < height[right]) left++; else right--;",
        "explanation": "The bottleneck is the shorter line; only advancing the shorter pointer can increase area."
      }
    ]
  },
  {
    "id": "capgemini-14-modular-exponentiation",
    "title": "Modular Exponentiation (Pow(x, n) mod M)",
    "company": "Capgemini",
    "category": "Mathematics & Greedy",
    "difficulty": "Medium",
    "tags": [
      "Math",
      "Recursion",
      "Binary Exponentiation",
      "LeetCode #50",
      "Q1 Analyst"
    ],
    "description": "Implement modular exponentiation to compute `(x^n) % m` in `O(log n)` time.\n\nYour solution must handle large exponents, negative exponents, and prevent integer overflow throughout multiplication steps.",
    "inputFormat": "Floating point or integer `x`, integer `n`, integer `m` (or standard `pow(x, n)`).",
    "outputFormat": "Result of power computation.",
    "constraints": [
      "-100.0 < x < 100.0",
      "-2^31 <= n <= 2^31 - 1",
      "Must run in O(log |n|) time"
    ],
    "examples": [
      {
        "input": "x = 2.00000, n = 10",
        "output": "1024.00000",
        "explanation": "2^10 = 1024."
      },
      {
        "input": "x = 2.10000, n = 3",
        "output": "9.26100",
        "explanation": "2.1^3 = 9.261."
      },
      {
        "input": "x = 2.00000, n = -2",
        "output": "0.25000",
        "explanation": "2^-2 = 1/(2^2) = 1/4 = 0.25."
      }
    ],
    "keyEdgeCases": [
      "n = 0 — returns 1.0",
      "n = -2^31 — integer negation overflow if using standard 32-bit int (-n overflows)",
      "x = 1 or x = -1 with large odd/even powers",
      "x = 0 with positive power"
    ],
    "expectedComplexity": {
      "time": "O(log n) binary exponentiation",
      "space": "O(1) iterative"
    },
    "standardApproachHints": [
      "Convert `n` to 64-bit integer `long long exp = n`.",
      "If `exp < 0`, invert `x = 1.0 / x` and `exp = -exp`.",
      "While `exp > 0`: if `exp % 2 == 1`, multiply `ans *= x`; then `x *= x`, `exp /= 2`."
    ],
    "potentialDefects": [
      {
        "type": "int32_negation_overflow",
        "name": "32-Bit Signed Integer Underflow on INT_MIN",
        "description": "When n = -2147483648, executing `n = -n` causes signed 32-bit integer overflow.",
        "defectSnippet": "int exp = n;\nif (exp < 0) { x = 1 / x; exp = -exp; }",
        "fixedSnippet": "long long exp = n;\nif (exp < 0) { x = 1.0 / x; exp = -exp; }",
        "explanation": "Converting INT_MIN to positive requires at least a 64-bit signed integer."
      }
    ]
  },
  {
    "id": "capgemini-15-two-sum",
    "title": "Two Sum (Target Pair)",
    "company": "Capgemini",
    "category": "Mathematics & Greedy",
    "difficulty": "Easy",
    "tags": [
      "Hash Table",
      "Array",
      "LeetCode #1",
      "Q1 Analyst"
    ],
    "description": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. Return the answer in any order.",
    "inputFormat": "An integer array `nums` and an integer `target`.",
    "outputFormat": "An array of two indices `[i, j]`.",
    "constraints": [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists"
    ],
    "examples": [
      {
        "input": "nums = [2, 7, 11, 15], target = 9",
        "output": "[0, 1]",
        "explanation": "nums[0] + nums[1] == 9, return [0, 1]."
      },
      {
        "input": "nums = [3, 2, 4], target = 6",
        "output": "[1, 2]",
        "explanation": "nums[1] + nums[2] == 6."
      }
    ],
    "keyEdgeCases": [
      "Two identical numbers that add up to target (`[3, 3]`, target 6)",
      "Negative numbers in array (`[-1, -2, -3, -4, -5]`, target -8)",
      "Target is 0"
    ],
    "expectedComplexity": {
      "time": "O(n) single pass hash map",
      "space": "O(n) space"
    },
    "standardApproachHints": [
      "Use hash map mapping `val -> index`.",
      "For each `nums[i]`, compute `complement = target - nums[i]`.",
      "If `complement` exists in map, return `[map[complement], i]`.",
      "Otherwise, record `map[nums[i]] = i`."
    ],
    "potentialDefects": [
      {
        "type": "same_element_reuse",
        "name": "Reusing Same Element Twice",
        "description": "The AI pre-populates the entire map and allows an element to pair with itself when complement == nums[i].",
        "defectSnippet": "for (int i = 0; i < n; i++) map[nums[i]] = i;\nfor (int i = 0; i < n; i++) if (map.count(target - nums[i])) return {i, map[target - nums[i]]};",
        "fixedSnippet": "unordered_map<int, int> map;\nfor (int i = 0; i < n; i++) {\n  int comp = target - nums[i];\n  if (map.count(comp)) return {map[comp], i};\n  map[nums[i]] = i;\n}",
        "explanation": "One-pass map insertion ensures an element is never matched with itself."
      }
    ]
  },
  {
    "id": "capgemini-16-k-diff-pairs",
    "title": "Pairs with Difference K (K-diff Pairs in an Array)",
    "company": "Capgemini",
    "category": "Mathematics & Greedy",
    "difficulty": "Medium",
    "tags": [
      "Hash Map",
      "Counting",
      "LeetCode #532",
      "Q1 Analyst"
    ],
    "description": "Given an array of integers `nums` and an integer `k`, return the number of unique k-diff pairs in the array.\n\nA k-diff pair is an integer pair `(nums[i], nums[j])` where:\n- `0 <= i, j < nums.length` and `i != j`\n- `|nums[i] - nums[j]| == k`\n\nNotice that `|val|` denotes the absolute value of `val`.",
    "inputFormat": "An integer array `nums` and an integer `k`.",
    "outputFormat": "Number of unique k-diff pairs.",
    "constraints": [
      "1 <= nums.length <= 10^4",
      "-10^7 <= nums[i] <= 10^7",
      "0 <= k <= 10^7"
    ],
    "examples": [
      {
        "input": "nums = [3, 1, 4, 1, 5], k = 2",
        "output": "2",
        "explanation": "Two 2-diff pairs: (1, 3) and (3, 5)."
      },
      {
        "input": "nums = [1, 2, 3, 4, 5], k = 1",
        "output": "4",
        "explanation": "Four 1-diff pairs: (1, 2), (2, 3), (3, 4), and (4, 5)."
      },
      {
        "input": "nums = [1, 3, 1, 5, 4], k = 0",
        "output": "1",
        "explanation": "Only (1, 1) has difference 0."
      }
    ],
    "keyEdgeCases": [
      "k = 0 — requires duplicate values (frequency >= 2)",
      "k < 0 — mathematically impossible for absolute difference, returns 0",
      "Arrays with many repeated elements"
    ],
    "expectedComplexity": {
      "time": "O(n) hash map scan",
      "space": "O(n) auxiliary space"
    },
    "standardApproachHints": [
      "Build frequency map of each number in `nums`.",
      "If `k == 0`, count keys with `frequency >= 2`.",
      "If `k > 0`, count keys `x` where `x + k` exists in map."
    ],
    "potentialDefects": [
      {
        "type": "k_zero_mishandled",
        "name": "Mishandling k = 0 Difference",
        "description": "The AI checks map.count(x + 0) which always evaluates to true, incorrectly returning total unique elements instead of checking count >= 2.",
        "defectSnippet": "for (auto& [x, _] : freq) if (freq.count(x + k)) count++;",
        "fixedSnippet": "for (auto& [x, cnt] : freq) {\n  if (k == 0) { if (cnt >= 2) count++; }\n  else { if (freq.count(x + k)) count++; }\n}",
        "explanation": "When k = 0, a number must appear at least twice to form a distinct pair."
      }
    ]
  },
  {
    "id": "capgemini-17-detect-remove-loop-linked-list",
    "title": "Detect and Remove Loop in Linked List",
    "company": "Capgemini",
    "category": "Stacks & Linked Lists",
    "difficulty": "Medium",
    "tags": [
      "Linked List",
      "Floyd Cycle",
      "Two Pointers",
      "LeetCode #142",
      "Analyst Star 5.75 LPA"
    ],
    "description": "Given the head of a linked list, determine if the linked list has a cycle in it. If a cycle is present, find the node where the cycle begins, and break the cycle by setting the next pointer of the last node in the cycle to null.\n\nReturn the head of the modified linked list without any cycle.",
    "inputFormat": "Head of a singly linked list.",
    "outputFormat": "Head of the list with cycle removed.",
    "constraints": [
      "0 <= number of nodes <= 10^5",
      "-10^5 <= Node.val <= 10^5",
      "Must run in O(n) time and O(1) auxiliary space"
    ],
    "examples": [
      {
        "input": "head = [3, 2, 0, -4], cycle at index 1",
        "output": "[3, 2, 0, -4] with next pointer of -4 set to null",
        "explanation": "Cycle detected at node 2 and removed."
      }
    ],
    "keyEdgeCases": [
      "No cycle exists in list — return list untouched",
      "Cycle begins at head node itself (`head->next = head`)",
      "Single node with no cycle",
      "Empty list (`head == null`)"
    ],
    "expectedComplexity": {
      "time": "O(n) time",
      "space": "O(1) auxiliary space"
    },
    "standardApproachHints": [
      "Use slow and fast pointers to detect cycle.",
      "If they meet, reset slow to head. Advance slow and fast at speed 1 until they meet at cycle entry.",
      "Find predecessor of cycle entry and set `prev->next = nullptr`."
    ],
    "potentialDefects": [
      {
        "type": "cycle_at_head_crash",
        "name": "Infinite Loop When Cycle Starts At Head",
        "description": "When the cycle begins at head, finding the predecessor node fails if the search condition does not account for slow == head.",
        "defectSnippet": "while (fast->next != slow) fast = fast->next;\nfast->next = NULL;",
        "fixedSnippet": "if (slow == head) {\n  while (fast->next != slow) fast = fast->next;\n  fast->next = NULL;\n} else {\n  while (slow->next != fast->next) { slow = slow->next; fast = fast->next; }\n  fast->next = NULL;\n}",
        "explanation": "When cycle loops back to head, standard entry pointer matching requires dedicated predecessor advance."
      }
    ]
  },
  {
    "id": "capgemini-18-reverse-k-group",
    "title": "Reverse Linked List in Groups of Size K",
    "company": "Capgemini",
    "category": "Stacks & Linked Lists",
    "difficulty": "Hard",
    "tags": [
      "Linked List",
      "Recursion",
      "Pointer Manipulation",
      "LeetCode #25",
      "Senior Analyst 7.5 - 11 LPA"
    ],
    "description": "Given the `head` of a linked list, reverse the nodes of the list `k` at a time, and return the modified list.\n\n`k` is a positive integer and is less than or equal to the length of the linked list. If the number of nodes is not a multiple of `k` then left-out nodes, in the end, should remain as it is.\n\nYou may not alter the values in the list's nodes, only nodes themselves may be changed.",
    "inputFormat": "Head of singly linked list and integer `k`.",
    "outputFormat": "Head of modified linked list.",
    "constraints": [
      "1 <= k <= sz <= 5000",
      "0 <= Node.val <= 1000",
      "Space complexity O(1)"
    ],
    "examples": [
      {
        "input": "head = [1, 2, 3, 4, 5], k = 2",
        "output": "[2, 1, 4, 3, 5]",
        "explanation": "Groups of 2 reversed. Node 5 remains as is."
      },
      {
        "input": "head = [1, 2, 3, 4, 5], k = 3",
        "output": "[3, 2, 1, 4, 5]",
        "explanation": "First 3 nodes reversed. Nodes 4 and 5 remain as is."
      }
    ],
    "keyEdgeCases": [
      "k = 1 — no change to list",
      "k == length of list — entire list reversed",
      "Number of nodes not divisible by k — remaining tail must NOT be reversed"
    ],
    "expectedComplexity": {
      "time": "O(n) time",
      "space": "O(1) space"
    },
    "standardApproachHints": [
      "Check if at least `k` nodes remain ahead.",
      "Reverse the `k` nodes.",
      "Recursively or iteratively connect reversed sublist to next group."
    ],
    "potentialDefects": [
      {
        "type": "reversing_incomplete_tail",
        "name": "Reversing Incomplete Tail Sublist",
        "description": "The AI reverses the final group even when it contains fewer than k nodes, violating the requirement that leftover nodes remain untouched.",
        "defectSnippet": "// Reverses whatever is left without checking if count >= k",
        "fixedSnippet": "ListNode* curr = head;\nfor (int i = 0; i < k; i++) {\n  if (!curr) return head; // Fewer than k nodes, leave as is\n  curr = curr->next;\n}",
        "explanation": "Leftover tail with fewer than k nodes must remain in original order."
      }
    ]
  },
  {
    "id": "capgemini-19-next-greater-element",
    "title": "Next Greater Element (NGE)",
    "company": "Capgemini",
    "category": "Stacks & Linked Lists",
    "difficulty": "Medium",
    "tags": [
      "Monotonic Stack",
      "Array",
      "LeetCode #496",
      "Analyst Star 5.75 LPA"
    ],
    "description": "Given an array `nums`, find the Next Greater Element for every element. The Next Greater Element for an element `x` is the first greater element on the right side of `x` in the array.\n\nIf no greater element exists to the right, consider the next greater element as `-1`. Must run in linear time `O(n)`.",
    "inputFormat": "An integer array `nums`.",
    "outputFormat": "An array of same length containing next greater elements.",
    "constraints": [
      "1 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9",
      "Time complexity must be O(n)"
    ],
    "examples": [
      {
        "input": "nums = [4, 5, 2, 25]",
        "output": "[5, 25, 25, -1]",
        "explanation": "Next greater for 4 is 5, for 5 is 25, for 2 is 25, for 25 is -1."
      },
      {
        "input": "nums = [13, 7, 6, 12]",
        "output": "[-1, 12, 12, -1]",
        "explanation": "Computed in O(n) using a monotonic stack."
      }
    ],
    "keyEdgeCases": [
      "Decreasing array (`[5, 4, 3, 2, 1]`) — all outputs -1",
      "Increasing array (`[1, 2, 3, 4, 5]`) — each element's next is immediately next element",
      "Array with duplicates"
    ],
    "expectedComplexity": {
      "time": "O(n) time using monotonic stack",
      "space": "O(n) auxiliary stack space"
    },
    "standardApproachHints": [
      "Traverse from right to left.",
      "Pop elements from stack while `stack.top() <= nums[i]`.",
      "If stack is empty, answer is -1, else `stack.top()`.",
      "Push `nums[i]` onto stack."
    ],
    "potentialDefects": [
      {
        "type": "non_strict_greater",
        "name": "Using Strictly Less Than In Stack Eviction",
        "description": "The AI uses stack.top() < nums[i] instead of <=, failing when duplicate elements exist and returning equal value instead of strictly greater.",
        "defectSnippet": "while (!st.empty() && st.top() < nums[i]) st.pop();",
        "fixedSnippet": "while (!st.empty() && st.top() <= nums[i]) st.pop();",
        "explanation": "Next greater element must be strictly greater than current element."
      }
    ]
  },
  {
    "id": "capgemini-20-valid-parentheses",
    "title": "Valid / Balanced Parentheses",
    "company": "Capgemini",
    "category": "Stacks & Linked Lists",
    "difficulty": "Easy",
    "tags": [
      "Stack",
      "Strings",
      "LeetCode #20",
      "Q1 Analyst"
    ],
    "description": "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    "inputFormat": "A single string `s` of bracket characters.",
    "outputFormat": "Boolean `true` or `false`.",
    "constraints": [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only: '()[]{}'"
    ],
    "examples": [
      {
        "input": "s = \"()[]{}\"",
        "output": "true",
        "explanation": "All brackets matched correctly."
      },
      {
        "input": "s = \"(]\"",
        "output": "false",
        "explanation": "Mismatched bracket types."
      }
    ],
    "keyEdgeCases": [
      "Closing bracket with empty stack (`\"]\"`) — must safely return false without stack underflow crash",
      "Unclosed opening bracket (`\"(\"`) — returns false at end (`!stack.empty()`)",
      "Odd length string — can never be valid, return false early"
    ],
    "expectedComplexity": {
      "time": "O(n) time",
      "space": "O(n) stack space"
    },
    "standardApproachHints": [
      "If `s.length % 2 != 0`, return false.",
      "Push opening brackets onto stack.",
      "On closing bracket, verify `!stack.empty()` and matching top; then pop.",
      "Return `stack.empty()`."
    ],
    "potentialDefects": [
      {
        "type": "stack_underflow_unguarded",
        "name": "Unchecked Pop on Closing Bracket",
        "description": "The AI directly accesses st.top() without verifying st.empty(), causing undefined behavior or segmentation fault on strings starting with closing brackets.",
        "defectSnippet": "if (c == ')') { if (st.top() == '(') st.pop(); else return false; }",
        "fixedSnippet": "if (c == ')') { if (st.empty() || st.top() != '(') return false; st.pop(); }",
        "explanation": "stack.top() must be guarded with !stack.empty() to prevent runtime crashes."
      }
    ]
  },
  {
    "id": "capgemini-21-middle-linked-list",
    "title": "Middle of the Linked List",
    "company": "Capgemini",
    "category": "Stacks & Linked Lists",
    "difficulty": "Easy",
    "tags": [
      "Linked List",
      "Two Pointers",
      "Fast & Slow",
      "LeetCode #876",
      "Q1 Analyst"
    ],
    "description": "Given the `head` of a singly linked list, return the middle node of the linked list.\n\nIf there are two middle nodes, return the second middle node in a single pass.",
    "inputFormat": "Head of singly linked list.",
    "outputFormat": "Middle ListNode.",
    "constraints": [
      "1 <= number of nodes <= 100",
      "1 <= Node.val <= 100",
      "Time complexity O(n), single pass",
      "Space complexity O(1)"
    ],
    "examples": [
      {
        "input": "head = [1, 2, 3, 4, 5]",
        "output": "Node 3",
        "explanation": "Odd length list has unique middle node 3."
      },
      {
        "input": "head = [1, 2, 3, 4, 5, 6]",
        "output": "Node 4",
        "explanation": "Even length list has middle nodes 3 and 4; return second middle (4)."
      }
    ],
    "keyEdgeCases": [
      "Single node list — returns head",
      "Two node list — returns second node",
      "Even length list vs odd length list"
    ],
    "expectedComplexity": {
      "time": "O(n) single pass",
      "space": "O(1) space"
    },
    "standardApproachHints": [
      "Initialize `slow = head` and `fast = head`.",
      "While `fast != null && fast.next != null`: advance `slow = slow.next`, `fast = fast.next.next`.",
      "Return `slow`."
    ],
    "potentialDefects": [
      {
        "type": "returns_first_middle_on_even",
        "name": "Returns First Middle on Even-Length Lists",
        "description": "The AI checks fast.next.next != null, stopping slow prematurely and returning node 3 instead of 4 on a 6-node list.",
        "defectSnippet": "while (fast && fast->next && fast->next->next) { slow = slow->next; fast = fast->next->next; }",
        "fixedSnippet": "while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }",
        "explanation": "Condition fast && fast->next guarantees slow reaches the second middle node on even lengths."
      }
    ]
  },
  {
    "id": "capgemini-22-knapsack-01",
    "title": "0/1 Knapsack Problem",
    "company": "Capgemini",
    "category": "Dynamic Programming & Trees",
    "difficulty": "Medium",
    "tags": [
      "DP",
      "0/1 Knapsack",
      "Optimization",
      "GeeksforGeeks",
      "Senior Analyst 7.5 - 11 LPA"
    ],
    "description": "You are given weights and values of `n` items, and put these items in a knapsack of capacity `W` to get the maximum total value in the knapsack.\n\nEach item can only be selected at most once (0 or 1 choice). Return maximum total value.",
    "inputFormat": "Capacity `W`, array `wt` of weights, array `val` of values, and integer `n`.",
    "outputFormat": "Maximum integer profit achievable.",
    "constraints": [
      "1 <= n <= 1000",
      "1 <= W <= 1000",
      "1 <= wt[i] <= 1000",
      "1 <= val[i] <= 1000"
    ],
    "examples": [
      {
        "input": "W = 4, wt = [4, 5, 1], val = [1, 2, 3], n = 3",
        "output": "3",
        "explanation": "Pick item 3 (wt 1, val 3), total value 3."
      }
    ],
    "keyEdgeCases": [
      "Capacity W = 0 — profit 0",
      "All items heavier than W — profit 0",
      "Single item fits exactly W"
    ],
    "expectedComplexity": {
      "time": "O(n * W) pseudo-polynomial",
      "space": "O(W) using 1D DP array"
    },
    "standardApproachHints": [
      "Use 1D array `dp[w]` of size `W + 1` initialized to 0.",
      "For each item `i`: loop `w` from `W` down to `wt[i]`.",
      "`dp[w] = max(dp[w], dp[w - wt[i]] + val[i])`."
    ],
    "potentialDefects": [
      {
        "type": "forward_iteration_unbounded_bug",
        "name": "Forward Loop Iteration Turns 0/1 Into Unbounded Knapsack",
        "description": "The AI iterates w from wt[i] up to W forwards in a 1D DP array, allowing the same item to be reused multiple times.",
        "defectSnippet": "for (int w = wt[i]; w <= W; w++) dp[w] = max(dp[w], dp[w - wt[i]] + val[i]);",
        "fixedSnippet": "for (int w = W; w >= wt[i]; w--) dp[w] = max(dp[w], dp[w - wt[i]] + val[i]);",
        "explanation": "For 0/1 knapsack in 1D array, capacity w must decrease backwards to prevent duplicate reuse."
      }
    ]
  },
  {
    "id": "capgemini-23-subset-sum-partition",
    "title": "Subset Sum Problem (Partition Equal Subset Sum)",
    "company": "Capgemini",
    "category": "Dynamic Programming & Trees",
    "difficulty": "Medium",
    "tags": [
      "DP",
      "Subset Sum",
      "LeetCode #416",
      "Senior Analyst 7.5 - 11 LPA"
    ],
    "description": "Given an integer array `nums`, return `true` if you can partition the array into two subsets such that the sum of the elements in both subsets is equal or `false` otherwise.",
    "inputFormat": "An integer array `nums`.",
    "outputFormat": "Boolean `true` or `false`.",
    "constraints": [
      "1 <= nums.length <= 200",
      "1 <= nums[i] <= 100"
    ],
    "examples": [
      {
        "input": "nums = [1, 5, 11, 5]",
        "output": "true",
        "explanation": "Subsets [1, 5, 5] and [11] both sum to 11."
      },
      {
        "input": "nums = [1, 2, 3, 5]",
        "output": "false",
        "explanation": "Sum is 11 (odd), cannot be divided equally."
      }
    ],
    "keyEdgeCases": [
      "Total sum is odd — return false immediately",
      "Single element array — return false",
      "Max element exceeds half of total sum — return false"
    ],
    "expectedComplexity": {
      "time": "O(n * target) where target = sum / 2",
      "space": "O(target) 1D boolean array"
    },
    "standardApproachHints": [
      "Compute `totalSum = sum(nums)`. If `totalSum % 2 != 0`, return false.",
      "`target = totalSum / 2`. `dp[0] = true`.",
      "Iterate `num` in `nums`: for `j` from `target` down to `num`: `dp[j] = dp[j] || dp[j - num]`."
    ],
    "potentialDefects": [
      {
        "type": "omitted_odd_sum_check",
        "name": "Omitted Odd Total Sum Check",
        "description": "The AI divides sum by 2 using integer division without checking if sum % 2 != 0, leading to false positives on odd sum arrays.",
        "defectSnippet": "int target = sum / 2; // Missed: if (sum % 2 != 0) return false;",
        "fixedSnippet": "if (sum % 2 != 0) return false;\nint target = sum / 2;",
        "explanation": "Odd sums cannot be partitioned into two equal integer halves."
      }
    ]
  },
  {
    "id": "capgemini-24-coin-change",
    "title": "Coin Change (Minimum Coins to Make Amount)",
    "company": "Capgemini",
    "category": "Dynamic Programming & Trees",
    "difficulty": "Medium",
    "tags": [
      "DP",
      "Knapsack",
      "LeetCode #322",
      "Senior Analyst 7.5 - 11 LPA"
    ],
    "description": "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.\n\nYou may assume that you have an infinite number of each kind of coin.",
    "inputFormat": "An integer array `coins` and integer `amount`.",
    "outputFormat": "Fewest number of coins or -1.",
    "constraints": [
      "1 <= coins.length <= 12",
      "1 <= coins[i] <= 2^31 - 1",
      "0 <= amount <= 10^4"
    ],
    "examples": [
      {
        "input": "coins = [1, 2, 5], amount = 11",
        "output": "3",
        "explanation": "11 = 5 + 5 + 1 (3 coins)."
      },
      {
        "input": "coins = [2], amount = 3",
        "output": "-1",
        "explanation": "Amount 3 cannot be formed using only coins of 2."
      },
      {
        "input": "coins = [1], amount = 0",
        "output": "0",
        "explanation": "Amount 0 requires 0 coins."
      }
    ],
    "keyEdgeCases": [
      "Amount = 0 — return 0",
      "No valid combination exists — return -1",
      "Coin denomination greater than amount"
    ],
    "expectedComplexity": {
      "time": "O(amount * coins.length)",
      "space": "O(amount) space"
    },
    "standardApproachHints": [
      "Initialize `dp` table of size `amount + 1` with `amount + 1`.",
      "`dp[0] = 0`.",
      "For `i` from 1 to `amount`: for `coin` in `coins`: if `i >= coin`, `dp[i] = min(dp[i], dp[i - coin] + 1)`.",
      "Return `dp[amount] > amount ? -1 : dp[amount]`."
    ],
    "potentialDefects": [
      {
        "type": "int_overflow_on_infinity",
        "name": "Integer Overflow on INT_MAX Initialization",
        "description": "The AI initializes dp array with INT_MAX, then does `1 + dp[i - coin]`, triggering signed integer overflow.",
        "defectSnippet": "vector<int> dp(amount + 1, INT_MAX);\n... dp[i] = min(dp[i], 1 + dp[i - coin]);",
        "fixedSnippet": "vector<int> dp(amount + 1, amount + 1);\ndp[0] = 0;\nfor (int i = 1; i <= amount; i++) {\n  for (int c : coins) if (i >= c) dp[i] = min(dp[i], 1 + dp[i - c]);\n}",
        "explanation": "Use amount + 1 as sentinel infinity to avoid 32-bit addition overflow."
      }
    ]
  },
  {
    "id": "capgemini-25-longest-common-subsequence",
    "title": "Longest Common Subsequence (LCS)",
    "company": "Capgemini",
    "category": "Dynamic Programming & Trees",
    "difficulty": "Medium",
    "tags": [
      "DP",
      "Strings",
      "Matrix",
      "LeetCode #1143",
      "Senior Analyst 7.5 - 11 LPA"
    ],
    "description": "Given two strings `text1` and `text2`, return the length of their longest common subsequence. If there is no common subsequence, return `0`.\n\nA subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.",
    "inputFormat": "Two strings `text1` and `text2`.",
    "outputFormat": "Length of LCS.",
    "constraints": [
      "1 <= text1.length, text2.length <= 1000",
      "text1 and text2 consist of only lowercase English characters"
    ],
    "examples": [
      {
        "input": "text1 = \"abcde\", text2 = \"ace\"",
        "output": "3",
        "explanation": "The longest common subsequence is \"ace\" and its length is 3."
      }
    ],
    "keyEdgeCases": [
      "No characters in common — return 0",
      "Identical strings — return length of string",
      "One string is a full subsequence of the other"
    ],
    "expectedComplexity": {
      "time": "O(m * n) 2D DP",
      "space": "O(min(m, n)) rolling row space optimization"
    },
    "standardApproachHints": [
      "If `text1[i-1] == text2[j-1]`, `dp[i][j] = 1 + dp[i-1][j-1]`.",
      "Else `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`."
    ],
    "potentialDefects": [
      {
        "type": "substring_reset_confusion",
        "name": "Confusing Subsequence With Contiguous Substring",
        "description": "The AI resets dp[i][j] = 0 on character mismatch instead of taking max(dp[i-1][j], dp[i][j-1]), computing longest common substring instead of subsequence.",
        "defectSnippet": "if (text1[i-1] == text2[j-1]) dp[i][j] = 1 + dp[i-1][j-1]; else dp[i][j] = 0;",
        "fixedSnippet": "if (text1[i-1] == text2[j-1]) dp[i][j] = 1 + dp[i-1][j-1]; else dp[i][j] = max(dp[i-1][j], dp[i][j-1]);",
        "explanation": "Subsequence characters do not need to be contiguous."
      }
    ]
  },
  {
    "id": "capgemini-26-longest-increasing-subsequence",
    "title": "Longest Increasing Subsequence (LIS)",
    "company": "Capgemini",
    "category": "Dynamic Programming & Trees",
    "difficulty": "Medium",
    "tags": [
      "DP",
      "Binary Search",
      "Patience Sort",
      "LeetCode #300",
      "Senior Analyst 7.5 - 11 LPA"
    ],
    "description": "Given an integer array `nums`, return the length of the longest strictly increasing subsequence.\n\nMust be implemented with optimal `O(n log n)` time complexity using patience sorting / binary search.",
    "inputFormat": "An integer array `nums`.",
    "outputFormat": "A single integer representing the maximum length of LIS.",
    "constraints": [
      "1 <= nums.length <= 2500",
      "-10^4 <= nums[i] <= 10^4",
      "Must achieve O(n log n) time complexity"
    ],
    "examples": [
      {
        "input": "nums = [10, 9, 2, 5, 3, 7, 101, 18]",
        "output": "4",
        "explanation": "The longest increasing subsequence is [2, 3, 7, 101], therefore the length is 4."
      },
      {
        "input": "nums = [0, 1, 0, 3, 2, 3]",
        "output": "4",
        "explanation": "LIS is [0, 1, 2, 3]."
      }
    ],
    "keyEdgeCases": [
      "Array with all identical elements (`[7, 7, 7, 7]`) — strictly increasing LIS has length 1",
      "Already strictly decreasing array — returns 1",
      "Single element array — returns 1"
    ],
    "expectedComplexity": {
      "time": "O(n log n) using binary search (lower_bound)",
      "space": "O(n) auxiliary array"
    },
    "standardApproachHints": [
      "Maintain active tails array `tails`.",
      "For each `x` in `nums`: find first element `>= x` using `lower_bound`.",
      "If not found, append `x` to `tails`; else overwrite that position.",
      "Length of `tails` is the answer."
    ],
    "potentialDefects": [
      {
        "type": "upper_bound_allows_non_strict",
        "name": "Using upper_bound Instead of lower_bound",
        "description": "The AI uses std::upper_bound, allowing duplicate equal elements to be included, resulting in non-decreasing instead of strictly increasing subsequence.",
        "defectSnippet": "auto it = upper_bound(tails.begin(), tails.end(), x);",
        "fixedSnippet": "auto it = lower_bound(tails.begin(), tails.end(), x);",
        "explanation": "Strictly increasing requires replacing at the first position >= x (lower_bound)."
      }
    ]
  },
  {
    "id": "capgemini-27-count-bst-nodes-range",
    "title": "Count BST Nodes in Given Range",
    "company": "Capgemini",
    "category": "Dynamic Programming & Trees",
    "difficulty": "Medium",
    "tags": [
      "BST",
      "Tree Traversal",
      "Range Query",
      "LeetCode #938",
      "Senior Analyst 7.5 - 11 LPA"
    ],
    "description": "Given the root node of a binary search tree and two integers `low` and `high`, return the sum (or count) of values of all nodes with a value in the inclusive range `[low, high]`.\n\nYour approach must take advantage of the Binary Search Tree properties to prune subtrees that cannot contain valid values.",
    "inputFormat": "Root of BST and integers `low` and `high`.",
    "outputFormat": "Sum or count of valid nodes.",
    "constraints": [
      "The number of nodes in the tree is in the range [1, 2 * 10^4]",
      "1 <= Node.val <= 10^5",
      "1 <= low <= high <= 10^5",
      "All Node.val are unique"
    ],
    "examples": [
      {
        "input": "root = [10, 5, 15, 3, 7, null, 18], low = 7, high = 15",
        "output": "32",
        "explanation": "Nodes 7, 10, and 15 are in range [7, 15]. Sum = 7 + 10 + 15 = 32."
      }
    ],
    "keyEdgeCases": [
      "All nodes smaller than low — tree pruned immediately",
      "All nodes larger than high — tree pruned immediately",
      "Single node matching range"
    ],
    "expectedComplexity": {
      "time": "O(k + h) where k is matching nodes and h is tree height",
      "space": "O(h) recursion stack"
    },
    "standardApproachHints": [
      "If node == null, return 0.",
      "If `node->val < low`: only explore `node->right`.",
      "If `node->val > high`: only explore `node->left`.",
      "Otherwise, include `node->val` and recurse both children."
    ],
    "potentialDefects": [
      {
        "type": "unpruned_full_tree_traversal",
        "name": "Unpruned Full Tree Traversal",
        "description": "The AI traverses both left and right subtrees unconditionally regardless of BST order, degrading complexity to O(n) instead of O(h + k).",
        "defectSnippet": "return (val >= low && val <= high ? val : 0) + rangeSum(root->left) + rangeSum(root->right);",
        "fixedSnippet": "if (root->val < low) return rangeSum(root->right, low, high);\nif (root->val > high) return rangeSum(root->left, low, high);\nreturn root->val + rangeSum(root->left, low, high) + rangeSum(root->right, low, high);",
        "explanation": "BST property must be used to prune entire left/right subtrees."
      }
    ]
  },
  {
    "id": "capgemini-28-left-view-binary-tree",
    "title": "Left View of Binary Tree",
    "company": "Capgemini",
    "category": "Dynamic Programming & Trees",
    "difficulty": "Easy",
    "tags": [
      "Binary Tree",
      "BFS",
      "Queue",
      "GeeksforGeeks",
      "Senior Analyst 7.5 - 11 LPA"
    ],
    "description": "Given a Binary Tree, print the Left view of it. The Left view of a Binary Tree is a set of nodes visible when the tree is looked at from the left side.\n\nReturn an array containing the nodes in the left view from top to bottom.",
    "inputFormat": "Root of binary tree.",
    "outputFormat": "Array of integers in left view order.",
    "constraints": [
      "0 <= Number of nodes <= 10^5",
      "0 <= Node.val <= 10^5"
    ],
    "examples": [
      {
        "input": "root = [1, 2, 3, 4, 5, 6, 7]",
        "output": "[1, 2, 4]",
        "explanation": "First node visible at each level is 1, 2, 4."
      },
      {
        "input": "root = [1, null, 2, null, 3]",
        "output": "[1, 2, 3]",
        "explanation": "All nodes visible on right-skewed tree."
      }
    ],
    "keyEdgeCases": [
      "Empty tree — return empty list",
      "Right-skewed tree — all nodes visible",
      "Left-skewed tree — all nodes visible"
    ],
    "expectedComplexity": {
      "time": "O(n) BFS level order",
      "space": "O(w) maximum level width"
    },
    "standardApproachHints": [
      "Perform BFS level order traversal with queue.",
      "For each level, record the very first node `i == 0` into the left view list."
    ],
    "potentialDefects": [
      {
        "type": "right_view_node_selected",
        "name": "Selecting Last Node of Level (Right View)",
        "description": "The AI picks `i == levelSize - 1` instead of `i == 0`, generating the Right View instead of Left View.",
        "defectSnippet": "for (int i = 0; i < sz; i++) { ... if (i == sz - 1) result.push_back(curr->val); }",
        "fixedSnippet": "for (int i = 0; i < sz; i++) { ... if (i == 0) result.push_back(curr->val); }",
        "explanation": "Left view requires the first node (i == 0) of every level."
      }
    ]
  },
  {
    "id": "capgemini-29-zigzag-level-order",
    "title": "Binary Tree Spiral / Zigzag Level Order Traversal",
    "company": "Capgemini",
    "category": "Dynamic Programming & Trees",
    "difficulty": "Medium",
    "tags": [
      "BFS",
      "Tree",
      "Deque",
      "LeetCode #103",
      "Senior Analyst 7.5 - 11 LPA"
    ],
    "description": "Given the `root` of a binary tree, return the zigzag level order traversal of its nodes' values. (i.e., from left to right, then right to left for the next level and alternate between).",
    "inputFormat": "Root of binary tree.",
    "outputFormat": "2D array of integers in zigzag level order.",
    "constraints": [
      "0 <= Number of nodes <= 2000",
      "-1000 <= Node.val <= 1000"
    ],
    "examples": [
      {
        "input": "root = [3, 9, 20, null, null, 15, 7]",
        "output": "[[3], [20, 9], [15, 7]]",
        "explanation": "Level 1: [3] (L->R), Level 2: [20, 9] (R->L), Level 3: [15, 7] (L->R)."
      }
    ],
    "keyEdgeCases": [
      "Empty tree — return empty array",
      "Single node tree — return [[val]]",
      "Tree with missing children alternating sides"
    ],
    "expectedComplexity": {
      "time": "O(n) BFS",
      "space": "O(n) queue and result storage"
    },
    "standardApproachHints": [
      "Use standard BFS queue.",
      "Maintain a boolean `leftToRight = true`.",
      "Store level values into array of size `sz`: if `leftToRight`, put at `i`; else put at `sz - 1 - i`.",
      "Toggle `leftToRight = !leftToRight` after each level."
    ],
    "potentialDefects": [
      {
        "type": "queue_push_order_reversed",
        "name": "Reversing Child Insertion Order in Queue",
        "description": "The AI attempts to alternate push order of children into the queue, disrupting the tree structure for subsequent levels instead of keeping BFS queue FIFO and reversing only level output values.",
        "defectSnippet": "if (zigzag) { q.push(node->right); q.push(node->left); } else { q.push(node->left); q.push(node->right); }",
        "fixedSnippet": "int idx = leftToRight ? i : (sz - 1 - i);\nlevel[idx] = node->val;\nif (node->left) q.push(node->left);\nif (node->right) q.push(node->right);",
        "explanation": "Queue children push order must stay left then right; only output index placement should alternate."
      }
    ]
  }
]

export function getProblemById(id: string): AssessmentProblem | undefined {
  return CAPGEMINI_PROBLEMS.find((p) => p.id === id)
}

export function getRandomProblem(): AssessmentProblem {
  const index = Math.floor(Math.random() * CAPGEMINI_PROBLEMS.length)
  return CAPGEMINI_PROBLEMS[index]
}
