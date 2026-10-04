"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Activity, ArrowDown, ArrowRight, ArrowUpRight, BookOpen,
  Check, ChevronDown, ChevronUp, FileSearch, GitCompareArrows,
  Search, ShieldQuestion,
} from "lucide-react";
import Reveal from "@/components/Reveal";

const capabilities = [
  { number: "01", Icon: FileSearch, title: "Trace each answer", text: "Open the cited passage and check it against the original document page." },
  { number: "02", Icon: GitCompareArrows, title: "Compare records", text: "Review different dates, amounts, and statements with both sources in view." },
  { number: "03", Icon: ShieldQuestion, title: "See what needs review", text: "Keep missing details and conflicting evidence visible while you assess an answer." },
];

const questions = [
  { question: "What files can I add?", answer: "The workspace accepts PDF, DOCX, TXT, Markdown, JPG, PNG, and TIFF files. Scanned images can be processed through OCR." },
  { question: "How do citations work?", answer: "Answers can include citations to retrieved passages. Select a citation to open the corresponding document page and inspect the source text." },
  { question: "What happens when records disagree?", answer: "Detected conflicts are shown alongside their source records so you can compare the values and review the original evidence." },
  { question: "Can I work with machine telemetry too?", answer: "Yes. Predict Next provides a separate workspace for machine telemetry, validation cases, and predictive maintenance metrics." },
];

function LandingHeader() {
  return (
    <header className="landing-header page-width">
      <Link href="/" className="landing-brand" aria-label="Lumenote home">
        <span className="landing-brand-mark"><Image src="/logo.png" alt="" width={30} height={30} /></span>
        <span>Lumenote<small>Evidence intelligence</small></span>
      </Link>
      <nav className="landing-nav" aria-label="Main navigation">
        <a href="#platform">Platform</a>
        <Link href="/workspace">Investigation</Link>
        <Link href="/predict">Predict Next</Link>
      </nav>
      <Link href="/workspace" className="landing-header-cta">Open workspace <ArrowUpRight size={14} /></Link>
    </header>
  );
}

