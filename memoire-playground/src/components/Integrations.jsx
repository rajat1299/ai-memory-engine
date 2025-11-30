import React from 'react';
import { motion } from 'framer-motion';

const INTEGRATIONS = [
  // Frontend
  "React", "Next.js", "Vue.js", "Nuxt.js", "Svelte", "SvelteKit", "Angular", "Solid.js", "Remix", "Astro",
  // Backend
  "Node.js", "Express", "Python", "Django", "Flask", "FastAPI", "Ruby", "Rails", "Go", "Gin", "Fiber",
  "Rust", "Actix", "Axum", "Java", "Spring Boot", "C#", "ASP.NET Core", "PHP", "Laravel", "Symfony",
  "Kotlin", "Ktor", "Elixir", "Phoenix", "Scala", "Play Framework",
  // Mobile
  "React Native", "Flutter", "Dart", "Swift", "Kotlin", "Xamarin", "Ionic", "NativeScript",
  // Desktop
  "Electron", "Tauri", ".NET MAUI", "Qt", "GTK",
  // AI/ML
  "LangChain", "LlamaIndex", "AutoGPT", "BabyAGI", "CrewAI", "Semantic Kernel", "Haystack",
  "Hugging Face", "OpenAI SDK", "Anthropic SDK",
  // Chatbots
  "Discord Bots", "Slack Apps", "Telegram Bots", "WhatsApp Business", "Microsoft Teams", "Messenger",
  "Twilio", "Intercom", "Zendesk",
  // Serverless
  "AWS Lambda", "Google Cloud Functions", "Azure Functions", "Vercel Functions", "Netlify Functions",
  "Cloudflare Workers", "Deno Deploy", "Railway", "Render", "Fly.io",
  // Cloud
  "AWS", "Google Cloud", "Azure", "DigitalOcean", "Heroku",
  // Containers
  "Docker", "Kubernetes", "Docker Swarm", "Nomad", "OpenShift",
  // Databases
  "PostgreSQL", "Tableau", "Power BI", "Metabase", "Airflow", "Prefect", "Dagster",
  // Gateways
  "Kong", "AWS API Gateway", "Google Cloud Endpoints", "Azure API Management", "Nginx", "Traefik", "Envoy",
  // Monitoring
  "Prometheus", "Grafana", "Datadog", "New Relic", "Sentry", "LogRocket",
  // CI/CD
  "GitHub Actions", "GitLab CI/CD", "Jenkins", "CircleCI", "Travis CI", "Azure DevOps", "Bitbucket",
  // Queues
  "Redis", "RabbitMQ", "Kafka", "AWS SQS", "Google Pub/Sub", "Azure Service Bus",
  // Auth
  "Auth0", "Firebase Auth", "AWS Cognito", "Okta", "Clerk", "Supabase",
  // CMS
  "WordPress", "Strapi", "Contentful", "Sanity", "Drupal", "Joomla",
  // E-commerce
  "Shopify", "WooCommerce", "Magento", "BigCommerce", "Stripe",
  // Low-Code
  "Zapier", "Make", "n8n", "Bubble", "Retool", "Airtable", "Notion",
  // Games
  "Unity", "Unreal Engine", "Godot",
  // IoT
  "Raspberry Pi", "Arduino", "ESP32"
];

const IntegrationPill = ({ name }) => (
  <div className="relative px-6 py-3 bg-white/50 backdrop-blur-sm border border-black/5 rounded-full shadow-sm hover:shadow-md hover:border-accent/30 hover:bg-white/80 transition-all duration-300 cursor-default whitespace-nowrap">
    <span className="text-lg font-semibold text-text/70 hover:text-text transition-colors duration-300">
      {name}
    </span>
  </div>
);

const MarqueeRow = ({ items, direction = "left", speed = 50 }) => {
  return (
    <div className="flex overflow-hidden relative w-full py-4">
      <motion.div
        initial={{ x: direction === "left" ? 0 : "-50%" }}
        animate={{ x: direction === "left" ? "-50%" : 0 }}
        transition={{
          duration: speed,
          ease: "linear",
          repeat: Infinity,
        }}
        className="flex gap-6 px-4"
      >
        {[...items, ...items].map((item, idx) => (
          <IntegrationPill key={`${item}-${idx}`} name={item} />
        ))}
      </motion.div>
    </div>
  );
};

export default function Integrations() {
  return (
    <section className="py-32 border-y border-border/40 bg-secondary/30 relative overflow-hidden">
      {/* Background Noise */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />

      <div className="container mx-auto px-6 mb-16 text-center relative z-10">
        <h3 className="text-3xl md:text-4xl font-display font-medium mb-6">
          Seamless Integration with Your Stack
        </h3>
        <p className="text-lg text-text/60 max-w-2xl mx-auto font-body leading-relaxed">
          Mémoire works where you work. Connect with your favorite frameworks, platforms, and tools instantly.
        </p>
      </div>

      <div className="flex flex-col gap-6 relative z-10">
        <MarqueeRow items={INTEGRATIONS} direction="left" speed={180} />
      </div>

      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-bg via-bg/80 to-transparent pointer-events-none z-20" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg via-bg/80 to-transparent pointer-events-none z-20" />
    </section>
  );
}
