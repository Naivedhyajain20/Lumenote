"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDown, ArrowRight, ArrowUpRight, Activity, BookOpen, Check,
  ChevronDown, ChevronUp, FileSearch, GitCompareArrows, ScanEye,
  ShieldQuestion, Waypoints,
} from "lucide-react";
import Reveal from "@/components/Reveal";

const capabilities = [
  {
    number: "01",
    Icon: FileSearch,
    title: "Follow the source",
    text: "Move from an answer to the document passage behind it. Keep the source close while you investigate.",
  },
  {
    number: "02",
    Icon: GitCompareArrows,
    title: "Compare the details",
    text: "Bring different dates, amounts, or statements into view together and review the original records.",
  },
  {
    number: "03",
    Icon: ShieldQuestion,
    title: "See what is uncertain",
    text: "When the available evidence is weak or incomplete, that uncertainty stays visible in the workspace.",
  },
];

const questions = [
  { question: "What files can I add?", answer: "The workspace accepts PDF, DOCX, TXT, Markdown, JPG, PNG, and TIFF files. Scanned images can be processed through OCR." },
  { question: "How do citations work?", answer: "Answers can include citations to retrieved passages. Select a citation to open the corresponding document page and inspect the source text." },
  { question: "What happens when records disagree?", answer: "Detected conflicts are shown alongside their source records so you can compare the values and review the original evidence." },
  { question: "Can I work with machine telemetry too?", answer: "Yes. Predict Next is a separate workspace for machine telemetry, validation cases, and predictive maintenance metrics." },
];

function EvidenceOrbit() {
  return (
    <div className="orbit-scene" aria-label="Illustration of connected evidence sources">
      <svg className="orbit-art" viewBox="0 0 1000 500" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="orbit-glow"><stop stopColor="#8E83F2" stopOpacity=".2" /><stop offset="1" stopColor="#8E83F2" stopOpacity="0" /></radialGradient>
          <linearGradient id="orbit-stroke" x1="170" y1="120" x2="840" y2="380"><stop stopColor="#9C92F4" stopOpacity=".08" /><stop offset=".5" stopColor="#897CEC" stopOpacity=".42" /><stop offset="1" stopColor="#6E64D6" stopOpacity=".1" /></linearGradient>
        </defs>
        <ellipse cx="500" cy="250" rx="306" ry="215" fill="url(#orbit-glow)" />
        <circle cx="500" cy="244" r="178" stroke="url(#orbit-stroke)" />
        <circle cx="500" cy="244" r="221" stroke="#9B91EB" strokeOpacity=".18" strokeDasharray="2 8" />
        <ellipse cx="500" cy="244" rx="430" ry="68" transform="rotate(-8 500 244)" stroke="#8980E7" strokeOpacity=".28" />
        <ellipse cx="500" cy="244" rx="345" ry="118" transform="rotate(24 500 244)" stroke="#8980E7" strokeOpacity=".18" />
        <ellipse cx="500" cy="244" rx="345" ry="118" transform="rotate(-24 500 244)" stroke="#8980E7" strokeOpacity=".15" />
        <path d="M375 132 485 104 588 148 643 236 574 340 479 384 377 329 344 229 375 132Z" stroke="#756BDD" strokeOpacity=".3" />
        <path d="m375 132 104 252m6-280-6 280m109-236L377 329m266-93L375 132m199 208L485 104m-141 125 268 7" stroke="#756BDD" strokeOpacity=".18" />
        <path d="m375 132 213 16M344 229l230 111m69-104L377 329m-33-100 277 7" stroke="#B0A9FB" strokeOpacity=".32" strokeDasharray="3 7" />
        {[[375,132],[485,104],[588,148],[643,236],[574,340],[479,384],[377,329],[344,229],[500,244],[438,190],[548,290]].map(([cx,cy],i)=>(
          <g key={`${cx}-${cy}`}><circle cx={cx} cy={cy} r={i===8?7:4} fill={i===8?"#8177E7":"#B6B0F5"} fillOpacity={i===8?".9":".7"} /><circle cx={cx} cy={cy} r={i===8?16:10} stroke="#9187EF" strokeOpacity={i===8?".27":".13"} /></g>
        ))}
      </svg>
      <div className="orbit-card orbit-card-source"><span className="orbit-card-label"><i /> SOURCE LINKED</span><strong>Evidence excerpt</strong><span className="orbit-card-rule" /></div>
      <div className="orbit-card orbit-card-citation"><span className="orbit-card-label"><i /> CITATION</span><strong>Page &amp; passage</strong></div>
      <div className="orbit-card orbit-card-review"><span className="orbit-card-label"><i /> REVIEW</span><strong>Compare records</strong></div>
      <div className="orbit-center-mark"><Waypoints size={21} strokeWidth={1.5} /></div>
    </div>
  );
}