function ProductPreview() {
  return (
    <div className="preview-stage" role="img" aria-label="Looping product tour: enter a question, scan context, invoice, and correspondence, inspect source matches, then choose a review action.">
      <div className="tour-heading"><span>PRODUCT TOUR</span><i /> ILLUSTRATIVE WORKFLOW</div>
      <div className="tour-stage" aria-hidden="true">
        <div className="tour-phase tour-type">
          <div className="tour-prompt"><span className="tour-micro">ASK YOUR RECORDS</span><div><span className="prompt-caret" /><strong>What changed across these documents?</strong></div><span className="prompt-send"><ArrowUpRight size={15} /></span></div>
          <div className="tour-doc-stack">
            <div className="tour-doc doc-context"><span>CONTEXT</span><i /><i /><i className="doc-mark" /><i /><i className="short" /></div>
            <div className="tour-doc doc-invoice"><span>INVOICE</span><i /><i className="short" /><i className="doc-mark" /><i /><i /></div>
            <div className="tour-doc doc-mail"><span>CORRESPONDENCE</span><i /><i /><i className="short" /><i className="doc-mark" /><i /></div>
          </div>
          <span className="tour-phase-note">A question becomes a focused search.</span>
        </div>
        <div className="tour-phase tour-scan">
          <div className="tour-scan-head"><span className="scan-orbit"><i /></span><div><span className="tour-micro">SEARCHING YOUR FILES</span><strong>Finding relevant passages</strong></div><span className="scan-live"><i /> SCANNING</span></div>
          <div className="tour-scan-docs">
            <div className="tour-scan-doc"><span>CONTEXT <small>PDF · PAGE 04</small></span><i /><i /><i className="scan-highlight" /><i /><i className="short" /></div>
            <div className="tour-scan-doc"><span>INVOICE <small>PDF · PAGE 01</small></span><i /><i className="short" /><i className="scan-highlight" /><i /><i /></div>
            <div className="tour-scan-doc"><span>CORRESPONDENCE <small>DOC · PAGE 02</small></span><i /><i /><i className="short" /><i className="scan-highlight" /><i /></div>
            <span className="tour-scan-beam" />
          </div>
          <span className="tour-phase-note">Relevant text is found across different file types.</span>
        </div>
        <div className="tour-phase tour-review">
          <div className="tour-review-head"><span className="tour-micro">SOURCE MATCHES</span><span className="review-link"><i /> LINKED TO RECORDS</span></div>
          <div className="tour-match-grid">
            <div className="tour-match"><span>CONTEXT · PAGE 04</span><p>Service date recorded as <b>12 March</b>.</p><small><FileSearch size={12} /> Open source passage</small></div>
            <div className="tour-match"><span>INVOICE · PAGE 01</span><p>Invoice date listed as <b>14 March</b>.</p><small><FileSearch size={12} /> Open source passage</small></div>
          </div>
          <div className="tour-review-callout"><GitCompareArrows size={14} /> Different dates found <span>Compare both records</span></div>
          <span className="tour-phase-note">Inspect the evidence before deciding what it means.</span>
        </div>
        <div className="tour-phase tour-act">
          <div className="tour-act-head"><span className="tour-micro">YOUR NEXT STEP</span><strong>Work with the evidence</strong></div>
          <div className="tour-action-list"><div><span className="action-icon"><FileSearch size={15} /></span><span><b>Open source passage</b><small>Check the original page</small></span><ArrowUpRight size={14} /></div><div><span className="action-icon"><GitCompareArrows size={15} /></span><span><b>Compare records</b><small>Review the conflicting details</small></span><ArrowUpRight size={14} /></div><div><span className="action-icon"><BookOpen size={15} /></span><span><b>Prepare a report</b><small>Keep citations with your findings</small></span><ArrowUpRight size={14} /></div></div>
          <span className="tour-phase-note">Choose an action and keep the source in view.</span>
        </div>
      </div>
      <div className="tour-steps" aria-hidden="true"><span className="tour-step step-ask"><i>01</i> ASK</span><b /><span className="tour-step step-scan"><i>02</i> SCAN</span><b /><span className="tour-step step-review"><i>03</i> REVIEW</span><b /><span className="tour-step step-act"><i>04</i> ACT</span></div>
    </div>
  );
}

