import { useEffect, useRef } from "react";

interface LatexContentProps {
  content: string;
  className?: string;
}

// Render LaTeX math + Markdown formatting
export function LatexContent({ content, className = "" }: LatexContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Convert Markdown-like syntax to HTML first
  const toHtml = (text: string) => {
    return text
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-heading font-bold mt-4 mb-2 text-primary">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-heading font-semibold mt-3 mb-1">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li class="mr-4 list-disc text-sm">$1</li>')
      .replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" class="text-primary underline">$1</a>')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, '<br/>');
  };

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = toHtml(content);

    // Trigger KaTeX rendering
    const render = () => {
      if (ref.current && (window as any).renderMathInElement) {
        try {
          (window as any).renderMathInElement(ref.current, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "$", right: "$", display: false },
              { left: "\\[", right: "\\]", display: true },
              { left: "\\(", right: "\\)", display: false },
            ],
            throwOnError: false,
            errorColor: "#cc0000",
          });
        } catch (e) {
          console.warn("KaTeX render error:", e);
        }
      }
    };

    if ((window as any).__katexReady) {
      render();
    } else {
      document.addEventListener("katex-ready", render, { once: true });
      // Fallback: try after 1s
      setTimeout(render, 1000);
    }
  }, [content]);

  return (
    <div
      ref={ref}
      dir="rtl"
      className={`latex-content text-sm leading-8 ${className}`}
    />
  );
}

// Inline LaTeX editor toolbar helper
export const LATEX_SNIPPETS = [
  { label: "معادلة سطرية", insert: "$...$", display: false },
  { label: "معادلة منفصلة", insert: "$$\n...\n$$", display: true },
  { label: "كسر", insert: "\\frac{البسط}{المقام}", display: false },
  { label: "جذر", insert: "\\sqrt{x}", display: false },
  { label: "أس", insert: "x^{n}", display: false },
  { label: "تكامل", insert: "\\int_{a}^{b} f(x)\\,dx", display: false },
  { label: "مجموع Σ", insert: "\\sum_{i=1}^{n} x_i", display: false },
  { label: "اشتقاق", insert: "\\frac{d}{dx}", display: false },
  { label: "ألفا–أوميغا", insert: "\\alpha \\beta \\gamma \\delta \\omega", display: false },
  { label: "معادلة كيميائية", insert: "\\text{H}_2\\text{O}", display: false },
  { label: "تفاعل كيميائي", insert: "\\text{A} + \\text{B} \\rightarrow \\text{C}", display: false },
  { label: "موجة ضوء", insert: "E = h\\nu = \\frac{hc}{\\lambda}", display: false },
];
