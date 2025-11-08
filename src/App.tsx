import "./App.css";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Rocket,
  Trophy,
  Users,
  LineChart,
  Shield,
  Mail,
  Phone,
  Twitter,
  Send,
} from "lucide-react";

type WaitlistFormValues = {
  name: string;
  email: string;
};

const featureIcons = [Sparkles, ShieldCheck, Rocket];

const stats = [
  { label: "Daily AI Accuracy", value: "94.6%" },
  { label: "Projected APY", value: "46×" },
  { label: "Early Adopters", value: "1,000+" },
];

const valueProps = [
  {
    icon: Users,
    title: "Elite Community",
    description:
      "Join a curated circle of investors and sports intelligence enthusiasts aligned around disciplined growth.",
  },
  {
    icon: LineChart,
    title: "Data-Driven Confidence",
    description:
      "Backed by a proprietary AI engine delivering 94.6% accuracy across thousands of historical simulations.",
  },
  {
    icon: Shield,
    title: "Risk-Managed Growth",
    description:
      "Fixed internal token pricing and spread, automated risk thresholds, and transparent strategy briefings.",
  },
];

const roadmap = [
  {
    title: "Reserve your spot",
    description:
      "Join the waitlist and secure first access to the Rolley staking platform and bonus ROL tokens.",
  },
  {
    title: "Unlock onboarding perks",
    description:
      "Receive early product reveals, private webinars, and direct guidance from the Rolley core team.",
  },
  {
    title: "Launch with momentum",
    description:
      "Activate your staking tiers on day one and compound daily with AI-backed match analysis.",
  },
];

const tiers = [
  { name: "Clay", tagline: "Start your journey" },
  { name: "Metal", tagline: "Accelerate growth" },
  { name: "Bronze", tagline: "Unlock premium returns" },
  { name: "Diamond", tagline: "Elite AI experience" },
];

const backgroundVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 1.6, ease: "easeOut" } },
};

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

