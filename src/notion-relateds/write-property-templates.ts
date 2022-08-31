import { parseISO } from 'date-fns';

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

export const readPropertyMethods = {
  title: (propertyItem: any): string => propertyItem.results[0].title.text.content,
  rich_text: (propertyItem: any): string => propertyItem.results[0].rich_text.text.content,
  url: (propertyItem: any): string => propertyItem.url,
  date: (propertyItem: any): Date => parseISO(propertyItem.date.start),
}
