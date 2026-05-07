import type { Category, Role, Track } from "./types"

interface RawRole {
  slug: string
  name: string
  shortDescription: string
  longDescription: string
  difficulty: Role["difficulty"]
  iconKey: Role["iconKey"]
  categories: Category[]
}

const _rawRoleData: RawRole[] = [
  {
    slug: "llm-engineer",
    name: "LLM Engineer",
    shortDescription: "Build, fine-tune, and deploy systems powered by large language models.",
    longDescription:
      "LLM engineers design, train, and ship systems built on top of large language models. The role spans foundations in deep learning, applied training techniques, and production-grade retrieval and evaluation pipelines.",
    difficulty: "Advanced",
    iconKey: "llm",
    categories: [
      {
        id: "foundations",
        name: "Foundations",
        description: "Mathematical and ML fundamentals every LLM engineer relies on daily.",
        skills: [
          {
            id: "python",
            name: "Python",
            description: "The dominant language across modern ML and LLM tooling.",
            whyItMatters:
              "Every major framework — PyTorch, Transformers, LangChain — is Python-first. Strong fluency unblocks everything else.",
            importance: "required",
            status: "completed",
            related: ["pytorch", "dataset-processing"],
          },
          {
            id: "linear-algebra",
            name: "Linear Algebra",
            description: "Vectors, matrices, eigenvalues — the language models speak.",
            whyItMatters:
              "Attention, embeddings, and gradient flow are linear algebra. Intuition here turns black boxes into glass boxes.",
            importance: "required",
            status: "learning",
          },
          {
            id: "neural-networks",
            name: "Neural Networks",
            description: "Forward pass, backprop, optimizers, and regularization.",
            whyItMatters:
              "Every transformer is a neural network at heart. Knowing the primitives lets you debug and modify them.",
            importance: "required",
            status: "learning",
            related: ["transformers"],
          },
          {
            id: "transformers",
            name: "Transformers",
            description: "Attention mechanism, positional encoding, and decoder-only architectures.",
            whyItMatters:
              "Transformers are the foundation of modern LLMs. Reading the paper and implementing one yourself is non-negotiable.",
            importance: "required",
            status: "not-started",
            related: ["neural-networks"],
          },
        ],
      },
      {
        id: "model-training",
        name: "Model Training",
        description: "Take a base model and adapt it to a domain, task, or behavior.",
        skills: [
          {
            id: "pytorch",
            name: "PyTorch",
            description: "Define, train, and debug neural networks at the tensor level.",
            whyItMatters: "Industry-standard framework for research and production. Required for any custom training.",
            importance: "required",
            status: "learning",
            related: ["python"],
          },
          {
            id: "fine-tuning",
            name: "Fine-Tuning",
            description: "LoRA, QLoRA, full-parameter fine-tuning, and instruction tuning.",
            whyItMatters: "Most production LLM work is adaptation, not pretraining. Knowing the trade-offs saves weeks.",
            importance: "required",
            status: "not-started",
          },
          {
            id: "dataset-processing",
            name: "Dataset Processing",
            description: "Cleaning, formatting, tokenization, and quality filtering.",
            whyItMatters:
              "Garbage in, garbage out. Dataset quality is usually the largest lever on final model performance.",
            importance: "important",
            status: "not-started",
          },
        ],
      },
      {
        id: "llm-systems",
        name: "LLM Systems",
        description: "Production patterns for serving LLMs to real users at scale.",
        skills: [
          {
            id: "rag",
            name: "RAG",
            description: "Retrieval-augmented generation: embeddings, chunking, and grounding.",
            whyItMatters:
              "The dominant pattern for shipping LLM features over private data. Almost every production app uses some form of RAG.",
            importance: "required",
            status: "not-started",
            related: ["vector-databases"],
          },
          {
            id: "vector-databases",
            name: "Vector Databases",
            description: "Pinecone, Qdrant, pgvector — store and query embeddings.",
            whyItMatters: "Without efficient nearest-neighbor lookup, retrieval doesn't scale.",
            importance: "important",
            status: "not-started",
            related: ["rag"],
          },
          {
            id: "evaluation-pipelines",
            name: "Evaluation Pipelines",
            description: "Build offline and online evals to measure model quality.",
            whyItMatters: "You can't improve what you don't measure. Evals are how you ship LLMs with confidence.",
            importance: "important",
            status: "not-started",
          },
          {
            id: "prompt-engineering",
            name: "Prompt Engineering",
            description: "Structured prompting, few-shot, and chain-of-thought techniques.",
            whyItMatters: "The cheapest, fastest lever on LLM behavior. Often outperforms fine-tuning for early MVPs.",
            importance: "optional",
            status: "completed",
          },
        ],
      },
    ],
  },
  {
    slug: "backend-engineer",
    name: "Backend Engineer",
    shortDescription: "Design and operate the servers, APIs, and data layers that power products.",
    longDescription:
      "Backend engineers build the systems behind every product: APIs, databases, queues, and the infrastructure that keeps them reliable.",
    difficulty: "Intermediate",
    iconKey: "backend",
    categories: [
      {
        id: "languages-fundamentals",
        name: "Languages & Fundamentals",
        skills: [
          {
            id: "data-structures",
            name: "Data Structures & Algorithms",
            description: "Hash maps, trees, graphs, and complexity analysis.",
            whyItMatters: "The vocabulary for reasoning about performance and correctness.",
            importance: "required",
            status: "completed",
          },
          {
            id: "go",
            name: "Go or TypeScript",
            description: "A modern, statically typed backend language.",
            whyItMatters: "Most modern backends ship in Go, TypeScript, Rust, or Java. Pick one and go deep.",
            importance: "required",
            status: "learning",
          },
          {
            id: "concurrency",
            name: "Concurrency",
            description: "Threads, goroutines, async/await, and race conditions.",
            whyItMatters: "Servers handle thousands of requests at once. Concurrency bugs are the hardest bugs.",
            importance: "important",
            status: "not-started",
          },
        ],
      },
      {
        id: "apis-data",
        name: "APIs & Data",
        skills: [
          {
            id: "rest-grpc",
            name: "REST & gRPC",
            description: "Design idiomatic APIs and choose the right protocol.",
            whyItMatters: "APIs are the contract between systems. Bad APIs are nearly impossible to migrate away from.",
            importance: "required",
            status: "learning",
          },
          {
            id: "sql",
            name: "SQL & Relational Modeling",
            description: "Joins, indexes, transactions, and normalization.",
            whyItMatters: "Postgres still runs the internet. Strong SQL beats most ORM tricks.",
            importance: "required",
            status: "completed",
          },
          {
            id: "caching",
            name: "Caching",
            description: "Redis, CDNs, and cache invalidation strategies.",
            whyItMatters: "The fastest way to make slow systems fast — and the source of subtle bugs.",
            importance: "important",
            status: "not-started",
          },
          {
            id: "queues",
            name: "Message Queues",
            description: "SQS, Kafka, RabbitMQ — decouple producers from consumers.",
            whyItMatters: "Async workflows, retries, and resilience all flow from queues.",
            importance: "optional",
            status: "not-started",
          },
        ],
      },
      {
        id: "operations",
        name: "Operations",
        skills: [
          {
            id: "observability",
            name: "Observability",
            description: "Logs, metrics, traces, and SLOs.",
            whyItMatters: "Production systems fail. Observability is how you find out before users do.",
            importance: "required",
            status: "not-started",
          },
          {
            id: "deployment",
            name: "Deployment & CI/CD",
            description: "Containerize, ship, and roll back safely.",
            whyItMatters: "Slow or risky deploys are the silent killer of engineering velocity.",
            importance: "important",
            status: "learning",
          },
        ],
      },
    ],
  },
  {
    slug: "frontend-engineer",
    name: "Frontend Engineer",
    shortDescription: "Craft fast, accessible, and elegant interfaces on the modern web.",
    longDescription:
      "Frontend engineers turn product ideas into polished, performant interfaces — balancing design fidelity, accessibility, and bundle size.",
    difficulty: "Intermediate",
    iconKey: "frontend",
    categories: [
      {
        id: "core-web",
        name: "Core Web",
        skills: [
          {
            id: "html-css",
            name: "HTML & CSS",
            description: "Semantic markup, modern layout, and CSS variables.",
            whyItMatters: "The platform underneath every framework. Strong fundamentals keep you out of frameworks' way.",
            importance: "required",
            status: "completed",
          },
          {
            id: "javascript",
            name: "JavaScript",
            description: "Closures, async, modules, and the event loop.",
            whyItMatters: "All frameworks compile down to JavaScript. Knowing the language separates seniors from juniors.",
            importance: "required",
            status: "completed",
          },
          {
            id: "typescript",
            name: "TypeScript",
            description: "Static types, generics, and inference.",
            whyItMatters: "Catches bugs at the speed of thought. Now table stakes in production frontend.",
            importance: "required",
            status: "learning",
          },
          {
            id: "accessibility",
            name: "Accessibility",
            description: "ARIA, keyboard navigation, and screen reader support.",
            whyItMatters: "Inaccessible UIs exclude users and create legal risk. It's also good engineering.",
            importance: "important",
            status: "not-started",
          },
        ],
      },
      {
        id: "frameworks",
        name: "Frameworks",
        skills: [
          {
            id: "react",
            name: "React",
            description: "Components, hooks, and the rendering model.",
            whyItMatters: "Dominant frontend library. Most modern frameworks build on top of it.",
            importance: "required",
            status: "learning",
          },
          {
            id: "next-js",
            name: "Next.js",
            description: "App Router, server components, and edge rendering.",
            whyItMatters: "The default for production React apps. Bridges frontend and backend cleanly.",
            importance: "important",
            status: "learning",
          },
          {
            id: "state-management",
            name: "State Management",
            description: "URL state, server state, and client state — and when to use each.",
            whyItMatters: "Most frontend bugs are state bugs. Picking the right primitive avoids most of them.",
            importance: "important",
            status: "not-started",
          },
        ],
      },
      {
        id: "performance",
        name: "Performance & Tooling",
        skills: [
          {
            id: "core-web-vitals",
            name: "Core Web Vitals",
            description: "LCP, INP, CLS — the metrics that matter for users and SEO.",
            whyItMatters: "Slow UIs lose users and rankings. Performance is a feature.",
            importance: "important",
            status: "not-started",
          },
          {
            id: "build-tools",
            name: "Build Tools",
            description: "Turbopack, Vite, and bundler internals.",
            whyItMatters: "Knowing how code becomes a bundle makes you faster at debugging and optimizing.",
            importance: "optional",
            status: "not-started",
          },
        ],
      },
    ],
  },
  {
    slug: "devops-engineer",
    name: "DevOps Engineer",
    shortDescription: "Automate infrastructure, deployments, and reliability for engineering teams.",
    longDescription:
      "DevOps engineers connect code to production: provisioning infrastructure, automating pipelines, and keeping systems observable and reliable.",
    difficulty: "Advanced",
    iconKey: "devops",
    categories: [
      {
        id: "linux-networking",
        name: "Linux & Networking",
        skills: [
          {
            id: "linux",
            name: "Linux",
            description: "Filesystem, processes, systemd, and the shell.",
            whyItMatters: "Every server you'll ever touch runs Linux. The shell is the interface to production.",
            importance: "required",
            status: "learning",
          },
          {
            id: "networking",
            name: "Networking",
            description: "TCP/IP, DNS, HTTP, and TLS.",
            whyItMatters: "When systems break, the network is usually involved. Fundamentals close the gap fast.",
            importance: "required",
            status: "not-started",
          },
        ],
      },
      {
        id: "infra",
        name: "Infrastructure",
        skills: [
          {
            id: "docker",
            name: "Docker",
            description: "Container images, Dockerfiles, and image layers.",
            whyItMatters: "The unit of deployment for nearly all modern apps.",
            importance: "required",
            status: "completed",
          },
          {
            id: "kubernetes",
            name: "Kubernetes",
            description: "Pods, services, deployments, and operators.",
            whyItMatters: "Industry-standard orchestrator. Required at most companies past startup scale.",
            importance: "important",
            status: "not-started",
          },
          {
            id: "terraform",
            name: "Terraform",
            description: "Infrastructure as code across cloud providers.",
            whyItMatters: "Click-ops doesn't scale. IaC is how serious teams manage infra.",
            importance: "important",
            status: "learning",
          },
        ],
      },
      {
        id: "reliability",
        name: "Reliability",
        skills: [
          {
            id: "ci-cd",
            name: "CI/CD",
            description: "Pipelines, artifacts, and progressive delivery.",
            whyItMatters: "Fast, safe deploys are the foundation of modern engineering velocity.",
            importance: "required",
            status: "not-started",
          },
          {
            id: "monitoring",
            name: "Monitoring & Alerting",
            description: "Prometheus, Grafana, and on-call hygiene.",
            whyItMatters: "You can't operate what you can't see. Good alerts protect both users and engineers.",
            importance: "important",
            status: "not-started",
          },
          {
            id: "incident-response",
            name: "Incident Response",
            description: "Postmortems, runbooks, and blameless culture.",
            whyItMatters: "Systems fail. How a team responds determines whether they improve or stagnate.",
            importance: "optional",
            status: "not-started",
          },
        ],
      },
    ],
  },
  {
    slug: "computer-vision-engineer",
    name: "Computer Vision Engineer",
    shortDescription: "Build systems that see — from classification to detection to 3D reconstruction.",
    longDescription:
      "Computer vision engineers train and deploy models that interpret images and video — for autonomy, medical imaging, robotics, and beyond.",
    difficulty: "Advanced",
    iconKey: "cv",
    categories: [
      {
        id: "math-foundations",
        name: "Math Foundations",
        skills: [
          {
            id: "linear-algebra-cv",
            name: "Linear Algebra",
            description: "Transforms, projections, and matrix decompositions.",
            whyItMatters: "Vision is geometry. Linear algebra is the language of geometry.",
            importance: "required",
            status: "learning",
          },
          {
            id: "probability",
            name: "Probability & Statistics",
            description: "Distributions, Bayes, and uncertainty estimation.",
            whyItMatters: "Vision models are probabilistic. Uncertainty is often more useful than the prediction.",
            importance: "required",
            status: "not-started",
          },
        ],
      },
      {
        id: "classical-cv",
        name: "Classical CV",
        skills: [
          {
            id: "image-processing",
            name: "Image Processing",
            description: "Filtering, edges, color spaces, and morphology.",
            whyItMatters: "Classical techniques remain the right tool for many problems — and they're fast.",
            importance: "required",
            status: "completed",
          },
          {
            id: "opencv",
            name: "OpenCV",
            description: "The standard library for classical vision pipelines.",
            whyItMatters: "Decades of battle-tested implementations. Every CV engineer ends up here.",
            importance: "important",
            status: "learning",
          },
        ],
      },
      {
        id: "deep-vision",
        name: "Deep Vision",
        skills: [
          {
            id: "cnns",
            name: "CNNs",
            description: "Convolutions, pooling, and architectures like ResNet.",
            whyItMatters: "Still the workhorse for many production vision systems.",
            importance: "required",
            status: "learning",
          },
          {
            id: "vits",
            name: "Vision Transformers",
            description: "Patch embeddings and attention applied to images.",
            whyItMatters: "State-of-the-art across many vision benchmarks. Increasingly common in production.",
            importance: "important",
            status: "not-started",
          },
          {
            id: "detection-segmentation",
            name: "Detection & Segmentation",
            description: "YOLO, Mask R-CNN, and SAM.",
            whyItMatters: "Most real CV products are detection or segmentation, not classification.",
            importance: "important",
            status: "not-started",
          },
          {
            id: "deployment-edge",
            name: "Edge Deployment",
            description: "ONNX, TensorRT, and quantization.",
            whyItMatters: "Vision models often run on phones, cameras, or robots. Edge deployment is its own craft.",
            importance: "optional",
            status: "not-started",
          },
        ],
      },
    ],
  },
]

/** Wraps each seed role's categories into a single default Track. */
function toRole(raw: RawRole): Role {
  const trackId = `track_${raw.slug}_default`
  const defaultTrack: Track = {
    id: trackId,
    name: "Default Track",
    description: "The standard, opinionated path for this role. Duplicate it to customize.",
    isDefault: true,
    categories: raw.categories,
  }
  return {
    slug: raw.slug,
    name: raw.name,
    shortDescription: raw.shortDescription,
    longDescription: raw.longDescription,
    difficulty: raw.difficulty,
    iconKey: raw.iconKey,
    tracks: [defaultTrack],
    activeTrackId: trackId,
    isDefault: true,
  }
}

export const seedRoles: Role[] = _rawRoleData.map(toRole)

export function getActiveTrack(role: Role): Track {
  return role.tracks.find((t) => t.id === role.activeTrackId) ?? role.tracks[0]
}

export function countTrackSkills(track: Track) {
  return track.categories.reduce((sum, c) => sum + c.skills.length, 0)
}
