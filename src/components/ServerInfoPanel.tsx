import type { ServerInfo } from "@/lib/api";

type Props = {
  info: ServerInfo | null;
  loadErr: string | null;
  variant?: "full" | "ingest" | "compose";
};

export default function ServerInfoPanel({ info, loadErr, variant = "full" }: Props) {
  if (loadErr) {
    return (
      <p className="rounded border border-[var(--danger)]/50 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
        API: {loadErr} — is the backend running at{" "}
        <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_API_URL</code>?
      </p>
    );
  }

  if (!info) return null;

  const show = (key: string) => {
    if (variant === "full") return true;
    if (variant === "ingest")
      return ["gemini_embed_model", "pinecone_index", "chunk_size", "chunk_overlap"].includes(key);
    if (variant === "compose")
      return [
        "cover_letter_history_backend",
        "assistant_rules_backend",
        "gemini_chat_model",
        "gemini_embed_model",
        "pinecone_index",
        "default_rag_k",
        "gemini_max_retries",
      ].includes(key);
    return true;
  };

  return (
    <dl className="grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-2">
      {show("cover_letter_history_backend") && info.cover_letter_history_backend && (
        <div>
          <dt className="inline text-[var(--text)]">History storage</dt>{" "}
          <dd className="inline">
            {info.cover_letter_history_backend === "mongodb" ? "MongoDB" : "Local JSON file"}
          </dd>
        </div>
      )}
      {show("assistant_rules_backend") && info.assistant_rules_backend && (
        <div>
          <dt className="inline text-[var(--text)]">Rules storage</dt>{" "}
          <dd className="inline">
            {info.assistant_rules_backend === "mongodb" ? "MongoDB" : "Local JSON file"}
          </dd>
        </div>
      )}
      {show("gemini_chat_model") && (
        <div>
          <dt className="inline text-[var(--text)]">Chat model</dt> <dd className="inline">{info.gemini_chat_model}</dd>
        </div>
      )}
      {show("gemini_embed_model") && (
        <div>
          <dt className="inline text-[var(--text)]">Embed model</dt>{" "}
          <dd className="inline">{info.gemini_embed_model}</dd>
        </div>
      )}
      {show("pinecone_index") && (
        <div>
          <dt className="inline text-[var(--text)]">Pinecone</dt>{" "}
          <dd className="inline">
            {info.pinecone_index} / {info.pinecone_namespace}
          </dd>
        </div>
      )}
      {show("chunk_size") && (
        <div>
          <dt className="inline text-[var(--text)]">Chunking</dt>{" "}
          <dd className="inline">
            {info.chunk_size} / {info.chunk_overlap} overlap
          </dd>
        </div>
      )}
      {show("default_rag_k") && (
        <div>
          <dt className="inline text-[var(--text)]">Default chunks</dt>{" "}
          <dd className="inline">{info.default_rag_k}</dd>
        </div>
      )}
      {show("gemini_max_retries") && info.gemini_max_retries != null && (
        <div>
          <dt className="inline text-[var(--text)]">API retries (429)</dt>{" "}
          <dd className="inline">
            up to {info.gemini_max_retries} attempts
            {info.gemini_retry_cap_seconds != null
              ? ` · max ${info.gemini_retry_cap_seconds}s wait per retry`
              : ""}
          </dd>
        </div>
      )}
    </dl>
  );
}