function App() {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WaitlistFormValues>({
    defaultValues: { name: "", email: "" },
  });

  const apiBaseUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined;
    if (!envUrl || envUrl.trim().length === 0) {
      return "http://localhost:3001";
    }
    return envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  }, []);

  const onSubmit = async (values: WaitlistFormValues) => {
    setSubmitting(true);
    try {
      await axios.post(
        `${apiBaseUrl}/api/waitlist`,
        {
          name: values.name.trim(),
          email: values.email.trim(),
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success("You're on the list! We'll reach out soon.");
      reset();
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-neutral-100 antialiased">
      <DecorativeBackdrop />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-16 pt-10 md:px-10">
        <header className="flex items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <img src="/logo.png" alt="Rolley logo" className="h-10 w-auto" />
            <span className="font-display text-lg tracking-wide text-neutral-200">
              Rolley
            </span>
          </motion.div>

          <motion.a
            href="#waitlist"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-neutral-100 transition hover:border-primary hover:bg-primary/20"
          >
            Early access perks
            <ArrowRight className="h-4 w-4" />
          </motion.a>
        </header>

        <main className="mt-12 flex flex-1 flex-col gap-16 md:mt-20 md:gap-20">
          <section className="grid gap-12 md:grid-cols-[minmax(0,1fr),minmax(0,0.9fr)] md:items-center">
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" />
                The Future of Smart Staking Starts Here
              </div>

              <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl md:text-6xl">
                Earn daily returns powered by{" "}
                <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  94.6% accurate AI
                </span>
              </h1>

              <p className="max-w-xl text-lg text-neutral-300 md:text-xl">
                Join 1,000 early adopters unlocking predictable 1.05× daily
                compounding. Secure exclusive access, premium insights, and a{" "}
                <span className="text-primary font-semibold">
                  10% bonus in ROL tokens
                </span>{" "}
                when we launch.
              </p>

              <motion.div
                className="flex flex-wrap gap-6"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {stats.map((stat) => (
                  <motion.div
                    key={stat.label}
                    variants={fadeInUp}
                    className="min-w-[150px] rounded-2xl border border-white/5 bg-white/[0.04] p-4 shadow-glass backdrop-blur-sm"
                  >
                    <div className="text-3xl font-semibold text-white">
                      {stat.value}
                    </div>
                    <p className="mt-1 text-sm text-neutral-400">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              variants={backgroundVariants}
              initial="initial"
              animate="animate"
              className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-[1px] shadow-glass backdrop-blur-xl"
              id="waitlist"
            >
              <div className="rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 sm:p-10">
                <div className="mb-8 space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs uppercase tracking-wide text-primary-light">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Instant confirmation
                  </div>
                  <h2 className="font-display text-3xl text-white">
                    Join the Rolley waitlist
                  </h2>
                  <p className="text-sm text-neutral-400">
                    Be among the first to access our AI staking engine and earn
                    bonus ROL tokens at launch.
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-200">
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="Ada Lovelace"
                      {...register("name", {
                        required: "Please share your name",
                        minLength: { value: 2, message: "Name is too short" },
                      })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-base text-white outline-none transition focus:border-primary focus:bg-white/5"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-400">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-200">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...register("email", {
                        required: "Email helps us stay in touch",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Enter a valid email address",
                        },
                      })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-base text-white outline-none transition focus:border-primary focus:bg-white/5"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-400">{errors.email.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-3 text-base font-semibold text-white shadow-glow transition hover:from-primary-light hover:to-secondary disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? "Joining..." : "Join the waitlist"}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </button>

                  <p className="text-xs text-neutral-500">
                    We respect privacy. No spam—only launch updates and premium
                    insights.
                  </p>
                </form>
              </div>
            </motion.div>
          </section>

          <section className="grid gap-10 md:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)] md:items-center">
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-neutral-500">
                <Trophy className="h-4 w-4 text-primary" />
                Tiered Rewards
              </div>
              <h2 className="font-display text-3xl text-white sm:text-4xl">
                Exclusive early-access tiers with{" "}
                <span className="text-primary">bonus ROL tokens</span>
              </h2>
              <p className="max-w-xl text-neutral-400">
                Unlock higher yield tiers, private AI insights, and concierge
                onboarding. Waitlist members get priority for Clay, Metal,
                Bronze, and Diamond slots on launch day.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {tiers.map((tier, index) => {
                  const Icon = featureIcons[index % featureIcons.length];
                  return (
                    <motion.div
                      key={tier.name}
                      variants={fadeInUp}
                      className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur-sm transition hover:border-primary/50 hover:bg-primary/10"
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-display text-lg text-white">
                            {tier.name}
                          </h3>
                          <p className="text-xs uppercase tracking-wide text-neutral-500">
                            {tier.tagline}
                          </p>
                        </div>
                      </div>
                      <ul className="space-y-2 text-sm text-neutral-400">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Guaranteed launch allocation
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Bonus ROL signup rewards
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          AI strategy unlocks & private briefings
                        </li>
                      </ul>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-secondary/20 opacity-80" />
              <img
                src="/all.png"
                alt="Rolley tier cards"
                className="relative z-10 w-full"
                loading="lazy"
              />
            </motion.div>
          </section>
        </main>

        <section className="mt-12 rounded-3xl border border-white/5 bg-white/[0.03] px-6 py-12 shadow-glass backdrop-blur-lg md:px-10">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="grid gap-10 md:grid-cols-[minmax(0,1fr),minmax(0,1fr)]"
          >
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-primary">
                Why Rolley
              </div>
              <h2 className="font-display text-3xl text-white sm:text-4xl">
                Built from the ground up for disciplined, transparent wealth
                creation
              </h2>
              <p className="text-neutral-400">
                Rolley merges predictive sports intelligence, smart tokenomics,
                and a premium experience designed for serious investors seeking
                consistent growth without volatility. Waitlist members become
                the first to influence roadmap decisions and feature rollouts.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {valueProps.map(({ icon: Icon, title, description }) => (
                <motion.div
                  key={title}
                  variants={fadeInUp}
                  className="rounded-2xl border border-white/5 bg-white/[0.04] p-5"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg text-white">{title}</h3>
                  <p className="mt-2 text-sm text-neutral-400">{description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="mt-16 grid gap-10 md:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)] md:items-center">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-5"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-secondary">
              Launch Path
            </div>
            <h2 className="font-display text-3xl text-white sm:text-4xl">
              Your early-access journey to Rolley
            </h2>
            <p className="max-w-xl text-neutral-400">
              We are curating the first 1,000 users who will help shape the
              final product experience. Here’s what to expect once you join the
              waitlist.
            </p>

            <ol className="space-y-4">
              {roadmap.map((step, index) => (
                <motion.li
                  key={step.title}
                  variants={fadeInUp}
                  className="relative rounded-2xl border border-white/5 bg-white/[0.03] p-5"
                >
                  <span className="absolute -left-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="font-display text-lg text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-400">
                    {step.description}
                  </p>
                </motion.li>
              ))}
            </ol>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="rounded-3xl border border-white/5 bg-gradient-to-br from-secondary/20 via-transparent to-primary/20 p-8 shadow-glass backdrop-blur-xl"
          >
            <h3 className="font-display text-2xl text-white">
              Already building with Web3?
            </h3>
            <p className="mt-3 text-sm text-neutral-300">
              Rolley is engineered for seamless integrations across Polygon,
              custodial wallets, and on-chain analytics. Early partners receive
              direct access to our dev team and infrastructure.
            </p>
            <div className="mt-6 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-neutral-400">
                Coming Soon
              </div>
              <ul className="space-y-3 text-sm text-neutral-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  API access for automated portfolio sync
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Community governance with staking rewards
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Dedicated account managers for Diamond members
                </li>
              </ul>
            </div>
          </motion.div>
        </section>

        <footer className="mt-16 border-t border-white/5 pt-6 text-sm text-neutral-500 md:mt-24">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-neutral-400">© 2025 Rolley. All rights reserved.</p>
              <p className="mt-1 flex items-center gap-2 text-neutral-400">
                <Phone className="h-4 w-4 text-primary" />
                +234 906 913 9404
              </p>
              <a
                href="mailto:rolleycop@gmail.com"
                className="mt-1 inline-flex items-center gap-2 text-neutral-300 transition hover:text-primary"
              >
                <Mail className="h-4 w-4 text-primary" />
                rolleycop@gmail.com
              </a>
            </div>

            <div className="flex flex-col gap-3 text-neutral-400 md:text-right">
              <span className="text-neutral-500">Connect with us</span>
              <div className="flex items-center gap-3 md:justify-end">
                <a
                  href="https://x.com/Rolleycop"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-neutral-300 transition hover:border-primary hover:text-primary"
                >
                  <Twitter className="h-4 w-4" />
                  X (Twitter)
                </a>
                <a
                  href="https://t.me/+jXeXD6cLUzBlNDhk"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-neutral-300 transition hover:border-primary hover:text-primary"
                >
                  <Send className="h-4 w-4" />
                  Telegram
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function DecorativeBackdrop() {
  return (
    <>
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,140,0,0.25),_rgba(5,5,16,0.1))]"
        variants={backgroundVariants}
        initial="initial"
        animate="animate"
      />
      <motion.div
        className="pointer-events-none absolute inset-0 bg-grid-dark [background-size:24px_24px] opacity-40"
        variants={backgroundVariants}
        initial="initial"
        animate="animate"
      />
      <motion.div
        className="pointer-events-none absolute -right-40 top-[-20%] h-[480px] w-[480px] rounded-full bg-primary/20 blur-3xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1.1 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className="pointer-events-none absolute -left-24 bottom-[-20%] h-[520px] w-[520px] rounded-full bg-secondary/20 blur-3xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1.1 }}
        transition={{ duration: 3.4, repeat: Infinity, repeatType: "mirror" }}
      />
    </>
  );
}

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.status === 409) {
      return "You're already on the Rolley waitlist with this email.";
    }
    const message = axiosError.response?.data?.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
    if (axiosError.code === "ERR_NETWORK") {
      return "We couldn't reach the server. Please confirm the API URL in your .env file.";
    }
  }
  return "Something went wrong. Please try again in a moment.";
}

export default App;
