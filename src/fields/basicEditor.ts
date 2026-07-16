import {
  BoldFeature,
  InlineCodeFeature,
  ItalicFeature,
  LinkFeature,
  lexicalEditor,
  ParagraphFeature,
  StrikethroughFeature,
  SubscriptFeature,
  SuperscriptFeature,
  UnderlineFeature,
} from '@payloadcms/richtext-lexical'

/**
 * A deliberately minimal rich-text editor for body copy: paragraphs plus
 * inline marks (bold, italic, underline, strikethrough, inline code,
 * sub/superscript) and links. No headings, lists, images, blockquotes,
 * alignment or other layout-changing nodes — those belong in the dedicated
 * `richText` block, not inline body text.
 */
export const basicEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    InlineCodeFeature(),
    SubscriptFeature(),
    SuperscriptFeature(),
    LinkFeature({}),
  ],
})