function LandingHeader() {
  return (
    <header className="landing-header page-width">
      <Link href="/" className="landing-brand" aria-label="Lumenote home">
        <span className="landing-brand-mark"><Waypoints size={19} strokeWidth={1.8} /></span>
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

export default function LandingPage() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <LandingHeader />
        <div className="hero-wrap page-width">
          <EvidenceOrbit />
          <div className="hero-copy">
            <p className="landing-kicker"><span />DOCUMENT INTELLIGENCE <b>·</b> PREDICTIVE MAINTENANCE</p>
            <h1>Evidence<br /><em>in context.</em></h1>
            <p className="landing-lede">Bring scattered records into one place. Follow citations, compare details, and make the next decision with the source still in view.</p>
            <div className="landing-actions">
              <Link href="/workspace" className="landing-primary">Open investigation <span><ArrowRight size={16} /></span></Link>
              <Link href="/predict" className="landing-text-link">Explore Predict Next <ArrowUpRight size={15} /></Link>
            </div>
            <div className="landing-trust"><span><Check size={14} /> Source-linked answers</span><span><Check size={14} /> Conflicts in context</span></div>
          </div>
          <a href="#platform" className="landing-scroll"><span>Scroll to explore</span><ArrowDown size={15} /></a>
          <span className="hero-coordinate" aria-hidden="true">LUMENOTE / 01</span>
        </div>
      </div>

      <main>
        <section id="platform" className="landing-section page-width">
          <Reveal className="section-heading">
            <p className="landing-kicker"><span />A CLEARER WAY TO INVESTIGATE</p>
            <h2>Stay close to<br /><em>what the record says.</em></h2>
            <p>Documents rarely tell one perfectly consistent story. Lumenote helps you inspect sources, compare accounts, and keep open questions in view.</p>
          </Reveal>
          <div className="capability-grid">
            {capabilities.map(({ number, Icon, title, text }, index) => (
              <Reveal key={number} delay={index * 90}>
                <article className="capability-card">
                  <div className="capability-head"><span>{number} / 03</span><Icon size={19} strokeWidth={1.6} /></div>
                  <h3>{title}</h3><p>{text}</p>
                  <span className="capability-corner" aria-hidden="true">↗</span>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="workflow-section">
          <div className="page-width workflow-layout">
            <Reveal className="workflow-intro">
              <p className="landing-kicker"><span />ONE CONNECTED WORKFLOW</p>
              <h2>From source<br />to <em>next step.</em></h2>
              <p>Every stage keeps the underlying evidence within reach, so you can make a careful review without losing context.</p>
              <Link href="/workspace" className="landing-text-link">See the investigation workspace <ArrowRight size={15} /></Link>
            </Reveal>
            <div className="workflow-list">
              {[
                ["01", "Gather", "Add the documents and records that matter."],
                ["02", "Connect", "Search across the corpus and follow references."],
                ["03", "Compare", "Review disagreements against the original sources."],
                ["04", "Synthesize", "Prepare a report for careful human review."],
              ].map(([number, title, text], index) => (
                <Reveal key={number} delay={index * 65}>
                  <div className="workflow-row"><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div><ArrowUpRight size={15} /></div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="modules-section page-width">
          <Reveal className="modules-heading">
            <div><p className="landing-kicker"><span />TWO FOCUSED WORKSPACES</p><h2>One considered<br /><em>way to see more.</em></h2></div>
            <p>Document investigation and predictive maintenance, each designed around the evidence it uses.</p>
          </Reveal>
          <div className="module-grid">
            <Reveal><Link href="/workspace" className="module-card module-docs">
              <div className="module-topline"><span>01 / ALG-AI-02</span><ArrowUpRight size={17} /></div>
              <div className="module-icon"><BookOpen size={19} /></div>
              <h3>Document<br />Investigation</h3>
              <p>Ask across multiple records. Follow citations, compare conflicting statements, and prepare a reviewable report.</p>
              <span className="module-link">Open investigation <ArrowRight size={15} /></span>
            </Link></Reveal>
            <Reveal delay={100}><Link href="/predict" className="module-card module-predict">
              <div className="module-topline"><span>02 / ALG-DATA-02</span><ArrowUpRight size={17} /></div>
              <div className="module-icon"><Activity size={19} /></div>
              <h3>Predict what<br />happens next</h3>
              <p>Explore machine telemetry, examine failure-risk signals, and review validation metrics.</p>
              <span className="module-link">Explore Predict Next <ArrowRight size={15} /></span>
            </Link></Reveal>
          </div>
        </section>

        <section className="faq-section">
          <div className="page-width faq-layout">
            <Reveal className="faq-heading"><p className="landing-kicker"><span />GOOD TO KNOW</p><h2>Questions<br /><em>before you begin?</em></h2><p>What to expect from the evidence workspace.</p><ScanEye className="faq-watermark" strokeWidth={0.8} /></Reveal>
            <div className="faq-list">{questions.map((item, index) => (
              <Reveal key={item.question} delay={index * 45}><article className={`faq-item ${openQuestion === index ? "faq-open" : ""}`}>
                <button type="button" aria-expanded={openQuestion === index} onClick={() => setOpenQuestion(openQuestion === index ? null : index)}>
                  <span><small>0{index + 1}</small>{item.question}</span>{openQuestion === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {openQuestion === index && <p>{item.answer}</p>}
              </article></Reveal>
            ))}</div>
          </div>
        </section>
      </main>

      <footer className="landing-footer"><div className="page-width footer-inner">
        <Link href="/" className="landing-brand"><span className="landing-brand-mark"><Waypoints size={18} /></span><span>Lumenote<small>Evidence in context</small></span></Link>
        <span className="footer-note">Make the record easier to read.</span>
        <div className="footer-links"><Link href="/workspace">Investigation</Link><Link href="/predict">Predict Next</Link><Link href="/report">Reports</Link></div>
      </div></footer>
    </div>
  );
}