export default function LandingPage() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <Image src="/evidence-signal-visual.png" alt="Sculptural document layers and a precision sensor, connected by subtle blue light" fill priority sizes="100vw" className="hero-art" />
        <div className="hero-shade" />
        <LandingHeader />
        <div className="hero-layout page-width">
          <div className="hero-copy">
            <p className="landing-kicker"><span /> DOCUMENT INVESTIGATION &amp; PREDICTIVE MAINTENANCE</p>
            <h1>Find answers<br /><em>in your records.</em></h1>
            <p className="landing-lede">Search across documents, trace answers to their sources, and review conflicting details. Use Predict Next to explore equipment telemetry in a separate workspace.</p>
            <div className="landing-actions">
              <Link href="/workspace" className="landing-primary">Open document workspace <ArrowRight size={16} /></Link>
              <Link href="/predict" className="landing-secondary">View Predict Next <ArrowUpRight size={15} /></Link>
            </div>
            <div className="landing-proof"><span><Check size={14} /> Source-linked citations</span><span><Check size={14} /> Side-by-side conflicts</span></div>
          </div>
          <ProductPreview />
          <a href="#platform" className="landing-scroll"><ArrowDown size={14} /> Explore the platform</a>
          <span className="hero-coordinate" aria-hidden="true">ALG-AI-02 <i /> ALG-DATA-02</span>
        </div>
      </section>

      <main>
        <section id="platform" className="landing-section page-width">
          <Reveal className="section-heading">
            <div><p className="landing-kicker"><span /> DOCUMENT INVESTIGATION</p><h2>From question<br /><em>to source passage.</em></h2></div>
            <p>Ask about the records you have. Inspect cited passages, compare conflicting details, and decide what needs follow-up.</p>
          </Reveal>
          <div className="capability-grid">
            {capabilities.map(({ number, Icon, title, text }, index) => (
              <Reveal key={number} delay={index * 90}><article className="capability-card">
                <div className="capability-head"><span>{number} <i /> 03</span><Icon size={19} strokeWidth={1.6} /></div>
                <h3>{title}</h3><p>{text}</p><span className="capability-corner">↗</span>
              </article></Reveal>
            ))}
          </div>
        </section>

        <section className="feature-section">
          <div className="page-width">
            <Reveal className="feature-heading">
              <div><p className="landing-kicker"><span /> WHAT YOU CAN DO</p><h2>Tools for the work<br /><em>in front of you.</em></h2></div>
              <p>Move from a document question to a source you can inspect, or switch to equipment data for maintenance analysis.</p>
            </Reveal>
            <div className="feature-grid">
              <Reveal><Link href="/workspace" className="feature-card">
                <div className="feature-art feature-art-search" aria-hidden="true"><div className="art-document"><span>FIELD REPORT</span><i /><i /><i className="art-highlight" /><i /><i /></div><div className="art-search-bubble"><Search size={25} /><b>3</b></div><span className="art-tag">MATCH FOUND</span></div>
                <div className="feature-card-copy"><span className="feature-number">01 / DOCUMENTS</span><h3>Search your records</h3><p>Ask a question across uploaded files and locate relevant passages.</p><span className="feature-open">OPEN WORKSPACE <ArrowUpRight size={14} /></span></div>
              </Link></Reveal>
              <Reveal delay={70}><Link href="/workspace" className="feature-card">
                <div className="feature-art feature-art-citation" aria-hidden="true"><div className="art-page"><span> SOURCE PAGE 04</span><i /><i className="art-highlight" /><i /><i /><i className="short" /></div><div className="art-citation"><span>“</span><b>Open cited passage</b><ArrowUpRight size={13} /></div><span className="art-page-pin">↗</span></div>
                <div className="feature-card-copy"><span className="feature-number">02 / EVIDENCE</span><h3>Follow each citation</h3><p>Open the source page and check what the document actually says.</p><span className="feature-open">VIEW CITATIONS <ArrowUpRight size={14} /></span></div>
              </Link></Reveal>
              <Reveal delay={140}><Link href="/workspace" className="feature-card">
                <div className="feature-art feature-art-compare" aria-hidden="true"><div className="art-compare-doc"><span>CONTEXT</span><i /><i className="art-highlight" /><i /><b>12 MAR</b></div><div className="art-compare-mark"><GitCompareArrows size={18} /></div><div className="art-compare-doc second"><span>INVOICE</span><i /><i /><i className="art-highlight" /><b>14 MAR</b></div><span className="art-difference">DATES DIFFER</span></div>
                <div className="feature-card-copy"><span className="feature-number">03 / REVIEW</span><h3>Compare conflicting details</h3><p>Keep both records in view when dates, amounts, or statements differ.</p><span className="feature-open">COMPARE RECORDS <ArrowUpRight size={14} /></span></div>
              </Link></Reveal>
              <Reveal delay={210}><Link href="/predict" className="feature-card">
                <div className="feature-art feature-art-predict" aria-hidden="true"><div className="art-metric"><span>LIVE TELEMETRY</span><b>Machine signals</b><div className="art-chart"><i /><i /><i /><i /><i /><i /><i /><i /></div><small><span /> SENSOR SERIES</small></div><span className="art-risk">RISK SIGNAL <b>↗</b></span></div>
                <div className="feature-card-copy"><span className="feature-number">04 / PREDICT NEXT</span><h3>Explore machine signals</h3><p>Review telemetry, failure-risk predictions, and validation metrics.</p><span className="feature-open">OPEN PREDICT NEXT <ArrowUpRight size={14} /></span></div>
              </Link></Reveal>
            </div>
          </div>
        </section>

        <section className="workflow-section">
          <div className="page-width workflow-layout">
            <Reveal className="workflow-intro">
              <p className="landing-kicker"><span /> AN INVESTIGATION, STEP BY STEP</p>
              <h2>From source<br />to <em>next step.</em></h2>
              <p>Search uploaded records, inspect the matching passages, and organize findings for a human review.</p>
              <Link href="/workspace" className="landing-text-link">Explore the workspace <ArrowRight size={15} /></Link>
            </Reveal>
            <div className="workflow-list">
              {[
                ["01", "Gather", "Add the documents and records that matter."],
                ["02", "Connect", "Search across the corpus and follow references."],
                ["03", "Compare", "Review disagreements against their original sources."],
                ["04", "Synthesize", "Prepare a report for careful human review."],
              ].map(([number, title, text], index) => (
                <Reveal key={number} delay={index * 65}><div className="workflow-row"><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div><ArrowUpRight size={15} /></div></Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="modules-section page-width">
          <Reveal className="modules-heading">
            <div><p className="landing-kicker"><span /> TWO PURPOSE-BUILT WORKSPACES</p><h2>One platform.<br /><em>Two kinds of signals.</em></h2></div>
            <p>Use document search for records and citations. Use Predict Next for machine telemetry and maintenance analysis.</p>
          </Reveal>
          <div className="module-grid">
            <Reveal><Link href="/workspace" className="module-card module-docs">
              <div className="module-topline"><span>01 / ALG-AI-02</span><ArrowUpRight size={17} /></div>
              <div className="module-icon"><BookOpen size={19} /></div><h3>Document<br />Investigation</h3>
              <p>Ask across records. Follow citations, compare conflicting statements, and prepare a reviewable report.</p>
              <span className="module-link">Open investigation <ArrowRight size={15} /></span>
            </Link></Reveal>
            <Reveal delay={100}><Link href="/predict" className="module-card module-predict">
              <div className="module-topline"><span>02 / ALG-DATA-02</span><ArrowUpRight size={17} /></div>
              <div className="module-icon"><Activity size={19} /></div><h3>Predict what<br />happens next</h3>
              <p>Explore machine telemetry, examine failure-risk signals, and review validation metrics.</p>
              <span className="module-link">Explore Predict Next <ArrowRight size={15} /></span>
            </Link></Reveal>
          </div>
        </section>

        <section className="faq-section"><div className="page-width faq-layout">
          <Reveal className="faq-heading"><p className="landing-kicker"><span /> GOOD TO KNOW</p><h2>Questions<br /><em>before you begin?</em></h2><p>A quick guide to the evidence workspace.</p></Reveal>
          <div className="faq-list">{questions.map((item, index) => (
            <Reveal key={item.question} delay={index * 45}><article className="faq-item">
              <button type="button" aria-expanded={openQuestion === index} onClick={() => setOpenQuestion(openQuestion === index ? null : index)}>
                <span><small>0{index + 1}</small>{item.question}</span>{openQuestion === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openQuestion === index && <p>{item.answer}</p>}
            </article></Reveal>
          ))}</div>
        </div></section>
      </main>

      <footer className="landing-footer"><div className="page-width footer-inner">
        <Link href="/" className="landing-brand"><span className="landing-brand-mark"><Image src="/logo.png" alt="" width={28} height={28} /></span><span>Lumenote<small>Evidence in context</small></span></Link>
        <span className="footer-note">Evidence you can inspect.</span>
        <div className="footer-links"><Link href="/workspace">Investigation</Link><Link href="/predict">Predict Next</Link><Link href="/report">Reports</Link></div>
      </div></footer>
    </div>
  );
}
