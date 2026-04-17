'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type BlogEditorProps = {
  content: string
  onChange: (html: string) => void
}

export default function BlogEditor({ content, onChange }: BlogEditorProps) {
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Underline,
        Image.configure({
          HTMLAttributes: {
            style: 'max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;',
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            style: 'color: #F59E0B;',
          },
        }),
        Placeholder.configure({
          placeholder:
            'Start writing your post…\n\nTip: Use H2 for main sections, H3 for sub-sections. Keep paragraphs short for easy reading.',
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
      ],
      content,
      onUpdate: ({ editor: ed }) => {
        onChange(ed.getHTML())
      },
      editorProps: {
        attributes: {
          style:
            'outline: none; min-height: 400px; padding: 20px; color: white; font-size: 15px; line-height: 1.8;',
        },
      },
    },
    [],
  )

  async function insertImageFromFile(file: File) {
    if (!editor) return
    setUploadingImage(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `blog/inline-${Date.now()}.${ext}`

      const { error } = await supabase.storage.from('blog-images').upload(path, file, { upsert: true })

      if (error) throw error

      const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(path)

      editor.chain().focus().setImage({ src: urlData.publicUrl }).run()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`Image upload failed: ${msg}`)
    } finally {
      setUploadingImage(false)
    }
  }

  function setLink() {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Enter URL:', previousUrl ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  if (!editor) return null

  const btnStyle = (active: boolean, disabled?: boolean) =>
    ({
      background: active ? '#F59E0B' : '#1E293B',
      color: active ? '#000' : '#94A3B8',
      border: 'none',
      borderRadius: '6px',
      padding: '6px 10px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '13px',
      fontWeight: active ? 700 : 400,
      minWidth: '32px',
      opacity: disabled ? 0.45 : 1,
    }) as const

  return (
    <div
      style={{
        border: '1px solid #334155',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#0F172A',
      }}
    >
      <div
        style={{
          background: '#1E293B',
          borderBottom: '1px solid #334155',
          padding: '8px 12px',
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={btnStyle(editor.isActive('bold'))} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={btnStyle(editor.isActive('italic'))} title="Italic">
          <em>I</em>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} style={btnStyle(editor.isActive('underline'))} title="Underline">
          <u>U</u>
        </button>

        <div style={{ width: '1px', height: '24px', background: '#334155', margin: '0 4px' }} />

        {([1, 2, 3] as const).map((level) => (
          <button
            type="button"
            key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            style={btnStyle(editor.isActive('heading', { level }))}
            title={`Heading ${level}`}
          >
            H{level}
          </button>
        ))}

        <div style={{ width: '1px', height: '24px', background: '#334155', margin: '0 4px' }} />

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} style={btnStyle(editor.isActive('bulletList'))} title="Bullet list">
          • List
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} style={btnStyle(editor.isActive('orderedList'))} title="Numbered list">
          1. List
        </button>

        <div style={{ width: '1px', height: '24px', background: '#334155', margin: '0 4px' }} />

        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} style={btnStyle(editor.isActive('blockquote'))} title="Blockquote">
          “ ”
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} style={btnStyle(editor.isActive('codeBlock'))} title="Code block">
          {'</>'}
        </button>

        <div style={{ width: '1px', height: '24px', background: '#334155', margin: '0 4px' }} />

        <button type="button" onClick={setLink} style={btnStyle(editor.isActive('link'))} title="Insert link">
          🔗
        </button>
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={uploadingImage}
          style={btnStyle(false, uploadingImage)}
          title="Insert image"
        >
          {uploadingImage ? '⏳' : '🖼️'}
        </button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} style={btnStyle(false)} title="Horizontal divider">
          ─
        </button>

        <div style={{ width: '1px', height: '24px', background: '#334155', margin: '0 4px' }} />

        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} style={btnStyle(false, !editor.can().undo())} title="Undo">
          ↩
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} style={btnStyle(false, !editor.can().redo())} title="Redo">
          ↪
        </button>

        <span style={{ marginLeft: 'auto', color: '#475569', fontSize: '11px' }}>
          {editor.getText().split(/\s+/).filter(Boolean).length} words
        </span>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void insertImageFromFile(file)
          e.target.value = ''
        }}
        style={{ display: 'none' }}
      />

      <EditorContent editor={editor} />

      <style>{`
        .ProseMirror h1 { color: white; font-size: 28px; font-weight: 700; margin: 24px 0 12px; line-height: 1.3; }
        .ProseMirror h2 { color: white; font-size: 22px; font-weight: 600; margin: 20px 0 10px; line-height: 1.3; }
        .ProseMirror h3 { color: white; font-size: 18px; font-weight: 600; margin: 16px 0 8px; }
        .ProseMirror p { margin: 0 0 12px; color: #CBD5E1; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 24px; color: #CBD5E1; margin: 0 0 12px; }
        .ProseMirror li { margin-bottom: 4px; }
        .ProseMirror blockquote { border-left: 3px solid #F59E0B; padding-left: 16px; margin: 16px 0; color: #94A3B8; font-style: italic; }
        .ProseMirror pre { background: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 16px; overflow-x: auto; margin: 16px 0; }
        .ProseMirror code { color: #F59E0B; font-size: 13px; }
        .ProseMirror hr { border: none; border-top: 1px solid #334155; margin: 24px 0; }
        .ProseMirror a { color: #F59E0B; text-decoration: underline; }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #334155; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; white-space: pre-wrap;
        }
        .ProseMirror img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; display: block; }
        .ProseMirror:focus { outline: none; }
      `}</style>
    </div>
  )
}
