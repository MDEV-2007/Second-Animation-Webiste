// THE WORLD OF CODE — the atlas.
// One entry per destination. `palette` drives sky + fog blending between worlds,
// `cam` gives each world a subtle, distinct camera mood. Colors are [r,g,b] 0..1
// helpers below convert from hex for readability.

function hex(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export const WORLDS = [
  {
    id: 'birth', name: 'The Birth of Code', discipline: 'Genesis',
    tags: ['terminal', 'compile', 'ignition'],
    palette: { top: hex('#05060a'), bottom: hex('#12172b'), sun: hex('#ff8a3d'), sunDir: [0.1, -0.05, -1], sunInt: 1.4, fog: hex('#0a0f1e') },
    cam: { x: 0, y: 1.5, lookY: 1.2, fov: 55 }, rich: true,
  },
  {
    id: 'japan', name: 'The Sakura of Frontend', discipline: 'Frontend Engineering',
    tags: ['React', 'Next.js', 'TypeScript', 'Tailwind', 'Three.js'],
    palette: { top: hex('#f7a8c8'), bottom: hex('#ffd7a6'), sun: hex('#ff8ab8'), sunDir: [0.35, 0.12, -1], sunInt: 0.95, fog: hex('#f0bfa8') },
    cam: { x: -1.5, y: 2.4, lookY: 2.0, fov: 58 }, rich: true,
  },
  {
    id: 'greatwall', name: 'The Great Wall of Algorithms', discipline: 'Data Structures & Algorithms',
    tags: ['sorting', 'graphs', 'trees', 'pathfinding', 'DP'],
    palette: { top: hex('#a8bcd4'), bottom: hex('#dcc49a'), sun: hex('#f5c877'), sunDir: [-0.4, 0.15, -1], sunInt: 0.9, fog: hex('#c9b795') },
    // skim just above the walkway so the wall recedes beneath us
    cam: { x: 0, y: 6.0, lookY: 3.0, fov: 62 }, rich: true,
  },
  {
    id: 'bamboo', name: 'The Bamboo Forest of Clean Code', discipline: 'Architecture & Craft',
    tags: ['SOLID', 'DDD', 'design patterns', 'DI', 'clean code'],
    palette: { top: hex('#b9dcac'), bottom: hex('#28402a'), sun: hex('#e9ffdf'), sunDir: [0.2, 0.5, -1], sunInt: 0.9, fog: hex('#4a6b4a') },
    cam: { x: 0, y: 2.2, lookY: 3.2, fov: 52 }, rich: true,
  },
  {
    id: 'egypt', name: 'The Pyramids of Databases', discipline: 'Databases & Persistence',
    tags: ['PostgreSQL', 'SQL', 'indexes', 'Redis', 'transactions'],
    palette: { top: hex('#eabc63'), bottom: hex('#c26f28'), sun: hex('#ffe9a8'), sunDir: [-0.3, 0.1, -1], sunInt: 1.0, fog: hex('#cf8f47') },
    cam: { x: -1.0, y: 3.0, lookY: 2.4, fov: 60 }, rich: true,
  },
  {
    id: 'petra', name: 'The Backend Kingdom', discipline: 'Backend Engineering',
    tags: ['Django', 'FastAPI', 'REST', 'JWT', 'microservices'],
    palette: { top: hex('#e7b48f'), bottom: hex('#8a4a33'), sun: hex('#ffcf9e'), sunDir: [0.3, 0.05, -1], sunInt: 1.0, fog: hex('#b06a4a') },
    cam: { x: 1.4, y: 2.2, lookY: 2.4, fov: 58 },
  },
  {
    id: 'amazon', name: 'The Amazon of AI', discipline: 'Machine Learning & AI',
    tags: ['PyTorch', 'TensorFlow', 'neural nets', 'LLMs', 'CV'],
    palette: { top: hex('#7fdca0'), bottom: hex('#0f3a24'), sun: hex('#d8ffb0'), sunDir: [0.1, 0.4, -1], sunInt: 0.85, fog: hex('#1c5c3a') },
    cam: { x: 0, y: 2.4, lookY: 3.0, fov: 55 },
  },
  {
    id: 'ocean', name: 'The Ocean of APIs', discipline: 'API Design',
    tags: ['REST', 'GraphQL', 'WebSockets', 'JSON', 'gRPC'],
    palette: { top: hex('#7ec8e3'), bottom: hex('#0a3a6b'), sun: hex('#cdefff'), sunDir: [-0.2, 0.3, -1], sunInt: 1.0, fog: hex('#155f9a') },
    cam: { x: 0, y: 1.8, lookY: 1.6, fov: 60 },
  },
  {
    id: 'redwood', name: 'The Redwood Forest of Open Source', discipline: 'Open Source',
    tags: ['Git', 'GitHub', 'commits', 'PRs', 'community'],
    palette: { top: hex('#d9a86a'), bottom: hex('#3a2416'), sun: hex('#ffdca0'), sunDir: [0.2, 0.6, -1], sunInt: 0.8, fog: hex('#6b4a2a') },
    cam: { x: 0, y: 3.4, lookY: 5.0, fov: 50 },
  },
  {
    id: 'alps', name: 'The Alps of System Design', discipline: 'System Design',
    tags: ['scalability', 'load balancing', 'Kubernetes', 'caching', 'CAP'],
    palette: { top: hex('#6ea3d8'), bottom: hex('#c4d9ec'), sun: hex('#f2f8ff'), sunDir: [0.3, 0.2, -1], sunInt: 0.85, fog: hex('#a8c4dd') },
    cam: { x: -2.0, y: 4.0, lookY: 3.0, fov: 64 },
  },
  {
    id: 'aurora', name: 'The Northern Lights of Cloud', discipline: 'Cloud & DevOps',
    tags: ['AWS', 'Docker', 'Kubernetes', 'serverless', 'CI/CD'],
    palette: { top: hex('#071033'), bottom: hex('#0d1f4a'), sun: hex('#57ffc2'), sunDir: [0.0, 0.7, -1], sunInt: 0.34, fog: hex('#0a1836') },
    cam: { x: 0, y: 3.0, lookY: 6.0, fov: 62 },
  },
  {
    id: 'canyon', name: 'The Grand Canyon of Debugging', discipline: 'Debugging & Reliability',
    tags: ['stack traces', 'logs', 'profiling', 'root cause', 'healing'],
    palette: { top: hex('#f2c48a'), bottom: hex('#8a3a24'), sun: hex('#ffd9a0'), sunDir: [-0.4, 0.1, -1], sunInt: 1.1, fog: hex('#b5573a') },
    cam: { x: 1.6, y: 2.0, lookY: 1.4, fov: 66 },
  },
  {
    id: 'niagara', name: 'The Falls of Data Flow', discipline: 'Data Streaming',
    tags: ['Kafka', 'RabbitMQ', 'Redis streams', 'event queues', 'ETL'],
    palette: { top: hex('#a8dced'), bottom: hex('#1c6a8a'), sun: hex('#e6faff'), sunDir: [0.1, 0.3, -1], sunInt: 1.0, fog: hex('#2f8aad') },
    cam: { x: 0, y: 2.6, lookY: 1.2, fov: 58 },
  },
  {
    id: 'reef', name: 'The Reef of Real-Time', discipline: 'Real-Time Systems',
    tags: ['WebSockets', 'live chat', 'presence', 'notifications', 'dashboards'],
    palette: { top: hex('#5fe0d0'), bottom: hex('#0a5a5a'), sun: hex('#d0fff5'), sunDir: [0.2, 0.4, -1], sunInt: 0.95, fog: hex('#149a90') },
    cam: { x: 0, y: 1.6, lookY: 1.5, fov: 60 },
  },
  {
    id: 'machu', name: 'Machu Picchu of Problem Solving', discipline: 'Problem Solving',
    tags: ['logic', 'puzzles', 'invariants', 'proofs', 'grit'],
    palette: { top: hex('#bfe0c4'), bottom: hex('#4a6b4a'), sun: hex('#f0ffe6'), sunDir: [-0.2, 0.35, -1], sunInt: 1.0, fog: hex('#6a8f6a') },
    cam: { x: -1.4, y: 3.2, lookY: 2.6, fov: 60 },
  },
  {
    id: 'cyberpunk', name: 'The Cyberpunk City', discipline: 'Product & Craft at Scale',
    tags: ['UX', 'neon', 'holograms', 'motion', 'polish'],
    palette: { top: hex('#12052a'), bottom: hex('#05060a'), sun: hex('#c41fa8'), sunDir: [0.85, 0.3, -1], sunInt: 0.13, fog: hex('#0d0620') },
    cam: { x: 0, y: 2.0, lookY: 2.6, fov: 66 },
  },
  {
    id: 'space', name: 'The Programming Cosmos', discipline: 'The Full Stack Universe',
    tags: ['React', 'Python', 'Docker', 'PostgreSQL', 'the whole galaxy'],
    palette: { top: hex('#02030a'), bottom: hex('#05060f'), sun: hex('#8ea2ff'), sunDir: [0.5, 0.2, -1], sunInt: 0.9, fog: hex('#03040c') },
    cam: { x: 0, y: 0.5, lookY: 0.5, fov: 62 }, rich: true,
  },
  {
    id: 'future', name: 'The Future Lab', discipline: 'Where It All Comes Together',
    tags: ['projects', 'vision', 'you', 'let’s build'],
    palette: { top: hex('#0a1220'), bottom: hex('#050a14'), sun: hex('#00e5ff'), sunDir: [0.0, 0.3, -1], sunInt: 0.42, fog: hex('#08131f') },
    cam: { x: 0, y: 1.6, lookY: 1.6, fov: 56 },
  },
];

// World-to-world distance along -Z. Must exceed the fog depth so a neighbouring
// world is never visible from the current one — you fly through fog between them.
export const SPACING = 300;
export const worldZ = (i) => -i * SPACING;
