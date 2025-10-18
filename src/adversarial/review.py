"""
Spec-MAS v2.0 - Adversarial Spec Review System
Multi-agent adversarial review to find spec vulnerabilities before implementation
"""

import asyncio
import yaml
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import re
import json


class Severity(Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


@dataclass
class AdversarialFinding:
    adversary: str
    severity: Severity
    issue: str
    details: str
    attack_vector: Optional[str] = None
    misinterpretation: Optional[str] = None
    suggested_defense: Optional[str] = None
    location: Optional[str] = None


@dataclass
class AdversarialReport:
    spec_name: str
    total_findings: int
    critical_findings: int
    findings_by_adversary: Dict[str, List[AdversarialFinding]]
    defended_spec_changes: List[Dict]
    approval_status: str
    human_review_required: bool


class AdversaryAgent:
    """Base class for adversarial agents"""
    
    def __init__(self, name: str):
        self.name = name
        self.findings: List[AdversarialFinding] = []
    
    async def attack_spec(self, spec: Dict) -> List[AdversarialFinding]:
        """Override in subclasses"""
        raise NotImplementedError


class SecurityAdversary(AdversaryAgent):
    """Attempts to find security vulnerabilities in specifications"""
    
    def __init__(self):
        super().__init__("Security Adversary")
        self.attack_patterns = {
            'authentication': [
                'missing_auth', 'weak_auth', 'session_management',
                'token_exposure', 'credential_storage'
            ],
            'authorization': [
                'privilege_escalation', 'missing_access_control',
                'insecure_direct_references', 'path_traversal'
            ],
            'data_protection': [
                'unencrypted_pii', 'logging_sensitive_data',
                'insecure_transmission', 'weak_encryption'
            ],
            'injection': [
                'sql_injection', 'command_injection', 'ldap_injection',
                'xpath_injection', 'template_injection'
            ],
            'validation': [
                'missing_input_validation', 'type_confusion',
                'buffer_overflow', 'integer_overflow'
            ]
        }
    
    async def attack_spec(self, spec: Dict) -> List[AdversarialFinding]:
        """Find security vulnerabilities in the specification"""
        self.findings = []
        
        # Check for missing authentication
        await self._check_authentication(spec)
        
        # Check for authorization issues
        await self._check_authorization(spec)
        
        # Check for data protection issues
        await self._check_data_protection(spec)
        
        # Check for injection vulnerabilities
        await self._check_injection_risks(spec)
        
        # Check for validation issues
        await self._check_validation(spec)
        
        return self.findings
    
    async def _check_authentication(self, spec: Dict):
        """Check for authentication vulnerabilities"""
        spec_text = str(spec).lower()
        
        # Check if spec mentions user actions but no auth
        user_actions = ['create', 'update', 'delete', 'modify', 'submit', 'approve']
        has_user_actions = any(action in spec_text for action in user_actions)
        
        auth_keywords = ['authenticate', 'authentication', 'login', 'jwt', 'oauth', 'token']
        has_auth = any(keyword in spec_text for keyword in auth_keywords)
        
        if has_user_actions and not has_auth:
            self.findings.append(AdversarialFinding(
                adversary=self.name,
                severity=Severity.CRITICAL,
                issue="Missing authentication requirements",
                details="Spec defines user actions but doesn't specify authentication",
                attack_vector="Unauthenticated access to user functions",
                suggested_defense="Add explicit authentication requirements for all user actions"
            ))
        
        # Check for session management
        if has_auth and 'session' not in spec_text and 'token' not in spec_text:
            self.findings.append(AdversarialFinding(
                adversary=self.name,
                severity=Severity.HIGH,
                issue="No session management specified",
                details="Authentication mentioned but no session/token management",
                attack_vector="Session hijacking, token replay attacks",
                suggested_defense="Specify session timeout, token refresh, and revocation mechanisms"
            ))
    
    async def _check_authorization(self, spec: Dict):
        """Check for authorization vulnerabilities"""
        spec_text = str(spec).lower()
        
        # Check for role-based actions without authorization
        role_keywords = ['admin', 'user', 'manager', 'owner', 'member']
        has_roles = any(role in spec_text for role in role_keywords)
        
        authz_keywords = ['authorization', 'permission', 'access control', 'rbac', 'acl']
        has_authz = any(keyword in spec_text for keyword in authz_keywords)
        
        if has_roles and not has_authz:
            self.findings.append(AdversarialFinding(
                adversary=self.name,
                severity=Severity.HIGH,
                issue="Missing authorization requirements",
                details="Spec mentions roles but no authorization checks",
                attack_vector="Privilege escalation, unauthorized access",
                suggested_defense="Add explicit authorization checks for all role-based operations"
            ))
    
    async def _check_data_protection(self, spec: Dict):
        """Check for data protection issues"""
        spec_text = str(spec).lower()
        
        # Check for PII without encryption
        pii_keywords = ['email', 'phone', 'address', 'ssn', 'social security', 
                       'credit card', 'payment', 'password', 'date of birth']
        has_pii = any(keyword in spec_text for keyword in pii_keywords)
        
        encryption_keywords = ['encrypt', 'encryption', 'hashed', 'bcrypt', 'aes']
        has_encryption = any(keyword in spec_text for keyword in encryption_keywords)
        
        if has_pii and not has_encryption:
            self.findings.append(AdversarialFinding(
                adversary=self.name,
                severity=Severity.CRITICAL,
                issue="Unprotected sensitive data",
                details="Spec handles PII but doesn't specify encryption",
                attack_vector="Data breach, compliance violations",
                suggested_defense="Require encryption at rest and in transit for all PII"
            ))
        
        # Check for logging sensitive data
        if 'log' in spec_text and has_pii:
            if 'redact' not in spec_text and 'mask' not in spec_text:
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.HIGH,
                    issue="Potential sensitive data in logs",
                    details="Logging mentioned with PII but no redaction specified",
                    attack_vector="Information disclosure through logs",
                    suggested_defense="Specify PII redaction/masking in all logs"
                ))
    
    async def _check_injection_risks(self, spec: Dict):
        """Check for injection vulnerabilities"""
        spec_text = str(spec).lower()
        
        # Check for database operations without parameterization
        db_keywords = ['database', 'sql', 'query', 'select', 'insert', 'update', 'delete']
        has_db = any(keyword in spec_text for keyword in db_keywords)
        
        protection_keywords = ['parameterized', 'prepared statement', 'sanitize', 'escape']
        has_protection = any(keyword in spec_text for keyword in protection_keywords)
        
        if has_db and not has_protection:
            self.findings.append(AdversarialFinding(
                adversary=self.name,
                severity=Severity.HIGH,
                issue="SQL injection risk",
                details="Database operations without parameterization requirements",
                attack_vector="SQL injection attacks",
                suggested_defense="Require parameterized queries for all database operations"
            ))
        
        # Check for command execution
        cmd_keywords = ['execute', 'shell', 'command', 'system', 'exec']
        if any(keyword in spec_text for keyword in cmd_keywords):
            self.findings.append(AdversarialFinding(
                adversary=self.name,
                severity=Severity.CRITICAL,
                issue="Command injection risk",
                details="Spec involves command execution",
                attack_vector="Remote code execution",
                suggested_defense="Avoid shell commands; if required, specify strict input validation"
            ))
    
    async def _check_validation(self, spec: Dict):
        """Check for input validation issues"""
        spec_text = str(spec).lower()
        
        # Check for user input without validation
        input_keywords = ['input', 'form', 'upload', 'parameter', 'request']
        has_input = any(keyword in spec_text for keyword in input_keywords)
        
        validation_keywords = ['validate', 'validation', 'sanitize', 'whitelist', 'regex']
        has_validation = any(keyword in spec_text for keyword in validation_keywords)
        
        if has_input and not has_validation:
            self.findings.append(AdversarialFinding(
                adversary=self.name,
                severity=Severity.HIGH,
                issue="Missing input validation",
                details="User input accepted without validation requirements",
                attack_vector="XSS, injection attacks, buffer overflow",
                suggested_defense="Specify validation rules for all user inputs"
            ))


