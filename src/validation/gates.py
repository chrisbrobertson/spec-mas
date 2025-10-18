"""
Spec-MAS v2.0 - Defense in Depth Validation Gates
Progressive validation system with increasing rigor at each level
"""

import yaml
import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
import re


class ValidationLevel(Enum):
    SYNTAX = 1
    SEMANTIC = 2
    COVERAGE = 3
    CROSS_REFERENCE = 4


@dataclass
class ValidationResult:
    passed: bool
    level: ValidationLevel
    errors: List[str]
    warnings: List[str]
    suggestions: List[str]
    ready_for_adversarial: bool = False


@dataclass
class Finding:
    level: ValidationLevel
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    message: str
    location: Optional[str] = None
    suggestion: Optional[str] = None


class DefenseInDepthValidator:
    """Progressive validation with increasing rigor"""
    
    def __init__(self, spec_path: str):
        self.spec_path = Path(spec_path)
        self.spec = self._load_spec()
        self.findings: List[Finding] = []
        self.current_level = ValidationLevel.SYNTAX
        
    def _load_spec(self) -> Dict:
        """Load spec from YAML or Markdown"""
        with open(self.spec_path, 'r') as f:
            if self.spec_path.suffix == '.yaml':
                return yaml.safe_load(f)
            else:
                # Parse markdown to structured format
                return self._parse_markdown(f.read())
    
    def _parse_markdown(self, content: str) -> Dict:
        """Parse markdown spec into structured format"""
        spec = {
            'user_stories': [],
            'functional_requirements': [],
            'non_functional_requirements': [],
            'acceptance_criteria': []
        }
        
        current_section = None
        for line in content.split('\n'):
            if line.startswith('## User Stories'):
                current_section = 'user_stories'
            elif line.startswith('## Functional Requirements'):
                current_section = 'functional_requirements'
            elif line.startswith('## Non-Functional Requirements'):
                current_section = 'non_functional_requirements'
            elif line.startswith('## Acceptance Criteria'):
                current_section = 'acceptance_criteria'
            elif current_section and line.strip().startswith('-'):
                spec[current_section].append(line.strip()[1:].strip())
        
        return spec
    
    # LEVEL 1: SYNTAX VALIDATION
    def validate_level_1_syntax(self) -> ValidationResult:
        """Basic structural validation"""
        errors = []
        warnings = []
        
        # Check required sections
        required_sections = ['user_stories', 'functional_requirements', 'acceptance_criteria']
        for section in required_sections:
            if section not in self.spec or not self.spec[section]:
                errors.append(f"Missing required section: {section}")
        
        # Validate requirement IDs
        if 'functional_requirements' in self.spec:
            for i, req in enumerate(self.spec['functional_requirements']):
                if isinstance(req, str) and not req.startswith('FR-'):
                    warnings.append(f"Requirement {i+1} should have ID format 'FR-X'")
        
        # Check for empty sections
        for key, value in self.spec.items():
            if isinstance(value, list) and len(value) == 0:
                warnings.append(f"Empty section: {key}")
        
        # Validate YAML structure if applicable
        if self.spec_path.suffix == '.yaml':
            if 'apiVersion' not in self.spec:
                warnings.append("Missing apiVersion field")
            if 'metadata' not in self.spec:
                warnings.append("Missing metadata section")
        
        passed = len(errors) == 0
        return ValidationResult(
            passed=passed,
            level=ValidationLevel.SYNTAX,
            errors=errors,
            warnings=warnings,
            suggestions=["Consider using the formal YAML template for better structure"] if warnings else [],
            ready_for_adversarial=False
        )
    
    # LEVEL 2: SEMANTIC VALIDATION
    def validate_level_2_semantic(self) -> ValidationResult:
        """Semantic consistency and completeness"""
        errors = []
        warnings = []
        suggestions = []
        
        # Check if all requirements are traceable to user stories
        if 'user_stories' in self.spec and 'functional_requirements' in self.spec:
            story_keywords = self._extract_keywords(self.spec['user_stories'])
            for req in self.spec['functional_requirements']:
                req_text = req if isinstance(req, str) else str(req)
                if not any(keyword in req_text.lower() for keyword in story_keywords):
                    warnings.append(f"Requirement '{req_text[:50]}...' may not trace to user stories")
        
        # Check for conflicting requirements
        requirements = self.spec.get('functional_requirements', [])
        for i, req1 in enumerate(requirements):
            for j, req2 in enumerate(requirements[i+1:], i+1):
                if self._requirements_conflict(req1, req2):
                    errors.append(f"Potential conflict between requirements {i+1} and {j+1}")
        
        # Check for undefined terms
        technical_terms = self._find_technical_terms()
        defined_terms = self.spec.get('definitions', {})
        for term in technical_terms:
            if term not in defined_terms:
                warnings.append(f"Technical term '{term}' is not defined")
                suggestions.append(f"Add definition for '{term}' in definitions section")
        
        # Security requirements for sensitive operations
        sensitive_keywords = ['payment', 'password', 'auth', 'credit', 'personal', 'private']
        has_sensitive = any(
            keyword in str(self.spec).lower() 
            for keyword in sensitive_keywords
        )
        
        if has_sensitive and 'security_requirements' not in self.spec:
            errors.append("Spec involves sensitive operations but lacks security requirements")
            suggestions.append("Add security_requirements section with authentication, authorization, and encryption details")
        
        passed = len(errors) == 0
        return ValidationResult(
            passed=passed,
            level=ValidationLevel.SEMANTIC,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions,
            ready_for_adversarial=False
        )
    
    # LEVEL 3: COVERAGE VALIDATION
    def validate_level_3_coverage(self) -> ValidationResult:
        """Comprehensive coverage analysis"""
        errors = []
        warnings = []
        suggestions = []
        
        # Check all user paths specified
        user_stories = self.spec.get('user_stories', [])
        acceptance_criteria = self.spec.get('acceptance_criteria', [])
        
        for story in user_stories:
            story_text = story if isinstance(story, str) else str(story)
            if not any(story_text.lower() in str(criteria).lower() for criteria in acceptance_criteria):
                warnings.append(f"User story may lack acceptance criteria: {story_text[:50]}...")
        
        # Check error conditions defined
        error_keywords = ['error', 'fail', 'invalid', 'exception', 'timeout']
        has_error_handling = any(
            keyword in str(self.spec).lower() 
            for keyword in error_keywords
        )
        
        if not has_error_handling:
            errors.append("No error conditions or failure scenarios defined")
            suggestions.append("Add error handling requirements for each major operation")
        
        # Check performance bounds
        if 'non_functional_requirements' in self.spec:
            nfrs = str(self.spec['non_functional_requirements']).lower()
            if 'performance' not in nfrs and 'response time' not in nfrs and 'latency' not in nfrs:
                warnings.append("No performance requirements specified")
                suggestions.append("Add performance bounds (response time, throughput, etc.)")
        
        # Check resource limits
        resource_keywords = ['memory', 'cpu', 'disk', 'bandwidth', 'connection']
        has_resource_limits = any(
            keyword in str(self.spec).lower() 
            for keyword in resource_keywords
        )
        
        if not has_resource_limits:
            warnings.append("No resource limits specified")
            suggestions.append("Define resource constraints and limits")
        
        # Check rollback procedures for complex specs
        if self._is_complex_spec() and 'rollback' not in str(self.spec).lower():
            errors.append("Complex spec lacks rollback procedures")
            suggestions.append("Add rollback and recovery procedures")
        
        passed = len(errors) == 0
        return ValidationResult(
            passed=passed,
            level=ValidationLevel.COVERAGE,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions,
            ready_for_adversarial=False
        )
    
    # LEVEL 4: CROSS-REFERENCE VALIDATION
    def validate_level_4_cross_reference(self) -> ValidationResult:
        """System-wide consistency"""
        errors = []
        warnings = []
        suggestions = []
        
        # Check for conflicts with existing specs
        existing_specs = self._load_existing_specs()
        conflicts = self._check_spec_conflicts(existing_specs)
        for conflict in conflicts:
            errors.append(f"Conflict with {conflict['spec']}: {conflict['issue']}")
        
        # Check interfaces properly defined
        if 'interfaces' in self.spec or 'api' in str(self.spec).lower():
            if 'api_contracts' not in self.spec and 'interface_definitions' not in self.spec:
                errors.append("Spec mentions interfaces/APIs but lacks proper definitions")
                suggestions.append("Add api_contracts or interface_definitions section")
        
        # Check dependencies explicitly stated
        if 'dependencies' not in self.spec:
            warnings.append("No explicit dependencies stated")
            suggestions.append("Add dependencies section listing all external systems and libraries")
        
        # Check backwards compatibility
        if self._is_update_to_existing():
            if 'backwards_compatibility' not in self.spec and 'breaking_changes' not in self.spec:
                errors.append("Update to existing system lacks backwards compatibility analysis")
                suggestions.append("Add backwards_compatibility section or explicitly list breaking_changes")
        
        passed = len(errors) == 0
        return ValidationResult(
            passed=passed,
            level=ValidationLevel.CROSS_REFERENCE,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions,
            ready_for_adversarial=passed  # Ready if all gates passed
        )
    
    # MAIN VALIDATION RUNNER
    def run_progressive_validation(self) -> Dict[ValidationLevel, ValidationResult]:
        """Run all validation gates progressively"""
        results = {}
        
        validators = [
            (ValidationLevel.SYNTAX, self.validate_level_1_syntax),
            (ValidationLevel.SEMANTIC, self.validate_level_2_semantic),
            (ValidationLevel.COVERAGE, self.validate_level_3_coverage),
            (ValidationLevel.CROSS_REFERENCE, self.validate_level_4_cross_reference)
        ]
        
        for level, validator in validators:
            result = validator()
            results[level] = result
            
            if not result.passed:
                # Stop at first failure
                break
            
            self.current_level = level
        
        return results
    
    # Helper methods
    def _extract_keywords(self, stories: List) -> List[str]:
        """Extract keywords from user stories"""
        keywords = []
        for story in stories:
            story_text = story if isinstance(story, str) else str(story)
            # Extract nouns and verbs
            words = re.findall(r'\b[a-z]+\b', story_text.lower())
            keywords.extend([w for w in words if len(w) > 3])
        return list(set(keywords))
    
    def _requirements_conflict(self, req1, req2) -> bool:
        """Check if two requirements conflict"""
        # Simple heuristic: check for contradictory terms
        req1_text = req1 if isinstance(req1, str) else str(req1)
        req2_text = req2 if isinstance(req2, str) else str(req2)
        
        contradictions = [
            ('must', 'must not'),
            ('always', 'never'),
            ('required', 'optional'),
            ('synchronous', 'asynchronous')
        ]
        
        for word1, word2 in contradictions:
            if word1 in req1_text.lower() and word2 in req2_text.lower():
                if any(term in req1_text.lower() and term in req2_text.lower() 
                       for term in ['same', 'identical', 'equal']):
                    return True
        
        return False
    
    def _find_technical_terms(self) -> List[str]:
        """Find technical terms that need definition"""
        # This would be more sophisticated in practice
        technical_patterns = [
            r'[A-Z]{2,}',  # Acronyms
            r'\w+API',      # API terms
            r'\w+Protocol', # Protocol terms
        ]
        
        terms = []
        spec_text = str(self.spec)
        for pattern in technical_patterns:
            matches = re.findall(pattern, spec_text)
            terms.extend(matches)
        
        return list(set(terms))
    
    def _is_complex_spec(self) -> bool:
        """Determine if spec is complex enough to need rollback"""
        complexity_indicators = [
            'database' in str(self.spec).lower(),
            'migration' in str(self.spec).lower(),
            'payment' in str(self.spec).lower(),
            len(self.spec.get('functional_requirements', [])) > 10,
            'distributed' in str(self.spec).lower()
        ]
        
        return sum(complexity_indicators) >= 2
    
    def _load_existing_specs(self) -> List[Dict]:
        """Load other specs for cross-reference checking"""
        specs = []
        spec_dir = self.spec_path.parent
        
        for spec_file in spec_dir.glob('*.yaml'):
            if spec_file != self.spec_path:
                with open(spec_file) as f:
                    specs.append(yaml.safe_load(f))
        
        return specs
    
    def _check_spec_conflicts(self, existing_specs: List[Dict]) -> List[Dict]:
        """Check for conflicts with existing specs"""
        conflicts = []
        
        # This would check for various types of conflicts
        # For now, simple example checking
        current_apis = self._extract_apis(self.spec)
        
        for other_spec in existing_specs:
            other_apis = self._extract_apis(other_spec)
            
            for api in current_apis:
                if api in other_apis:
                    conflicts.append({
                        'spec': other_spec.get('metadata', {}).get('name', 'unknown'),
                        'issue': f"Duplicate API endpoint: {api}"
                    })
        
        return conflicts
    
    def _extract_apis(self, spec: Dict) -> List[str]:
        """Extract API endpoints from spec"""
        apis = []
        spec_text = str(spec)
        
        # Look for REST endpoint patterns
        endpoint_pattern = r'(GET|POST|PUT|DELETE|PATCH)\s+/[\w/]+'
        matches = re.findall(endpoint_pattern, spec_text)
        apis.extend(matches)
        
        return apis
    
    def _is_update_to_existing(self) -> bool:
        """Check if this spec updates an existing system"""
        update_indicators = [
            'update' in self.spec_path.name.lower(),
            'v2' in self.spec_path.name.lower(),
            'migration' in str(self.spec).lower(),
            'deprecate' in str(self.spec).lower()
        ]
        
        return any(update_indicators)


# CLI Interface
def validate_spec(spec_path: str, gates: str = 'all') -> bool:
    """Main entry point for spec validation"""
    validator = DefenseInDepthValidator(spec_path)
    results = validator.run_progressive_validation()
    
    print(f"\nValidation Results for {spec_path}")
    print("=" * 50)
    
    all_passed = True
    for level, result in results.items():
        print(f"\nLevel {level.value} - {level.name}:")
        print(f"  Status: {'✅ PASSED' if result.passed else '❌ FAILED'}")
        
        if result.errors:
            print("  Errors:")
            for error in result.errors:
                print(f"    - {error}")
        
        if result.warnings:
            print("  Warnings:")
            for warning in result.warnings:
                print(f"    ⚠️  {warning}")
        
        if result.suggestions:
            print("  Suggestions:")
            for suggestion in result.suggestions:
                print(f"    💡 {suggestion}")
        
        if not result.passed:
            all_passed = False
            break
    
    if all_passed:
        print("\n✅ All validation gates passed! Spec is ready for adversarial review.")
    else:
        print("\n❌ Validation failed. Please fix issues and retry.")
    
    return all_passed


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        validate_spec(sys.argv[1])
    else:
        print("Usage: python validation_gates.py <spec_path>")
