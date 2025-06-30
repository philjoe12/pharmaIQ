import json
import re
from bs4 import BeautifulSoup
from typing import Dict, List, Any, Set
import pandas as pd
from collections import defaultdict

class FDALabelAnalyzer:
    """Analyzes FDA drug label JSON files to understand structure and content"""
    
    def __init__(self):
        self.field_stats = defaultdict(lambda: {
            'count': 0,
            'sample_values': [],
            'html_tags': set(),
            'max_length': 0,
            'has_tables': False,
            'has_lists': False,
            'section_codes': set()
        })
        
    def analyze_json_file(self, file_path: str) -> Dict[str, Any]:
        """Analyze a single JSON file or array of drug labels"""
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Handle both single object and array
        drugs = data if isinstance(data, list) else [data]
        
        print(f"Analyzing {len(drugs)} drug(s) from {file_path}")
        
        for drug in drugs:
            self._analyze_drug(drug)
        
        return self._generate_report()
    
    def _analyze_drug(self, drug: Dict[str, Any], prefix: str = ''):
        """Recursively analyze drug data structure"""
        for key, value in drug.items():
            field_key = f"{prefix}{key}" if prefix else key
            
            if isinstance(value, dict):
                # Nested object - recurse
                self._analyze_drug(value, f"{field_key}.")
            elif isinstance(value, list):
                # Array field
                self.field_stats[field_key]['count'] += 1
                self.field_stats[field_key]['sample_values'].append(f"[Array with {len(value)} items]")
                # Analyze first item if exists
                if value and isinstance(value[0], dict):
                    self._analyze_drug(value[0], f"{field_key}[0].")
            elif isinstance(value, str):
                # String field - check if HTML
                self.field_stats[field_key]['count'] += 1
                self.field_stats[field_key]['max_length'] = max(
                    self.field_stats[field_key]['max_length'], 
                    len(value)
                )
                
                if self._is_html(value):
                    self._analyze_html_content(field_key, value)
                else:
                    # Regular string - store sample
                    if len(self.field_stats[field_key]['sample_values']) < 3:
                        sample = value[:100] + "..." if len(value) > 100 else value
                        self.field_stats[field_key]['sample_values'].append(sample)
            else:
                # Other types (numbers, booleans, etc.)
                self.field_stats[field_key]['count'] += 1
                if len(self.field_stats[field_key]['sample_values']) < 3:
                    self.field_stats[field_key]['sample_values'].append(str(value))
    
    def _is_html(self, text: str) -> bool:
        """Check if string contains HTML"""
        return bool(re.search(r'<[^>]+>', text))
    
    def _analyze_html_content(self, field_key: str, html: str):
        """Analyze HTML content for structure and elements"""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Store a text preview
        text_content = soup.get_text(strip=True)[:200]
        if len(self.field_stats[field_key]['sample_values']) < 1:
            self.field_stats[field_key]['sample_values'].append(f"[HTML] {text_content}...")
        
        # Collect HTML tags used
        for tag in soup.find_all():
            self.field_stats[field_key]['html_tags'].add(tag.name)
        
        # Check for tables
        if soup.find('table'):
            self.field_stats[field_key]['has_tables'] = True
        
        # Check for lists
        if soup.find(['ul', 'ol']):
            self.field_stats[field_key]['has_lists'] = True
        
        # Extract section codes
        sections = soup.find_all(attrs={'data-sectioncode': True})
        for section in sections:
            self.field_stats[field_key]['section_codes'].add(section.get('data-sectioncode'))
    
    def _generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive analysis report"""
        report = {
            'total_fields': len(self.field_stats),
            'field_analysis': {},
            'html_fields': [],
            'key_sections': [],
            'data_structure': self._build_structure_tree()
        }
        
        for field, stats in self.field_stats.items():
            # Convert sets to lists for JSON serialization
            field_info = {
                'occurrences': stats['count'],
                'max_length': stats['max_length'],
                'samples': stats['sample_values'][:3],  # Limit samples
                'is_html': bool(stats['html_tags']),
                'html_tags': list(stats['html_tags']) if stats['html_tags'] else [],
                'has_tables': stats['has_tables'],
                'has_lists': stats['has_lists'],
                'section_codes': list(stats['section_codes']) if stats['section_codes'] else []
            }
            
            report['field_analysis'][field] = field_info
            
            # Track HTML fields
            if field_info['is_html']:
                report['html_fields'].append(field)
            
            # Identify key medical sections
            if any(keyword in field.lower() for keyword in 
                   ['indication', 'dosage', 'warning', 'adverse', 'clinical']):
                report['key_sections'].append(field)
        
        return report
    
    def _build_structure_tree(self) -> Dict[str, Any]:
        """Build a tree representation of the data structure"""
        tree = {}
        for field in self.field_stats.keys():
            parts = field.split('.')
            current = tree
            for part in parts[:-1]:
                if part not in current:
                    current[part] = {}
                current = current[part]
            
            # Add field info at leaf
            leaf_name = parts[-1]
            current[leaf_name] = {
                'type': 'html' if self.field_stats[field]['html_tags'] else 'text',
                'occurrences': self.field_stats[field]['count']
            }
        
        return tree
    
    def print_summary(self, report: Dict[str, Any]):
        """Print a human-readable summary of the analysis"""
        print("\n" + "="*80)
        print("FDA LABEL JSON STRUCTURE ANALYSIS")
        print("="*80)
        
        print(f"\nTotal unique fields found: {report['total_fields']}")
        
        print("\n📊 DATA STRUCTURE:")
        self._print_tree(report['data_structure'])
        
        print("\n📝 KEY MEDICAL SECTIONS:")
        for section in report['key_sections']:
            field_info = report['field_analysis'][section]
            print(f"\n  • {section}")
            print(f"    - Type: {'HTML' if field_info['is_html'] else 'Text'}")
            print(f"    - Max length: {field_info['max_length']:,} chars")
            if field_info['has_tables']:
                print(f"    - Contains tables: Yes")
            if field_info['has_lists']:
                print(f"    - Contains lists: Yes")
        
        print("\n🔧 HTML CONTENT ANALYSIS:")
        html_fields = [f for f, info in report['field_analysis'].items() if info['is_html']]
        for field in html_fields[:5]:  # Show first 5
            info = report['field_analysis'][field]
            print(f"\n  • {field}")
            print(f"    - HTML tags: {', '.join(info['html_tags'][:10])}")
            if info['section_codes']:
                print(f"    - Section codes: {', '.join(info['section_codes'][:5])}")
        
        print("\n💡 INSIGHTS FOR PROCESSING:")
        print("  • The data contains both structured fields and HTML content")
        print("  • HTML sections will need parsing to extract clean text")
        print("  • Tables in adverse reactions will need special handling")
        print("  • Section codes can help identify content types")
        print("  • Consider extracting and structuring:")
        print("    - Drug identifiers (name, generic name, NDC)")
        print("    - Key sections as separate fields")
        print("    - Lists and tables as structured data")
    
    def _print_tree(self, tree: Dict[str, Any], indent: int = 2):
        """Pretty print the structure tree"""
        for key, value in tree.items():
            if isinstance(value, dict) and 'type' in value:
                # Leaf node
                print(f"{' '*indent}├── {key} ({value['type']})")
            else:
                # Branch node
                print(f"{' '*indent}├── {key}/")
                if isinstance(value, dict):
                    self._print_tree(value, indent + 4)
    
    def export_field_summary(self, report: Dict[str, Any], output_file: str = 'fda_label_fields.csv'):
        """Export field analysis to CSV for easy reference"""
        rows = []
        for field, info in report['field_analysis'].items():
            rows.append({
                'field_path': field,
                'is_html': info['is_html'],
                'max_length': info['max_length'],
                'has_tables': info['has_tables'],
                'has_lists': info['has_lists'],
                'html_tags': ', '.join(info['html_tags'][:10]) if info['html_tags'] else '',
                'sample': info['samples'][0] if info['samples'] else ''
            })
        
        df = pd.DataFrame(rows)
        df.to_csv(output_file, index=False)
        print(f"\n📄 Field summary exported to: {output_file}")


# Example usage
if __name__ == "__main__":
    # Analyze the FDA label JSON
    analyzer = FDALabelAnalyzer()
    
    # Replace with your actual file path
    report = analyzer.analyze_json_file('labels.json')
    
    # Print human-readable summary
    analyzer.print_summary(report)
    
    # Export detailed field analysis
    analyzer.export_field_summary(report)
    
    # Save full report as JSON
    with open('fda_label_analysis_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    print("\n📊 Full analysis report saved to: fda_label_analysis_report.json")