class AmbiguityAdversary(AdversaryAgent):
    """Finds ambiguous language that could be misinterpreted"""
    
    def __init__(self):
        super().__init__("Ambiguity Adversary")
        self.vague_terms = {
            'should': "Use 'MUST' for requirements",
            'may': "Use 'MUST' or 'MUST NOT' for clarity",
            'might': "Be explicit about optionality",
            'could': "Use 'MUST' or 'MAY' per RFC 2119",
            'consider': "Specify exact requirements",
            'appropriate': "Define what is appropriate",
            'reasonable': "Specify exact bounds",
            'timely': "Specify exact time limits",
            'efficient': "Define performance metrics",
            'secure': "Specify security requirements",
            'user-friendly': "Define specific UX requirements",
            'scalable': "Specify scalability metrics",
            'robust': "Define failure scenarios",
            'flexible': "Specify variation points"
        }
    
    async def attack_spec(self, spec: Dict) -> List[AdversarialFinding]:
        """Find ambiguous language in the specification"""
        self.findings = []
        
        # Check all text fields for vague terms
        await self._check_requirements(spec)
        await self._check_boundaries(spec)
        await self._check_error_handling(spec)
        
        return self.findings
    
    async def _check_requirements(self, spec: Dict):
        """Check requirements for ambiguous language"""
        requirements = []
        
        # Collect all requirements
        if 'functional_requirements' in spec:
            requirements.extend(spec['functional_requirements'])
        if 'non_functional_requirements' in spec:
            requirements.extend(spec['non_functional_requirements'])
        
        for req in requirements:
            req_text = req if isinstance(req, str) else str(req)
            req_lower = req_text.lower()
            
            for term, suggestion in self.vague_terms.items():
                if term in req_lower:
                    # Generate a misinterpretation
                    misinterpretation = self._generate_misinterpretation(req_text, term)
                    
                    self.findings.append(AdversarialFinding(
                        adversary=self.name,
                        severity=Severity.MEDIUM,
                        issue=f"Ambiguous term '{term}' in requirement",
                        details=f"Requirement: {req_text[:100]}...",
                        misinterpretation=misinterpretation,
                        suggested_defense=suggestion,
                        location=f"requirement: {req_text[:50]}"
                    ))
    
    async def _check_boundaries(self, spec: Dict):
        """Check for undefined boundaries"""
        spec_text = str(spec)
        
        # Check for numeric values without bounds
        numeric_pattern = r'\b(number|count|size|length|amount|quantity)\b'
        if re.search(numeric_pattern, spec_text, re.IGNORECASE):
            if not re.search(r'(min|max|between|less than|greater than|\d+)', spec_text):
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.HIGH,
                    issue="Unbounded numeric values",
                    details="Numeric values mentioned without limits",
                    misinterpretation="Could accept 0, negative, or extremely large values",
                    suggested_defense="Specify min/max bounds for all numeric inputs"
                ))
        
        # Check for time-related terms without specifics
        time_terms = ['soon', 'quickly', 'eventually', 'periodically', 'regularly']
        for term in time_terms:
            if term in spec_text.lower():
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.MEDIUM,
                    issue=f"Vague time reference: '{term}'",
                    details="Time constraint is not specific",
                    misinterpretation="Could mean milliseconds or days",
                    suggested_defense="Specify exact time limits (e.g., 'within 5 seconds')"
                ))
    
    async def _check_error_handling(self, spec: Dict):
        """Check for ambiguous error handling"""
        spec_text = str(spec).lower()
        
        if 'error' in spec_text or 'exception' in spec_text:
            error_terms = ['handle appropriately', 'deal with errors', 'manage exceptions']
            for term in error_terms:
                if term in spec_text:
                    self.findings.append(AdversarialFinding(
                        adversary=self.name,
                        severity=Severity.MEDIUM,
                        issue="Vague error handling",
                        details=f"Error handling specified as '{term}'",
                        misinterpretation="Could ignore errors or crash application",
                        suggested_defense="Specify exact error handling: log, retry, fallback, etc."
                    ))
    
    def _generate_misinterpretation(self, requirement: str, vague_term: str) -> str:
        """Generate a plausible misinterpretation"""
        misinterpretations = {
            'should': f"Interpreted as optional - skipping this requirement",
            'may': f"Interpreted as 'will not' - opposite of intended",
            'appropriate': f"Interpreted as 'minimal' - lowest effort implementation",
            'reasonable': f"Interpreted as 'unlimited' - no bounds applied",
            'secure': f"Interpreted as 'basic auth only' - minimal security"
        }
        
        return misinterpretations.get(vague_term, 
                                      f"Interpreted '{vague_term}' in the most permissive way possible")


