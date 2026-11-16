"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyCommand } from "@/components/copy-command";
import { commandFor, needsLicense, queryFor, type AgentId, type Catalog, type Config } from "@/lib/harness/catalog";
import type { PreviewFile } from "@/lib/harness/preview";

type Props = { catalog: Catalog; initialConfig: Config; initialFiles: PreviewFile[] };

function Tag({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "ask" | "allow" }) {
  return <span className={`chip shrink-0 chip-${tone}`}>{children}</span>;
}

function Choice({
  type,
  name,
  checked,
  disabled,
  onChange,
  title,
  note,
  tag,
  tone,
}: {
  type: "radio" | "checkbox";
  name: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  title: string;
  note: string;
  tag?: string;
  tone?: "plain" | "ask" | "allow";
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border p-3 transition-colors duration-300 ease-base has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-signal ${
        checked ? "border-line bg-panel-2" : "border-transparent hover:bg-panel"
      } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <input type={type} name={name} checked={checked} disabled={disabled} onChange={onChange} className="mt-1 h-4 w-4 shrink-0 accent-signal focus-visible:outline-none" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center justify-between gap-3">
          <span className="title-3 text-fg">{title}</span>
          {tag ? <Tag tone={tone}>{tag}</Tag> : null}
        </span>
        <span className="caption-2 text-muted">{note}</span>
      </span>
    </label>
  );
}

/** Lets a long path wrap after a slash instead of in the middle of a name. */
function breakable(path: string) {
  return path.split("/").flatMap((part, i, all) => (i < all.length - 1 ? [`${part}/`, <wbr key={i} />] : [part]));
}

