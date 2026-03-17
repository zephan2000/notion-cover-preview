import { Copy, Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

type Props = {
  data: unknown;
  collapsible?: boolean;
};

export const JsonOutput = ({ data, collapsible = false }: Props) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const json = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs text-muted-foreground font-mono">response.json</span>
        <div className="flex items-center gap-3">
          {collapsible && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronsUpDown className="w-3 h-3" />
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <pre
        className={`p-4 text-sm font-mono text-foreground/80 overflow-x-auto no-scrollbar leading-relaxed ${
          collapsible && !expanded ? 'max-h-[200px] overflow-y-auto' : ''
        }`}
      >
        {json}
      </pre>
    </div>
  );
};