class ImplementationAdversary(AdversaryAgent):
    """Attempts to misimplement the spec in plausible ways"""
    
    def __init__(self):
        super().__init__("Implementation Adversary")
    
    async def attack_spec(self, spec: Dict) -> List[AdversarialFinding]:
        """Find ways to misimplement the specification"""
        self.findings = []
        
        await self._check_edge_cases(spec)
        await self._check_race_conditions(spec)
        await self._check_state_management(spec)
        await self._check_error_recovery(spec)
        
        return self.findings
    
    async def _check_edge_cases(self, spec: Dict):
        """Check for unspecified edge cases"""
        spec_text = str(spec).lower()
        
        # Check for operations without edge case handling
        if 'create' in spec_text or 'add' in spec_text:
            if 'duplicate' not in spec_text:
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.MEDIUM,
                    issue="Unspecified duplicate handling",
                    details="Creation operation without duplicate policy",
                    misinterpretation="Allow duplicate creation, causing data inconsistency",
                    suggested_defense="Specify behavior for duplicate creation attempts"
                ))
        
        if 'delete' in spec_text or 'remove' in spec_text:
            if 'not found' not in spec_text and 'not exist' not in spec_text:
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.MEDIUM,
                    issue="Unspecified missing resource handling",
                    details="Delete operation without 'not found' behavior",
                    misinterpretation="Silent failure or crash on missing resource",
                    suggested_defense="Specify behavior when deleting non-existent items"
                ))
        
        if 'list' in spec_text or 'query' in spec_text:
            if 'empty' not in spec_text and 'no results' not in spec_text:
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.LOW,
                    issue="Unspecified empty result handling",
                    details="Query operation without empty result specification",
                    misinterpretation="Return null instead of empty array",
                    suggested_defense="Specify response format for empty results"
                ))
    
    async def _check_race_conditions(self, spec: Dict):
        """Check for potential race conditions"""
        spec_text = str(spec).lower()
        
        # Check for concurrent operations without synchronization
        concurrent_keywords = ['concurrent', 'parallel', 'simultaneous', 'multiple users']
        has_concurrency = any(keyword in spec_text for keyword in concurrent_keywords)
        
        sync_keywords = ['lock', 'mutex', 'synchronize', 'atomic', 'transaction']
        has_sync = any(keyword in spec_text for keyword in sync_keywords)
        
        if has_concurrency and not has_sync:
            self.findings.append(AdversarialFinding(
                adversary=self.name,
                severity=Severity.HIGH,
                issue="Race condition risk",
                details="Concurrent operations without synchronization",
                misinterpretation="Implement without thread safety",
                suggested_defense="Specify locking/transaction requirements"
            ))
        
        # Check for read-modify-write without atomicity
        if 'update' in spec_text and ('based on' in spec_text or 'if' in spec_text):
            if 'atomic' not in spec_text and 'transaction' not in spec_text:
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.HIGH,
                    issue="Non-atomic read-modify-write",
                    details="Conditional update without atomicity requirement",
                    misinterpretation="Implement with separate read and write operations",
                    suggested_defense="Require atomic compare-and-swap or transactions"
                ))
    
    async def _check_state_management(self, spec: Dict):
        """Check for state management issues"""
        spec_text = str(spec).lower()
        
        # Check for stateful operations without state machine
        state_keywords = ['status', 'state', 'workflow', 'lifecycle']
        has_state = any(keyword in spec_text for keyword in state_keywords)
        
        if has_state:
            transition_keywords = ['transition', 'valid states', 'state machine', 'allowed']
            has_transitions = any(keyword in spec_text for keyword in transition_keywords)
            
            if not has_transitions:
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.MEDIUM,
                    issue="Undefined state transitions",
                    details="Stateful system without transition rules",
                    misinterpretation="Allow any state transition",
                    suggested_defense="Define valid states and allowed transitions"
                ))
    
    async def _check_error_recovery(self, spec: Dict):
        """Check for error recovery specifications"""
        spec_text = str(spec).lower()
        
        if 'error' in spec_text or 'fail' in spec_text:
            recovery_keywords = ['retry', 'rollback', 'recover', 'fallback', 'compensate']
            has_recovery = any(keyword in spec_text for keyword in recovery_keywords)
            
            if not has_recovery:
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.HIGH,
                    issue="No error recovery specified",
                    details="Error conditions without recovery strategy",
                    misinterpretation="Crash or leave system in inconsistent state",
                    suggested_defense="Specify recovery actions for each error scenario"
                ))


