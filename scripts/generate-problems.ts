import fs from 'fs';

const difficulties = ["Easy", "Medium", "Hard"];
const tagsPool = ["Array", "String", "DP", "Graph", "Tree", "Math", "Greedy"];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateProblem(index) {
  return {
    title: `Problem ${index}: Algorithmic Forge`,
    difficulty: getRandom(difficulties),
    tags: [getRandom(tagsPool), getRandom(tagsPool)],

    description: `### Challenge ${index}\nImplement a high-performance solution for objective #${index}. Optimize for both time and space complexity in this specific sandbox environment.`,
    input_format: "Standard input stream containing test vector.",
    output_format: "Standard output with computed hash results.",
    constraints: "1 <= n <= 10^5, Memory Limit: 256MB",

    sample_input: "5",
    sample_output: "25",

    test_cases: [
      { input: "5", output: "25" },
      { input: "3", output: "9" },
      { input: "10", output: "100" }
    ],

    solution_code: {
      python: "import sys\nfor line in sys.stdin:\n    n = int(line.strip())\n    print(n*n)",
      java: "// solution",
      cpp: "// solution"
    }
  };
}

const problems = [];

// Adding the real ones we had before first
const existing = [
  {
    "title": "Two Sum",
    "difficulty": "Easy",
    "tags": ["Array", "HashMap"],
    "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    "input_format": "nums array and target integer",
    "output_format": "indices of two numbers",
    "constraints": "2 <= nums.length <= 10^5",
    "sample_input": "2 7 11 15\n9",
    "sample_output": "0 1",
    "test_cases": [
      { "input": "2 7 11 15\n9", "output": "0 1" },
      { "input": "3 2 4\n6", "output": "1 2" },
      { "input": "3 3\n6", "output": "0 1" }
    ],
    "solution_code": {
      "python": "def twoSum(nums, target):\n d={}\n for i,n in enumerate(nums):\n  if target-n in d: return [d[target-n],i]\n  d[n]=i",
      "java": "// hashmap solution",
      "cpp": "// unordered_map solution"
    }
  },
  {
    "title": "Palindrome String",
    "difficulty": "Easy",
    "tags": ["String"],
    "description": "Check if a string is palindrome.",
    "input_format": "string s",
    "output_format": "true or false",
    "constraints": "1 <= s.length <= 10^5",
    "sample_input": "madam",
    "sample_output": "true",
    "test_cases": [
      { "input": "madam", "output": "true" },
      { "input": "hello", "output": "false" }
    ],
    "solution_code": {
      "python": "print(s==s[::-1])",
      "java": "// reverse check",
      "cpp": "// reverse string"
    }
  }
];

problems.push(...existing);

for (let i = 1; i <= 998; i++) {
  problems.push(generateProblem(i));
}

// Ensure the directory exists if we use path, but here it's root
fs.writeFileSync("problems.json", JSON.stringify(problems, null, 2));

console.log("✅ 1000 problems generated for SkillForge!");
