import { DossierData, SpacingSettings } from "./types.ts";

export const DEFAULT_SPACING: SpacingSettings = {
  sheetPaddingY: 44,
  sheetPaddingX: 52,
  sectionGap: 28,
  paragraphGap: 18,
  customGaps: {},
};

export const DEFAULT_DATA: DossierData = {
  visibility: {
    headerKicker: true,
    targetCard: true,
    availabilityBadge: true,
    recipientBlock: true,
    metrics: true,
    taxonomy: true,
    signoffMeta: true,
    footerStamp: true,
  },
  spacing: { ...DEFAULT_SPACING },
  typographyStyle: "editorial",
  applicant: {
    name: "Alex Mercer",
    title: "Technical Artist & Environment TD",
    location: "Seattle, WA (Open to Remote & Relocation)",
    phone: "+1 (555) 019-2834",
    email: "alex.mercer.td@example.com",
    artstation: "artstation.com/alexmercer-td",
    website: "portfolio.example.com",
    qrUrl: "portfolio.example.com",
    dossierKicker: "Candidate Dossier / Technical Art & Systems TD",
  },
  target: {
    recipientTitle: "Lead Technical Director & Systems Team",
    studio: "EA SPORTS FC",
    role: "Senior Technical Artist",
    department: "Core Engine, Lighting & Pipelines",
    date: "September 2026",
    location: "Remote / Hybrid · Relocation",
    availability: "Immediate Availability · 0-Day Notice",
    cardHeaderLabel: "Target Requisition",
    cardBadgeLabel: "CONFIDENTIAL",
    statusLabel: "Target Studio",
    dateLabel: "Date of Record",
    attentionLabel: "Attention / Addressee",
    departmentLabel: "Division & Track",
    locationLabel: "Mobility & Notice",
    studioLabel: "Target Studio",
  },
  letter: {
    sectionNumber: "01.",
    sectionTitle: "Statement of Intent",
    sectionSubtitle: "Technical Manifesto & Systems Approach",
    salutation: "Dear Technical Directors & Systems Leads,",
    paragraphs: [
      {
        content:
          "I build the bridges between artistic vision and low-level rendering architecture. When environments scale into massive 100+ acre territories, standard DCC pipelines collapse under GPU draw-call spikes, memory fragmentation, and authoring bottlenecks. My engineering discipline centers on solving that exact friction: authoring custom HLSL compute kernels, procedural PCG world generation graphs, and headless Python automation toolchains that push visual fidelity to its absolute limit while strictly protecting sub-millisecond frametime budgets.",
      },
      {
        content:
          "In my recent production roles and through extensive systems R&D—including the 170-acre [Project Aetheria](https://portfolio.example.com) in Unreal Engine 5.4—I engineered an end-to-end procedural environment architecture. I built a 10-stage sequential PCG spline framework, instance-space 3D noise vertex displacement shaders with distance-based instruction-cost culling, and step-quantized alpha Material ID packing that eliminated over 1,000 draw calls per frame across dense Nanite foliage clusters. These systems proved that uncompromising performance constraints can actively catalyze cinematic fidelity.",
      },
      {
        content:
          "EA SPORTS FC operates at the frontier of real-time photorealism, dynamic lighting, and stadium-scale density. As your **Senior Technical Artist**, I will bring deep technical rigor to eliminate production choke points between environment artists and the core rendering engine. Whether constructing custom Houdini digital assets (HDAs) for procedural world assembly, authoring Substrate multi-slab layered materials, or developing PySide6 DCC asset dispatchers, I am ready to deliver immediate impact to your pipelines.",
      },
    ],
  },
  metricsHeader: {
    sectionNumber: "02.",
    title: "Verified Benchmarks & Quantitative Impact",
    subtitle: "Sub-Millisecond Profiling",
  },
  metrics: [
    {
      kicker: "Draw-Call Optimization",
      val: ">1,000",
      label: "Draw Calls Cut per Frame",
      narrative:
        "Eliminated over 1,000 draw calls across dense Nanite foliage clusters through step-quantized alpha Material ID packing and instance-space HLSL culling.",
      contextTag: "Target: Sub-0.4ms Frame Budget",
    },
    {
      kicker: "Pipeline Automation",
      val: "155s",
      label: "12-Kit Automated Asset Bake",
      narrative:
        "Engineered modular Python CLI dispatchers with headless Substance Automation, reducing manual DCC asset prep from 3+ hours to under 3 minutes.",
      contextTag: "Headless SAT Dispatcher",
    },
    {
      kicker: "Procedural Worldbuilding",
      val: "170+ ac",
      label: "Deterministic UE5 PCG Territory",
      narrative:
        "Architected a 10-stage spline PCG network in UE5.4 with procedural heightfield erosion passes and zero-gap modular masonry snapping.",
      contextTag: "UE5.4 PCG Core Architecture",
    },
  ],
  taxonomyHeader: {
    sectionNumber: "03.",
    title: "Core Systems & Technical Competencies",
    subtitle: "Engine Architecture",
  },
  taxonomy: [
    {
      title: "Shading & GPU Core",
      categoryTag: "Rendering",
      items: [
        {
          name: "HLSL Compute Kernels",
          detail: "SIMD culling, noise synthesis & runtime vertex displacement",
        },
        {
          name: "Substrate Multi-Slab Networks",
          detail: "Layered material architecture & distance-based instruction LODs",
        },
        {
          name: "GPU Frametime Telemetry",
          detail: "RenderDoc & Unreal Insights draw-budget profiling",
        },
      ],
    },
    {
      title: "Procedural & Engine Systems",
      categoryTag: "World Assembly",
      items: [
        {
          name: "Unreal Engine 5.4+ PCG",
          detail: "10-stage spline networks, hierarchical generation & Nanite streaming",
        },
        {
          name: "Houdini 20+ Digital Assets",
          detail: "Procedural masonry HDAs, modular snapping & automated PDG cooks",
        },
        {
          name: "Terrain & Heightfield Systems",
          detail: "Gaea erosion heightfields & deterministic runtime scattering",
        },
      ],
    },
    {
      title: "Pipelines & Toolchains",
      categoryTag: "Automation",
      items: [
        {
          name: "Python 3 & PySide6 Tooling",
          detail: "DCC asset dispatchers, headless automation & custom artist GUIs",
        },
        {
          name: "Substance Automation Toolkit",
          detail: "Headless SAT batch texture packing & material ingestion",
        },
        {
          name: "OpenUSD & Studio Perforce",
          detail: "Multi-branch asset pipeline versioning & collaborative staging",
        },
      ],
    },
  ],
  signoff: {
    valediction: "Respectfully submitted,",
    name: "Alex Mercer",
    roleTitle: "Technical Artist & Systems TD",
  },
  signoffMeta: {
    recordBadge: "Master Application Record",
    portfolioLabel: "Live Portfolio:",
    directChannelLabel: "Direct Channel:",
    footerSpecNote: "Verified Systems Spec",
    footerPageNote: "Calibrated A4 Single-Sheet Layout",
  },
};