class PerformanceAdversary(AdversaryAgent):
    """Finds potential performance issues in specifications"""
    
    def __init__(self):
        super().__init__("Performance Adversary")
    
    async def attack_spec(self, spec: Dict) -> List[AdversarialFinding]:
        """Find performance vulnerabilities"""
        self.findings = []
        
        await self._check_unbounded_operations(spec)
        await self._check_resource_limits(spec)
        await self._check_caching_needs(spec)
        await self._check_pagination(spec)
        
        return self.findings
    
    async def _check_unbounded_operations(self, spec: Dict):
        """Check for operations without bounds"""
        spec_text = str(spec).lower()
        
        # Check for list/search without pagination
        if ('list' in spec_text or 'search' in spec_text or 'query' in spec_text):
            if 'limit' not in spec_text and 'page' not in spec_text and 'pagination' not in spec_text:
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.HIGH,
                    issue="Unbounded query results",
                    details="List/search operation without result limits",
                    attack_vector="Memory exhaustion with large result sets",
                    suggested_defense="Add pagination or result limit requirements"
                ))
        
        # Check for loops without bounds
        if 'for each' in spec_text or 'iterate' in spec_text or 'process all' in spec_text:
            if 'timeout' not in spec_text and 'limit' not in spec_text:
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.MEDIUM,
                    issue="Unbounded iteration",
                    details="Iteration without limits or timeout",
                    attack_vector="CPU exhaustion with large datasets",
                    suggested_defense="Add iteration limits or processing timeouts"
                ))
    
    async def _check_resource_limits(self, spec: Dict):
        """Check for missing resource limits"""
        spec_text = str(spec).lower()
        
        # Check file uploads without size limits
        if 'upload' in spec_text or 'file' in spec_text:
            if 'size limit' not in spec_text and 'max size' not in spec_text:
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.HIGH,
                    issue="Unlimited file uploads",
                    details="File handling without size restrictions",
                    attack_vector="Disk space exhaustion",
                    suggested_defense="Specify maximum file size and total storage limits"
                ))
        
        # Check for missing rate limits
        if 'api' in spec_text or 'endpoint' in spec_text:
            if 'rate limit' not in spec_text and 'throttle' not in spec_text:
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.MEDIUM,
                    issue="No rate limiting specified",
                    details="API endpoints without rate limits",
                    attack_vector="DoS through request flooding",
                    suggested_defense="Add rate limiting requirements per user/IP"
                ))
    
    async def _check_caching_needs(self, spec: Dict):
        """Check for operations that need caching"""
        spec_text = str(spec).lower()
        
        # Check for expensive operations without caching
        expensive_keywords = ['calculate', 'compute', 'aggregate', 'report', 'analytics']
        has_expensive = any(keyword in spec_text for keyword in expensive_keywords)
        
        if has_expensive and 'cache' not in spec_text:
            self.findings.append(AdversarialFinding(
                adversary=self.name,
                severity=Severity.MEDIUM,
                issue="Expensive operations without caching",
                details="Computational operations without cache strategy",
                attack_vector="Performance degradation under load",
                suggested_defense="Specify caching requirements for expensive operations"
            ))
    
    async def _check_pagination(self, spec: Dict):
        """Check for proper pagination specification"""
        spec_text = str(spec).lower()
        
        if 'pagination' in spec_text or 'page' in spec_text:
            # Check for cursor vs offset pagination
            if 'offset' in spec_text and 'large' in spec_text:
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.LOW,
                    issue="Offset pagination for large datasets",
                    details="Offset-based pagination becomes slow with large offsets",
                    attack_vector="Performance degradation on deep pages",
                    suggested_defense="Consider cursor-based pagination for large datasets"
                ))


