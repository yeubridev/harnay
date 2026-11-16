"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyCommand } from "@/components/copy-command";
import { commandFor, needsLicense, queryFor, type AgentId, type Catalog, type Config } from "@/lib/harness/catalog";
import type { PreviewFile } from "@/lib/harness/preview";

type Props = { catalog: Catalog; initialConfig: Config; initialFiles: PreviewFile[] };

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 rounded-[4px] border-2 border-ink px-1.5 text-[0.75rem] font-bold leading-5">{children}</span>;
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
}: {
  type: "radio" | "checkbox";
  name: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  title: string;
  note: string;
  tag?: string;
}) {
  return (
    <label
      className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-control px-3 py-3 transition-colors duration-150 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-ink ${
        checked ? "bg-chalk-3" : "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-chalk-3/50"
      } ${disabled ? "cursor-not-allowed" : ""}`}
    >
      <input type={type} name={name} checked={checked} disabled={disabled} onChange={onChange} className="mt-1 h-5 w-5 shrink-0 accent-ink focus-visible:outline-none" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="font-bold">{title}</span>
          {tag ? <Tag>{tag}</Tag> : null}
        </span>
        <span className="mt-0.5 block text-[0.9375rem] leading-snug">{note}</span>
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
    <div className="grid gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)]">
      <form className="flex flex-col gap-8" onSubmit={(event) => event.preventDefault()}>
        <fieldset>
          <legend className="display mb-2 text-[1.75rem]">Your stack</legend>
          <div className="flex flex-col gap-1">
            {catalog.stacks.map((stack) => (
              <Choice key={stack.id} type="radio" name="stack" checked={config.stack === stack.id} onChange={() => setStack(stack.id)} title={stack.title} note={stack.blurb} tag={stack.pro ? "Pro" : "Free"} />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="display mb-2 text-[1.75rem]">Your agents</legend>
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

        <fieldset>
          <legend className="display mb-2 text-[1.75rem]">Packs</legend>
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
              />
            ))}
          </div>
        </fieldset>
      </form>

      <div className="flex min-w-0 flex-col gap-6">
        <section aria-labelledby="command-heading" className="rounded-panel bg-chalk-2 p-4 md:p-5">
          <h2 id="command-heading" className="display text-[1.75rem]">
            Paste this in your project folder
          </h2>
          <CopyCommand command={command} className="mt-3" />
          {paid ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[0.9375rem] leading-snug">
                This selection includes Pro content. With a key, run <code className="whitespace-nowrap text-[0.875rem]">npx harnay login &lt;key&gt;</code> once, then the command above.
              </p>
              <form action="/api/checkout" method="post" className="shrink-0">
                <input type="hidden" name="plan" value="pro" />
                <button type="submit" className="button w-full whitespace-nowrap sm:w-auto">
                  Get Pro, $19 a month
                </button>
              </form>
            </div>
          ) : (
            <p className="mt-3 text-[0.9375rem]">Free. No account, no key. The installer shows every file and waits for your yes.</p>
          )}
        </section>

        <section aria-labelledby="files-heading" aria-busy={status === "loading"}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="files-heading" className="display text-[1.75rem]">
              What it writes
            </h2>
            <p className="text-[0.9375rem]" role="status">
              {status === "loading" ? "Updating the file list" : `${count(files.length, "file", "files")}. ${count(mine, "is", "are")} yours, the rest update with sync.`}
            </p>
          </div>

          {status === "error" ? (
            <div className="mt-3 flex flex-col items-start gap-3 rounded-panel border-2 border-stop p-4">
              <p>The preview did not load. Your selection is kept and the command above is still right.</p>
              <button type="button" className="button button-quiet" onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </button>
            </div>
          ) : (
            <div className={`mt-3 grid gap-3 transition-opacity duration-150 md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] ${status === "loading" ? "opacity-60" : ""}`}>
              <ul className="max-h-72 overflow-y-auto rounded-panel bg-chalk-2 p-2 md:max-h-[34rem]">
                {files.map((file) => {
                  const on = file.path === current?.path;
                  return (
                    <li key={file.path}>
                      <button
                        type="button"
                        aria-current={on ? "true" : undefined}
                        onClick={() => setSelected(file.path)}
                        className={`flex min-h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-[4px] px-2 py-1.5 text-left font-mono text-[0.8125rem] transition-colors duration-150 ${
                          on ? "bg-signal font-semibold" : "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-chalk-3"
                        }`}
                      >
                        <span className="min-w-0 [overflow-wrap:anywhere]">{breakable(file.path)}</span>
                        {file.owner === "you" ? <Tag>Yours</Tag> : file.locked ? <Tag>Pro</Tag> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {current ? (
                <div className="min-w-0 rounded-panel bg-chalk-2 p-4">
                  <p className="mb-3 break-all font-mono text-[0.8125rem] font-semibold">{current.path}</p>
                  <pre tabIndex={0} className="max-h-[30rem] overflow-auto whitespace-pre-wrap break-words text-[0.8125rem] leading-relaxed">
                    {current.content}
                  </pre>
                  {current.locked ? (
                    <p className="mt-4 rounded-control bg-chalk p-3 text-[0.9375rem]">
                      {count(current.hiddenLines ?? 0, "more line", "more lines")} with Pro. You get the whole file at install, and you can read it before you commit it.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section aria-labelledby="next-heading">
          <h2 id="next-heading" className="display text-[1.75rem]">
            After the paste
          </h2>
          <ol className="mt-3 grid gap-4 md:grid-cols-2">
            <li className="rounded-panel bg-chalk-2 p-4">
              <p className="font-bold">1. Tell the agent what you are building</p>
              <CopyCommand command={config.agents.includes("claude") ? "/project-brief" : "Use the project-brief skill to fill in PROJECT.md."} where={config.agents.includes("claude") ? "Claude Code" : "agent"} className="mt-3" />
              <p className="mt-3 text-[0.9375rem]">It asks about six questions and writes PROJECT.md for you.</p>
            </li>
            <li className="rounded-panel bg-chalk-2 p-4">
              <p className="font-bold">2. Check the guard whenever you like</p>
              <CopyCommand command="npx harnay doctor" className="mt-3" />
              <p className="mt-3 text-[0.9375rem]">It replays every rule example and fires a test call through the hook.</p>
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
