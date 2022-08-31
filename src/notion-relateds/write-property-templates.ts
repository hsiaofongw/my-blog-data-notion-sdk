export const writePropertyTemplates = {
  title: (content: string) => ({
    title: [{ type: "text", text: { content: content } }],
  }),
  date: (content: Date) => ({ date: { start: content.toISOString() } }),
  url: (content: string) => ({ url: content }),
  rich_text: (content: string) => ({
    rich_text: [{ type: "text", text: { content } }],
  }),
  multi_select: (content: Array<string>) => ({
    multi_select: content.map((option) => ({ name: option })),
  }),
};