class ComplianceAdversary(AdversaryAgent):
    """Checks for compliance and regulatory issues"""
    
    def __init__(self):
        super().__init__("Compliance Adversary")
        self.regulations = {
            'GDPR': ['personal data', 'eu', 'europe', 'privacy', 'consent', 'right to be forgotten'],
            'PCI-DSS': ['credit card', 'payment card', 'card number', 'cvv', 'payment'],
            'HIPAA': ['health', 'medical', 'patient', 'diagnosis', 'prescription'],
            'SOC2': ['security', 'availability', 'confidentiality', 'privacy'],
            'CCPA': ['california', 'personal information', 'consumer privacy']
        }
    
    async def attack_spec(self, spec: Dict) -> List[AdversarialFinding]:
        """Find compliance issues"""
        self.findings = []
        
        await self._check_data_retention(spec)
        await self._check_audit_requirements(spec)
        await self._check_consent_management(spec)
        await self._check_data_portability(spec)
        
        return self.findings
    
    async def _check_data_retention(self, spec: Dict):
        """Check for data retention policies"""
        spec_text = str(spec).lower()
        
        # Check if personal data is handled
        if any(term in spec_text for terms in self.regulations.values() for term in terms):
            if 'retention' not in spec_text and 'delete' not in spec_text:
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.HIGH,
                    issue="Missing data retention policy",
                    details="Personal data handled without retention/deletion policy",
                    attack_vector="Compliance violations, legal liability",
                    suggested_defense="Specify data retention periods and deletion procedures"
                ))
    
    async def _check_audit_requirements(self, spec: Dict):
        """Check for audit trail requirements"""
        spec_text = str(spec).lower()
        
        # Check for operations that need audit trails
        audit_operations = ['delete', 'modify', 'access', 'view', 'export']
        has_operations = any(op in spec_text for op in audit_operations)
        
        if has_operations and 'audit' not in spec_text and 'log' not in spec_text:
            self.findings.append(AdversarialFinding(
                adversary=self.name,
                severity=Severity.MEDIUM,
                issue="Missing audit trail requirements",
                details="Sensitive operations without audit logging",
                attack_vector="Unable to detect or investigate breaches",
                suggested_defense="Add audit logging for all data operations"
            ))
    
    async def _check_consent_management(self, spec: Dict):
        """Check for consent requirements (GDPR)"""
        spec_text = str(spec).lower()
        
        # Check if personal data is collected
        if 'personal' in spec_text or 'user data' in spec_text:
            if 'consent' not in spec_text:
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.HIGH,
                    issue="No consent management",
                    details="Personal data collection without consent mechanism",
                    attack_vector="GDPR violations, fines",
                    suggested_defense="Add explicit consent collection and management"
                ))
    
    async def _check_data_portability(self, spec: Dict):
        """Check for data portability requirements"""
        spec_text = str(spec).lower()
        
        # Check if user data is stored
        if 'user' in spec_text and 'data' in spec_text:
            if 'export' not in spec_text and 'download' not in spec_text:
                self.findings.append(AdversarialFinding(
                    adversary=self.name,
                    severity=Severity.MEDIUM,
                    issue="No data portability mechanism",
                    details="User data without export functionality",
                    attack_vector="GDPR Article 20 violation",
                    suggested_defense="Add data export functionality in machine-readable format"
                ))


