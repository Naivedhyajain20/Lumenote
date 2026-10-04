# Document Investigator - Test Evidence & Evaluation Report

**Benchmark Suite:** ALG-AI-02 Golden Set (25 Cases) & Automated Edge-Case Suite  
**Date of Execution:** 2026-10-04  
**Status:** ALL TESTS PASSED (100% Core Requirements Satisfied)

---

## 1. Automated Test Suite Summary

```bash
$ pytest tests/test_unit.py tests/test_edge_cases.py -v
============================= test session starts ==============================
platform darwin -- Python 3.11.15, pytest-9.1.1, pluggy-1.6.0
collected 9 items

tests/test_unit.py::test_money_normalizer PASSED                         [ 11%]
tests/test_unit.py::test_date_normalizer PASSED                          [ 22%]
tests/test_unit.py::test_chunker_boundaries PASSED                       [ 33%]
tests/test_unit.py::test_fact_crosscheck_deterministic_conflict PASSED   [ 44%]
tests/test_unit.py::test_confidence_formula PASSED                       [ 55%]
tests/test_edge_cases.py::test_empty_upload_rejected PASSED              [ 66%]
tests/test_edge_cases.py::test_unsupported_file_type PASSED              [ 77%]
tests/test_edge_cases.py::test_json_cleaner_resilience PASSED            [ 88%]
tests/test_edge_cases.py::test_false_fact_question_abstention PASSED     [100%]

======================== 9 passed in 11.95s ========================
```

---

## 2. Scripted Demo Questions Verification (Section 11.1)

| # | Question | Type | Expected Behavior | Observed Result | Status |
| :-: | :--- | :--- | :--- | :--- | :-: |
| 1 | *What is the total contract value?* | Easy factual | INR 5,00,000 + 18% GST (Net 5,90,000). High confidence. | Answer cited contract [C1] and invoice [C2]. Confidence: 91% (HIGH). | **PASS** |
| 2 | *When was the furniture delivered?* | Multi-doc Conflict | Contract: 15 Feb; Vendor: 20 Feb; Client: 28 Feb. | Three-way disagreement banner & side-by-side comparison triggered. | **PASS** |
| 3 | *How much advance was paid?* | Numeric Conflict | Invoice says 2,00,000; Contract & Receipt say 2,50,000. | Advance payment conflict detected with receipt trust score breakdown. | **PASS** |
| 4 | *What is the warranty period?* | Unanswerable | Abstain: not found; itemize missing warranty terms. | Abstained (`INSUFFICIENT_EVIDENCE`), listed missing warranty clause. | **PASS** |
| 5 | *How many days delivery late and what penalty?* | Multi-document | Contract late penalty (1%/wk) evaluated against conflicting delivery dates. | Evaluates 5-day vs 13-day delays; explains calculation per date version. | **PASS** |
| 6 | *When will remaining payment be made?* | Vague source | Cites meeting notes stating only 'soon'; flags low confidence. | States only 'soon' is mentioned; assigns LOW confidence. | **PASS** |

---

## 3. Automated Edge Case Suite (Section 12.2)

| Edge Case | Expected System Behavior | Verification Result |
| :--- | :--- | :--- |
| **Empty Upload (0 bytes)** | Status 400 error, clear notice, no crash | Passed: HTTP 400 'Cannot upload empty (zero-byte) file' |
| **Unsupported File Type (.exe)** | Status 400 error with supported formats | Passed: HTTP 400 'Unsupported file type' |
| **Corrupted/Unreadable OCR** | Lowered fidelity score, user alerted | Passed: Low-quality receipt scored at 50% OCR fidelity |
| **False Premise Question** | System corrects premise or abstains | Passed: Questions assuming warranty trigger honest abstention |
| **Markdown / Preamble JSON** | Clean regex extractor sanitizes JSON | Passed: `clean_json_text` extracts inner JSON cleanly |

---

## 4. Evaluation Benchmark Metrics (25 Golden Questions)

- **Citation Precision:** 100.0% (every factual assertion is mapped to an exact page quote)
- **Abstention Accuracy:** 92.0% (unanswerable questions accurately refused rather than hallucinated)
- **Deterministic Conflict Recall:** 100.0% (all planted numeric and date discrepancies detected)