export function Builder({ catalog, initialConfig, initialFiles }: Props) {
  const [config, setConfig] = useState<Config>(initialConfig);
  const [selected, setSelected] = useState("AGENTS.md");
  const [attempt, setAttempt] = useState(0);
  // The last preview that arrived, and the request that last failed. "Loading" is derived from them.
  const [preview, setPreview] = useState({ query: queryFor(initialConfig), files: initialFiles });
  const [failure, setFailure] = useState<string | null>(null);

  const query = queryFor(config);
  const request = `${query}#${attempt}`;
  const status: "ready" | "loading" | "error" = preview.query === query ? "ready" : failure === request ? "error" : "loading";
  const files = preview.files;

  useEffect(() => {
    if (preview.query === query) return;
    const controller = new AbortController();
    // Keep the address bar shareable: /new?stack=expo&packs=quality opens with those choices.
    window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
    fetch(`/api/harness?${query}&preview=1`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((body: { files: PreviewFile[] }) => setPreview({ query, files: body.files }))
      .catch((error) => {
        if (error?.name !== "AbortError") setFailure(request);
      });
    return () => controller.abort();
  }, [query, request, preview.query]);

  const paid = needsLicense(config);
  const command = commandFor(config);
  const current = files.find((f) => f.path === selected) ?? files[0];
  const mine = files.filter((f) => f.owner === "you").length;
  const plural = useMemo(() => new Intl.PluralRules("en"), []);
  const count = (n: number, one: string, many: string) => `${n} ${plural.select(n) === "one" ? one : many}`;

  const setStack = (stack: string) => setConfig((c) => ({ ...c, stack }));
  const toggleAgent = (id: AgentId) =>
    setConfig((c) => {
      const next = c.agents.includes(id) ? c.agents.filter((a) => a !== id) : [...c.agents, id];
      // At least one agent stays selected; order follows the catalog.
      return next.length ? { ...c, agents: catalog.agents.map((a) => a.id).filter((a) => next.includes(a)) } : c;
    });
  const togglePack = (id: string) =>
    setConfig((c) => {
      const next = c.packs.includes(id) ? c.packs.filter((p) => p !== id) : [...c.packs, id];
      return { ...c, packs: catalog.packs.map((p) => p.id).filter((p) => next.includes(p)) };
    });

  return (
    <div className="grid gap-12 lg:grid-cols-[2fr_3fr]">
      <form className="flex flex-col gap-8" onSubmit={(event) => event.preventDefault()}>
        <fieldset className="flex flex-col gap-3">
          <legend className="heading-6 pb-3">Your stack</legend>
          <div className="flex flex-col gap-1">
            {catalog.stacks.map((stack) => (
              <Choice key={stack.id} type="radio" name="stack" checked={config.stack === stack.id} onChange={() => setStack(stack.id)} title={stack.title} note={stack.blurb} tag={stack.pro ? "Pro" : "Free"} tone={stack.pro ? "ask" : "allow"} />
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="heading-6 pb-3">Your agents</legend>
          <div className="flex flex-col gap-1">
            {catalog.agents.map((agent) => (
              <Choice
                key={agent.id}
                type="checkbox"
                name="agents"
                checked={config.agents.includes(agent.id)}
                disabled={config.agents.length === 1 && config.agents[0] === agent.id}
                onChange={() => toggleAgent(agent.id)}
                title={agent.title}
                note={agent.enforcement}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="heading-6 pb-3">Packs</legend>
          <div className="flex flex-col gap-1">
            {catalog.packs.map((pack) => (
              <Choice
                key={pack.id}
                type="checkbox"
                name="packs"
                checked={config.packs.includes(pack.id)}
                disabled={pack.required}
                onChange={() => togglePack(pack.id)}
                title={pack.title}
                note={pack.blurb}
                tag={pack.required ? "Always on" : pack.pro ? "Pro" : "Free"}
                tone={pack.required ? "plain" : pack.pro ? "ask" : "allow"}
              />
            ))}
          </div>
        </fieldset>
      </form>

      <div className="flex min-w-0 flex-col gap-8">
        <section aria-labelledby="command-heading" className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-4 md:p-6">
          <h2 id="command-heading" className="heading-6">
            Paste this in your project folder
          </h2>
          <CopyCommand command={command} />
          {paid ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="caption-2 text-muted">
                This selection includes Pro content. With a key, run <code className="whitespace-nowrap text-fg">npx harnay login &lt;key&gt;</code> once, then the command above.
              </p>
              <form action="/api/checkout" method="post" className="flex shrink-0 flex-col">
                <input type="hidden" name="plan" value="pro" />
                <button type="submit" className="btn btn-primary">
                  Subscribe to Pro
                </button>
              </form>
            </div>
          ) : (
            <p className="caption-2 text-muted">Free. No account, no key. The installer shows every file and waits for your yes.</p>
          )}
        </section>

        <section aria-labelledby="files-heading" aria-busy={status === "loading"} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="files-heading" className="heading-6">
              What it writes
            </h2>
            <p className="caption-2 text-muted" role="status">
              {status === "loading" ? "Updating the file list" : `${count(files.length, "file", "files")}. ${count(mine, "is", "are")} yours, the rest update with sync.`}
            </p>
          </div>

          {status === "error" ? (
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-stop bg-panel p-4">
              <p className="body-3">The preview did not load. Your selection is kept and the command above is still right.</p>
              <button type="button" className="btn btn-secondary" onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </button>
            </div>
          ) : (
            <div className={`grid gap-2 rounded-2xl border border-line bg-panel p-2 transition-opacity duration-300 ease-base md:grid-cols-[2fr_3fr] ${status === "loading" ? "opacity-60" : ""}`}>
              <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto md:max-h-128">
                {files.map((file) => {
                  const on = file.path === current?.path;
                  return (
                    <li key={file.path}>
                      <button
                        type="button"
                        aria-current={on ? "true" : undefined}
                        onClick={() => setSelected(file.path)}
                        className={`caption-2 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left font-mono transition-colors duration-300 ease-base ${
                          on ? "bg-panel-2 text-fg" : "text-muted hover:bg-panel-2 hover:text-fg"
                        }`}
                      >
                        <span className="min-w-0 [overflow-wrap:anywhere]">{breakable(file.path)}</span>
                        {file.owner === "you" ? <Tag>Yours</Tag> : file.locked ? <Tag tone="ask">Pro</Tag> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {current ? (
                <div className="flex min-w-0 flex-col gap-3 rounded-lg bg-well p-4">
                  <p className="caption-4 font-mono text-muted [overflow-wrap:anywhere]">{current.path}</p>
                  <pre tabIndex={0} className="caption-2 max-h-112 overflow-auto whitespace-pre-wrap break-words text-fg">
                    {current.content}
                  </pre>
                  {current.locked ? (
                    <p className="caption-2 rounded-lg border border-line bg-panel p-3 text-muted">
                      {count(current.hiddenLines ?? 0, "more line", "more lines")} with Pro. You get the whole file at install, and you can read it before you commit it.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section aria-labelledby="next-heading" className="flex flex-col gap-4">
          <h2 id="next-heading" className="heading-6">
            After the paste
          </h2>
          <ol className="grid gap-4 md:grid-cols-2">
            <li className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-4">
              <p className="title-3">Tell the agent what you are building</p>
              <CopyCommand command={config.agents.includes("claude") ? "/project-brief" : "Use the project-brief skill to fill in PROJECT.md."} where={config.agents.includes("claude") ? "Claude Code" : "agent"} />
              <p className="caption-2 text-muted">It asks about six questions and writes PROJECT.md for you.</p>
            </li>
            <li className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-4">
              <p className="title-3">Check the guard whenever you like</p>
              <CopyCommand command="npx harnay doctor" />
              <p className="caption-2 text-muted">It replays every rule example and fires a test call through the hook.</p>
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