class AdversarialReviewOrchestrator:
    """Orchestrates the adversarial review process"""
    
    def __init__(self):
        self.adversaries = [
            SecurityAdversary(),
            AmbiguityAdversary(),
            ImplementationAdversary(),
            PerformanceAdversary(),
            ComplianceAdversary()
        ]
    
    async def run_review(self, spec_path: str) -> AdversarialReport:
        """Run full adversarial review"""
        with open(spec_path, 'r') as f:
            spec = yaml.safe_load(f) if spec_path.endswith('.yaml') else {'content': f.read()}
        
        # Run all adversaries in parallel
        findings_lists = await asyncio.gather(*[
            adversary.attack_spec(spec) for adversary in self.adversaries
        ])
        
        # Organize findings by adversary
        findings_by_adversary = {}
        all_findings = []
        critical_count = 0
        
        for adversary, findings in zip(self.adversaries, findings_lists):
            findings_by_adversary[adversary.name] = findings
            all_findings.extend(findings)
            critical_count += sum(1 for f in findings if f.severity == Severity.CRITICAL)
        
        # Determine approval status
        if critical_count > 0:
            approval_status = "BLOCKED - Critical findings must be addressed"
        elif len(all_findings) > 10:
            approval_status = "NEEDS_REVIEW - Too many findings"
        elif len(all_findings) > 0:
            approval_status = "CONDITIONAL - Address findings before implementation"
        else:
            approval_status = "APPROVED - No significant issues found"
        
        return AdversarialReport(
            spec_name=spec.get('metadata', {}).get('name', 'unknown'),
            total_findings=len(all_findings),
            critical_findings=critical_count,
            findings_by_adversary=findings_by_adversary,
            defended_spec_changes=self._generate_defenses(all_findings),
            approval_status=approval_status,
            human_review_required=critical_count > 0 or len(all_findings) > 5
        )
    
    def _generate_defenses(self, findings: List[AdversarialFinding]) -> List[Dict]:
        """Generate spec changes to address findings"""
        defenses = []
        
        for finding in findings:
            if finding.suggested_defense:
                defenses.append({
                    'issue': finding.issue,
                    'change': finding.suggested_defense,
                    'severity': finding.severity.value
                })
        
        return defenses


