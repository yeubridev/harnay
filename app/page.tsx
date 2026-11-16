import Link from "next/link";
import { CopyCommand } from "@/components/copy-command";
import { Layers } from "@/components/layers";
import { SessionReplay } from "@/components/session-replay";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { catalog } from "@/lib/harness/catalog";
import { guardStats, layers, proofRows, sessionReplay } from "@/lib/landing";

const INIT = "npx harnay@latest init";

const VERDICT_LABEL = { deny: "Blocked", ask: "Asks you", allow: "Runs" } as const;
const VERDICT_STYLE = {
  deny: "bg-stop text-chalk border-stop",
  ask: "bg-signal text-ink border-ink",
  allow: "text-go border-go",
} as const;

const faq = [
  {
    q: "There are free harness repos on GitHub. Why would I pay?",
    a: "You may not need to. The guard, the rules file and the project brief are free for any project, for good. Pro adds the stack templates, the skills and the reviewers, and keeps them current: when Claude Code changes a format or a new failure pattern shows up, npx harnay sync brings the fix to your repo.",
  },
  {
    q: "Can the agent switch the guard off?",
    a: "It is told no three ways. Permission rules deny edits to .claude/settings.json and the hooks folder. The guard refuses shell commands that modify, move or delete those files. And npx harnay doctor fails when a managed file has changed, which you can run in CI. A person with a terminal can always remove it. That is the point: the decision stays with you.",
  },
  {
    q: "Does it still work in bypass-permissions mode?",
    a: "Claude Code documents that deny rules block in every mode, including bypassPermissions, and that PreToolUse hooks run before the permission prompt. The harness uses both. We still do not recommend bypass mode outside a sandbox.",
  },
  {
    q: "Is the guard a sandbox?",
    a: "No. It reads the command the agent is about to run and matches it against rules. It cannot see inside a script the agent did not write, or a binary. Treat it as a seatbelt and turn on Claude Code's sandbox as well if you want operating-system isolation.",
  },
  {
    q: "What does Harnay see of my code?",
    a: "Nothing. The CLI downloads text files and writes them into your repo. It uploads nothing, and the guard makes no network calls. Every file is plain text you can read before and after install.",
  },
  {
    q: "I already have a CLAUDE.md. What happens to it?",
    a: "The installer shows every file it will create or replace and waits for your yes. Replaced files are copied to .harnay/backup first. Move your own rules into PROJECT.md, which Harnay never overwrites.",
  },
  {
    q: "Does it work with Cursor and Codex?",
    a: "Cursor gets the same guard through Cursor's hook system. That adapter follows Cursor's documented contract and is in beta. Codex reads AGENTS.md and the skills, but it has no hook to enforce anything, so there it is guidance only. We say so in the builder.",
  },
  {
    q: "How do I cancel?",
    a: "From Manage subscription in the footer, with your license key. It opens Stripe's portal, where cancelling takes one click. What is already in your repo keeps working. Ask within 14 days of your first payment and we refund it.",
  },
];

