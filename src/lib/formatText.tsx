import React from "react";

// Discord-like text formatting
export function formatText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let key = 0;

  // Process in one pass with regex
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|_(.+?)_|~~(.+?)~~|`(.+?)`|```([\s\S]+?)```|> (.+?)(?:\n|$))/g;

  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={key++}>{text.slice(last, match.index)}</span>);

    const [full, , boldItalic, bold, italic, underlineBold, underline, strike, code, codeblock, quote] = match;

    if (boldItalic) parts.push(<strong key={key++}><em>{boldItalic}</em></strong>);
    else if (bold) parts.push(<strong key={key++} className="font-bold text-white">{bold}</strong>);
    else if (italic) parts.push(<em key={key++} className="italic">{italic}</em>);
    else if (underlineBold) parts.push(<u key={key++} className="underline font-bold">{underlineBold}</u>);
    else if (underline) parts.push(<u key={key++} className="underline">{underline}</u>);
    else if (strike) parts.push(<s key={key++} className="line-through opacity-60">{strike}</s>);
    else if (code) parts.push(<code key={key++} className="px-1.5 py-0.5 rounded text-xs font-mono" style={{background:"rgba(139,92,246,0.2)",color:"#c4b5fd"}}>{code}</code>);
    else if (codeblock) parts.push(<pre key={key++} className="block p-3 rounded-lg text-xs font-mono overflow-x-auto my-1" style={{background:"rgba(0,0,0,0.4)",color:"#a5f3fc",border:"1px solid rgba(99,102,241,0.3)"}}>{codeblock}</pre>);
    else if (quote) parts.push(<blockquote key={key++} className="border-l-4 pl-3 my-1 italic text-slate-400" style={{borderColor:"rgba(139,92,246,0.5)"}}>{quote}</blockquote>);
    else parts.push(<span key={key++}>{full}</span>);

    last = match.index + full.length;
  }

  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>);

  return <>{parts}</>;
}