# CLI Interface
async def main():
    import sys
    if len(sys.argv) < 2:
        print("Usage: python adversarial_review.py <spec_path>")
        sys.exit(1)
    
    spec_path = sys.argv[1]
    orchestrator = AdversarialReviewOrchestrator()
    
    print(f"\n🔍 Running Adversarial Review for {spec_path}")
    print("=" * 60)
    
    report = await orchestrator.run_review(spec_path)
    
    print(f"\n📊 Adversarial Review Report")
    print(f"Total Findings: {report.total_findings}")
    print(f"Critical Findings: {report.critical_findings}")
    print(f"Status: {report.approval_status}")
    
    for adversary_name, findings in report.findings_by_adversary.items():
        if findings:
            print(f"\n{adversary_name}:")
            for finding in findings:
                icon = "🔴" if finding.severity == Severity.CRITICAL else "🟡" if finding.severity == Severity.HIGH else "🔵"
                print(f"  {icon} [{finding.severity.value}] {finding.issue}")
                if finding.suggested_defense:
                    print(f"     💡 {finding.suggested_defense}")
    
    if report.defended_spec_changes:
        print("\n📝 Recommended Spec Changes:")
        for change in report.defended_spec_changes:
            print(f"  - {change['change']}")
    
    print(f"\n{'✅' if 'APPROVED' in report.approval_status else '❌'} {report.approval_status}")


if __name__ == "__main__":
    asyncio.run(main())