export default function Home() {
  const stats = guardStats();
  const replay = sessionReplay();
  const inside = layers();
  const proof = proofRows();

  return (
    <>
      <SiteHeader />
      <main id="main">
        {/* Hero */}
        <section className="shell grid items-center gap-x-14 gap-y-12 pb-20 pt-8 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,31rem)] lg:pb-28">
          <div data-reveal>
            <h1 className="display text-[clamp(3.25rem,8.2vw,6rem)]">Put your coding agent in a harness.</h1>
            <p className="mt-6 max-w-[30rem] text-xl md:text-[1.375rem] md:leading-snug">One command installs rules, permissions and a guard hook for Claude Code.</p>
            <div className="mt-8 flex max-w-[30rem] flex-col gap-3">
              <CopyCommand command={INIT} />
              <Link href="/new" className="button self-start">
                Build your harness
              </Link>
            </div>
            <p className="mt-6 max-w-[30rem] text-base">Free for any project. Every file is plain text you can read before it lands in your repo.</p>
          </div>
          <div data-reveal style={{ "--reveal-order": 2 } as React.CSSProperties}>
            <SessionReplay prompt="Reset the staging data and ship the fix." lines={replay} />
            <p className="mt-3 text-[0.9375rem]">
              These verdicts are computed by the rules file the command installs. <code className="whitespace-nowrap text-[0.875rem]">npx harnay doctor</code> replays all {stats.examples} examples on your machine.
            </p>
          </div>
        </section>

        {/* Problem */}
        <section className="bg-chalk-2 py-24 md:py-36">
          <div className="shell grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div data-reveal>
              <h2 className="display text-[clamp(2.5rem,5.4vw,4.25rem)]">A rule in a markdown file is a request.</h2>
              <p className="mt-6 max-w-[32rem]">
                CLAUDE.md, AGENTS.md and system prompts tell the agent what you want. Nothing makes it comply. Claude Code&apos;s own documentation is direct about it:
              </p>
              <blockquote className="mt-6 max-w-[32rem] border-l-4 border-ink pl-5 text-xl font-medium leading-snug">
                <p>&ldquo;Claude treats them as context, not enforced configuration. To block an action regardless of what Claude decides, use a PreToolUse hook instead.&rdquo;</p>
                <footer className="mt-3 text-base font-normal">
                  <a className="link" href="https://code.claude.com/docs/en/memory" rel="noreferrer">
                    Claude Code docs, &ldquo;How Claude remembers your project&rdquo;
                  </a>
                </footer>
              </blockquote>
            </div>
            <ol className="flex flex-col gap-10 lg:pt-3">
              <li data-reveal style={{ "--reveal-order": 1 } as React.CSSProperties}>
                <p className="display text-[1.75rem]">July 2025</p>
                <p className="mt-2 max-w-[32rem]">
                  Replit&apos;s agent deleted a live production database during a code freeze, against explicit instructions not to proceed without human approval. Its own summary afterwards: &ldquo;This was a catastrophic failure on my part.&rdquo;
                </p>
                <a className="link mt-2 inline-block py-1 text-base" href="https://fortune.com/2025/07/23/ai-coding-tool-replit-wiped-database-called-it-a-catastrophic-failure/" rel="noreferrer">
                  Reported by Fortune
                </a>
              </li>
              <li data-reveal style={{ "--reveal-order": 2 } as React.CSSProperties}>
                <p className="display text-[1.75rem]">2026</p>
                <p className="mt-2 max-w-[32rem]">
                  A coding agent deleted PocketOS&apos;s production database and its backups in nine seconds, then wrote: &ldquo;I violated every principle I was given.&rdquo;
                </p>
                <a
                  className="link mt-2 inline-block py-1 text-base"
                  href="https://www.pcgamer.com/software/ai/here-we-go-again-ai-deletes-entire-company-database-and-all-backups-in-9-seconds-then-cheerfully-admits-i-violated-every-principle-i-was-given/"
                  rel="noreferrer"
                >
                  Reported by PC Gamer
                </a>
              </li>
              <li data-reveal style={{ "--reveal-order": 3 } as React.CSSProperties}>
                <p className="max-w-[32rem] text-xl font-semibold leading-snug">Both agents had been told not to. Harnay puts the rule in a hook that runs before the command does, and leaves the yes or no with you.</p>
              </li>
            </ol>
          </div>
        </section>

        {/* What it installs */}
        <section id="inside" className="py-24 md:py-36">
          <div className="shell">
            <div data-reveal className="mb-10 max-w-[44rem] lg:mb-4">
              <h2 className="display text-[clamp(2.5rem,5.4vw,4.25rem)]">What one command puts in your repo</h2>
              <p className="mt-6">Text files you can read, commit and review like any other code. Nothing runs in the cloud and nothing phones home.</p>
            </div>
            <Layers steps={inside.steps} tree={inside.tree} />
          </div>
        </section>

        {/* Setup */}
        <section id="setup" className="bg-chalk-2 py-24 md:py-36">
          <div className="shell">
            <h2 data-reveal className="display max-w-[40rem] text-[clamp(2.5rem,5.4vw,4.25rem)]">
              Set up in three pastes
            </h2>
            <ol className="mt-14 grid gap-x-10 gap-y-14 lg:grid-cols-3">
              <li data-reveal>
                <p className="display text-[4.5rem] leading-none" aria-hidden="true">
                  1
                </p>
                <h3 className="mt-3 text-xl font-bold">In your project folder</h3>
                <CopyCommand command={INIT} className="mt-4" />
                <p className="mt-4 text-base">It lists every file it will write and waits for your yes. Anything it replaces is backed up first.</p>
              </li>
              <li data-reveal style={{ "--reveal-order": 1 } as React.CSSProperties}>
                <p className="display text-[4.5rem] leading-none" aria-hidden="true">
                  2
                </p>
                <h3 className="mt-3 text-xl font-bold">In Claude Code</h3>
                <CopyCommand command="/project-brief" where="Claude Code" className="mt-4" />
                <p className="mt-4 text-base">The agent asks about six questions, one at a time, and writes PROJECT.md. That is the only file you author.</p>
              </li>
              <li data-reveal style={{ "--reveal-order": 2 } as React.CSSProperties}>
                <p className="display text-[4.5rem] leading-none" aria-hidden="true">
                  3
                </p>
                <h3 className="mt-3 text-xl font-bold">Whenever you want proof</h3>
                <CopyCommand command="npx harnay doctor" className="mt-4" />
                <p className="mt-4 text-base">Replays the guard&apos;s examples, fires a test call through the hook and checks that no managed file has changed.</p>
              </li>
            </ol>
            <div data-reveal className="mt-14">
              <Link href="/new" className="button">
                Choose your stack first
              </Link>
            </div>
          </div>
        </section>

        {/* Stacks */}
        <section id="stacks" className="py-24 md:py-36">
          <div className="shell grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <div data-reveal>
              <h2 className="display text-[clamp(2.5rem,5.4vw,4.25rem)]">Templates for the stack you are on</h2>
              <p className="mt-6">Each one adds the conventions that stack gets wrong most often when an agent writes it, and pre-approves its test, lint and build commands.</p>
            </div>
            <ul className="flex flex-col">
              {catalog.stacks.map((stack, i) => (
                <li key={stack.id} data-reveal style={{ "--reveal-order": i } as React.CSSProperties} className={i ? "border-t-2 border-chalk-3" : ""}>
                  <Link href={`/new?stack=${stack.id}`} className="group grid gap-x-6 gap-y-1 py-5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto] md:items-baseline">
                    <span className="display text-[1.75rem] decoration-2 underline-offset-4 group-hover:underline">{stack.title}</span>
                    <span className="text-base">{stack.blurb}</span>
                    <span className="text-base font-bold">{stack.pro ? "Pro" : "Free"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Proof */}
        <section id="proof" className="bg-chalk-2 py-24 md:py-36">
          <div className="shell grid gap-x-16 gap-y-14 lg:grid-cols-2">
            <div>
              <h2 data-reveal className="display text-[clamp(2.5rem,5.4vw,4.25rem)]">
                Check it yourself
              </h2>
              <p data-reveal className="mt-6 max-w-[32rem]">
                The guard has {stats.rules} rules. Each one carries the commands it must block, the ones it must hand back to you and the ones it must leave alone: {stats.examples} examples in all. Install replays them on your machine, and so does <code className="whitespace-nowrap text-base">npx harnay doctor</code>.
              </p>
              <ul data-reveal className="mt-8 flex flex-col gap-2.5">
                {proof.map((row) => (
                  <li key={row.command} className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-baseline gap-x-3">
                    <span className={`rounded-[4px] border-2 px-1.5 py-px text-center text-[0.8125rem] font-bold ${VERDICT_STYLE[row.decision]}`}>{VERDICT_LABEL[row.decision]}</span>
                    <code className="text-[0.875rem] [overflow-wrap:anywhere]">{row.command}</code>
                  </li>
                ))}
              </ul>
              <p data-reveal className="mt-6 text-base">
                <Link href="/docs#rules" className="link">
                  Read all {stats.rules} rules
                </Link>
              </p>
            </div>
            <div data-reveal style={{ "--reveal-order": 1 } as React.CSSProperties}>
              <h3 className="display text-[2rem]">What it does not do</h3>
              <ul className="mt-5 flex max-w-[32rem] flex-col gap-4">
                <li>It does not make an agent safe. It stops the commands on its list and asks you about the ones that depend on context.</li>
                <li>It cannot read inside a program it did not see being written. A script from the internet can still do anything, which is why piping a download into a shell is blocked.</li>
                <li>It does not replace backups, a staging database or a second pair of eyes on a pull request.</li>
                <li>On Codex it enforces nothing. Codex has no hook, so there the harness is rules and skills only.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 md:py-36">
          <div className="shell">
            <h2 data-reveal className="display text-[clamp(2.5rem,5.4vw,4.25rem)]">
              Pricing
            </h2>
            <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)]">
              <article data-reveal className="flex flex-col rounded-panel bg-chalk-2 p-6 md:p-8">
                <h3 className="display text-[2rem]">Free</h3>
                <p className="mt-2 min-h-12 text-base">For any project, for good.</p>
                <p className="mt-6 flex items-baseline gap-2"><span className="display text-[3.5rem] leading-none">$0</span></p>
                <ul className="mb-8 mt-6 flex flex-col gap-2.5 text-base">
                  <li>The guard: {stats.rules} rules on commands, files and file contents</li>
                  <li>Permission rules for secrets and the harness</li>
                  <li>AGENTS.md and CLAUDE.md working rules</li>
                  <li>The project brief skill</li>
                  <li>
                    <code className="text-[0.875rem]">doctor</code> and <code className="text-[0.875rem]">sync</code>
                  </li>
                </ul>
                <Link href="/new" className="button button-quiet mt-auto">
                  Install the free harness
                </Link>
              </article>

              <article data-reveal style={{ "--reveal-order": 1 } as React.CSSProperties} className="flex flex-col rounded-panel border-2 border-ink bg-chalk p-6 md:p-8">
                <h3 className="display text-[2rem]">Pro</h3>
                <p className="mt-2 min-h-12 text-base">For people shipping a real product with an agent.</p>
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="display text-[3.5rem] leading-none">$19</span>
                  <span className="text-base">per month</span>
                </p>
                <ul className="mb-8 mt-6 flex flex-col gap-2.5 text-base">
                  <li>Everything in Free</li>
                  <li>All stack templates: {catalog.stacks.filter((s) => s.pro).map((s) => s.title).join(", ")}</li>
                  <li>Quality pack: test first, root-cause debugging, verify before done, a code reviewer</li>
                  <li>Design pack: tokens first, every state, a design critic that judges screenshots</li>
                  <li>Ship pack: a security check before merge, reviewable pull requests, a security reviewer</li>
                  <li>
                    Updates through <code className="text-[0.875rem]">npx harnay sync</code>
                  </li>
                </ul>
                <form action="/api/checkout" method="post" className="mt-auto">
                  <input type="hidden" name="plan" value="pro" />
                  <button type="submit" className="button w-full">
                    Get Pro
                  </button>
                </form>
                <p className="mt-3 text-[0.9375rem]">Cancel in one click. Full refund within 14 days.</p>
              </article>

              <article data-reveal style={{ "--reveal-order": 2 } as React.CSSProperties} className="flex flex-col rounded-panel bg-chalk-2 p-6 md:p-8">
                <h3 className="display text-[2rem]">Team</h3>
                <p className="mt-2 min-h-12 text-base">One harness across every repo and every developer.</p>
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="display text-[3.5rem] leading-none">$79</span>
                  <span className="text-base">per month</span>
                </p>
                <ul className="mb-8 mt-6 flex flex-col gap-2.5 text-base">
                  <li>Everything in Pro</li>
                  <li>One license key for up to 10 developers</li>
                  <li>
                    <code className="text-[0.875rem]">harnay doctor</code> in CI fails the build when someone disables the guard
                  </li>
                  <li>Your stack requests go to the front of the queue</li>
                </ul>
                <form action="/api/checkout" method="post" className="mt-auto">
                  <input type="hidden" name="plan" value="team" />
                  <button type="submit" className="button button-quiet w-full">
                    Get Team
                  </button>
                </form>
              </article>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-chalk-2 py-24 md:py-36">
          <div className="shell grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <h2 data-reveal className="display text-[clamp(2.5rem,5.4vw,4.25rem)]">
              Questions people ask before installing
            </h2>
            <div data-reveal className="flex flex-col">
              {faq.map((item, i) => (
                <details key={item.q} className={`group ${i ? "border-t-2 border-chalk-3" : ""}`}>
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-xl font-bold [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span aria-hidden="true" className="display shrink-0 text-[1.75rem] leading-none transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="max-w-[40rem] pb-6">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final call */}
        <section className="bg-signal py-24 md:py-32">
          <div data-reveal className="shell flex flex-col items-start gap-8">
            <h2 className="display max-w-[14ch] text-[clamp(3rem,8vw,6rem)]">Clip in before the next prompt.</h2>
            <div className="flex w-full max-w-[30rem] flex-col gap-3">
              <CopyCommand command={INIT} />
              <Link href="/new" className="button self-start !bg-ink !text-signal hover:!bg-chalk hover:!text-ink">
                Build your harness
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
