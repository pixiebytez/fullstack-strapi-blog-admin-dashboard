interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  return <div className="prose max-w-none whitespace-pre-wrap">{content}</div>;
}
