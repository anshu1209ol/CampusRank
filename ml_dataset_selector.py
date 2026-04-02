import pandas as pd
import json
import argparse
import sys
import math
from collections import Counter

def load_dataset(file_path):
    print(f"Loading dataset from {file_path}...")
    try:
        if file_path.endswith('.ipynb'):
            # Parse Jupyter Notebook markdown cells into a mock DataFrame of questions
            with open(file_path, 'r', encoding='utf-8') as f:
                notebook = json.load(f)
            
            questions = []
            for cell in notebook.get('cells', []):
                if cell.get('cell_type') == 'markdown':
                    source = ''.join(cell.get('source', []))
                    # Simple heuristic: use the first line or a generic title
                    lines = [line.strip() for line in source.split('\n') if line.strip()]
                    if not lines:
                        continue
                    title = lines[0][:100]  # Take first line as title snippet
                    description = "\n".join(lines[1:]) if len(lines) > 1 else lines[0]
                    questions.append({
                        'title': title.replace('#', '').strip() or 'Notebook Task',
                        'description': description,
                        'difficulty': 'Medium' # default
                    })
            
            if not questions:
                 print("Could not find any markdown questions in the notebook.", file=sys.stderr)
                 return None
                 
            return pd.DataFrame(questions)
            
        else:
            # Default CSV behavior
            df = pd.read_csv(file_path).dropna()
            return df
            
    except Exception as e:
        print(f"Error loading {file_path}: {e}", file=sys.stderr)
        return None

def basic_tokenize(text):
    text = text.lower()
    words = ''.join(c if c.isalnum() else ' ' for c in text).split()
    return words

def compute_similarity(query, text):
    query_words = basic_tokenize(query)
    text_words = basic_tokenize(text)
    
    inter = set(query_words).intersection(set(text_words))
    return len(inter) / (len(set(query_words)) + 1e-9)

def find_best_questions(df, query_preference, top_k=5):
    print(f"Searching ML model for: '{query_preference}'...")
    
    # Combine search context
    df['search_context'] = df['title'] + " " + df['description'] + " " + df.get('difficulty', '')
    
    similarities = map(lambda text: compute_similarity(query_preference, text), df['search_context'])
    df['sim'] = list(similarities)
    
    best_df = df.sort_values(by='sim', ascending=False).head(top_k)
    
    questions = []
    for _, row in best_df.iterrows():
        # Construct CampusRank JSON formatted object
        q_obj = {
            "type": "coding",
            "question": f"{row['title']} ({row.get('difficulty', 'Unknown')})\n\n{row['description']}",
            "language": "python", # default selection mapped, frontend handles the rest
            "placeholder": f"def solve():\n    # Implement {row['title']}\n    pass",
        }
        questions.append(q_obj)
        
    return questions

import os

if __name__ == "__main__":
    # Ensure current working directory is scripts's directory so it finds the CSV
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    parser = argparse.ArgumentParser(description="ML Selector for Coding Datasets")
    parser.add_argument('--dataset', type=str, default="leetcode_problem.csv", help="Path to the LeetCode CSV dataset")
    parser.add_argument('--query', type=str, required=True, help="Teacher or Student natural language preference (e.g. 'Easy array questions')")
    parser.add_argument('--count', type=int, default=3, help="Number of questions to return")
    
    if len(sys.argv) == 1:
        query = input("Enter your natural language preference (e.g. 'Easy array questions'): ")
        sys.argv.extend(['--query', query])
        
    args = parser.parse_args()
    
    df = load_dataset(args.dataset)
    if df is not None:
        results = find_best_questions(df, args.query, top_k=args.count)
        print("\n--- ML GENERATED QUESTIONS LOG ---")
        print(json.dumps(results, indent=2))
        print("----------------------------------")
        
    # Prevent window from closing immediately when run via double-click
    input("\nPress Enter to exit...")